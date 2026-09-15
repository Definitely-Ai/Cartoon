// Read-only website QA plus a locally downloaded print packet. No production jobs.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {PDFDocument} from 'pdf-lib';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_BASE_URL||'http://localhost:21366',dir=process.env.QA_OUTPUT_DIR||'output/city-showcase-20260915/browser';
const edition=JSON.parse(await fs.readFile('lib/city-showcase-20260915.json','utf8'));
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={base,at:new Date().toISOString(),cities:edition.length,slides:[],runtimeErrors:[],productionJobsSubmitted:0};
try{
  const page=await browser.newPage({viewport:{width:1920,height:1080},acceptDownloads:true});
  page.on('pageerror',e=>report.runtimeErrors.push(e.message));
  await page.goto(base+'/gallery/presentation');
  await page.getByRole('button',{name:'Start presentation',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'The Swinging Door large-screen presentation',exact:true});
  await dialog.waitFor();
  const jump=dialog.getByRole('combobox',{name:'Jump to presentation slide',exact:true});
  assert.equal(await jump.locator('option').count(),17);
  for(let i=0;i<17;i++){
    await jump.selectOption(String(i));
    await page.locator('.presentation-content img:visible').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
    assert.equal(await page.locator('.presentation-content img:visible').evaluateAll(imgs=>imgs.some(i=>i.naturalWidth!==1024||i.naturalHeight!==1536)),false);
    const layout=await page.locator('.presentation-content').evaluate(el=>({width:el.clientWidth,height:el.clientHeight,scrollWidth:el.scrollWidth,scrollHeight:el.scrollHeight}));
    assert.ok(layout.scrollWidth<=layout.width+1,'Horizontal overflow on slide '+i);
    // The live studio intentionally scrolls as results and history grow.
    if(i!==2)assert.ok(layout.scrollHeight<=layout.height+2,'Large-screen vertical overflow on slide '+i+': '+JSON.stringify(layout));
    if(i>=4&&i<=15){
      const quote=await page.locator('.presentation-quote').textContent();
      assert.ok(edition.some(c=>quote===`“${c.caption}”`),'Exact editorial caption must be readable outside the image');
      await dialog.getByRole('button',{name:'Source & local context',exact:true}).click();
      await page.locator('.presentation-source a').waitFor();
      assert.match(await page.locator('.presentation-source a').getAttribute('href'),/^https:\/\//);
      await dialog.getByRole('button',{name:'Hide context',exact:true}).click();
    }
    await page.screenshot({path:`${dir}/slide-${String(i+1).padStart(2,'0')}.png`});
    report.slides.push({index:i+1,layout});
  }
  await dialog.getByRole('button',{name:'Exit presentation',exact:true}).click();
  await page.waitForFunction(()=>document.activeElement.textContent==='Start presentation');
  // Native fullscreen refusal must not break presentation controls or focus.
  await page.evaluate(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(Error('QA fallback'));});
  await page.getByRole('button',{name:'Start presentation',exact:true}).click();
  await page.keyboard.press('End');assert.equal(await jump.inputValue(),'16');
  await page.keyboard.press('Home');assert.equal(await jump.inputValue(),'0');
  await page.keyboard.press('PageDown');assert.equal(await jump.inputValue(),'1');
  await page.keyboard.press('Escape');
  assert.equal(await dialog.isVisible(),false);
  assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');
  report.keyboardAndFallback=true;
  await page.getByRole('button',{name:'Select today’s 12 for a PDF',exact:true}).click();
  const downloadEvent=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download 12-cartoon print PDF',exact:true}).click();
  const download=await downloadEvent;assert.equal(await download.failure(),null);
  await download.saveAs(dir+'/national-city-edition-20260915.pdf');
  const pdf=await PDFDocument.load(await fs.readFile(dir+'/national-city-edition-20260915.pdf'));
  assert.equal(pdf.getPageCount(),12);for(const p of pdf.getPages())assert.deepEqual(p.getSize(),{width:612,height:792});
  report.printPacket={pages:12,paper:'US Letter',artworkInches:[3.4,5.1],effectivePPI:301};
  for(const c of edition){
    const r=await page.request.get(base+c.src);assert.equal(r.status(),200);
    assert.equal(createHash('sha256').update(await r.body()).digest('hex'),c.sha256);
    const p=await page.request.get(base+'/gallery/best-of/print/'+c.id);assert.equal(p.status(),200);
  }
  await page.goto(base+'/gallery/best-of');
  await page.getByText('The collection · 52 cartoons',{exact:true}).waitFor();
  await page.getByLabel('Find a cartoon',{exact:true}).fill('Phoenix');
  await page.getByText('The Smartest Upgrade',{exact:true}).waitFor();
  report.galleryAndPrintRoutes=true;
  await page.setViewportSize({width:390,height:844});await page.goto(base+'/gallery/presentation');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.getByRole('button',{name:'Start presentation',exact:true}).click();
  await page.screenshot({path:dir+'/mobile-opening.png'});
  assert.ok(await page.locator('.presentation-content').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  await dialog.getByRole('button',{name:'Live demo',exact:true}).click();
  await page.screenshot({path:dir+'/mobile-live-entry.png'});
  // Public visitors cannot accidentally create a job. Owner interaction is tested separately.
  await page.getByRole('link',{name:'Sign in to generate cartoons',exact:true}).waitFor();
  report.publicDemoAuthBoundary=true;
  assert.deepEqual(report.runtimeErrors,[]);
  await fs.writeFile(dir+'/verification.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({slides:17,cities:12,gallery:52,pdfPages:12,keyboardAndFallback:true,publicAuthBoundary:true,productionJobsSubmitted:0,runtimeErrors:report.runtimeErrors}));
}catch(error){await fs.writeFile(dir+'/failure.json',JSON.stringify({...report,error:error.stack},null,2));throw error;}finally{await browser.close();}
