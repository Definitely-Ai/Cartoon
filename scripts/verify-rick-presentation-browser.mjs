// Public presentation QA; never logs in, queues work, or changes saved data.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {PDFDocument} from 'pdf-lib';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_BASE_URL||'http://localhost:21361';
const dir=process.env.QA_OUTPUT_DIR||'output/presentation-review-20260915/browser';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1100},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/gallery/presentation');
  await page.getByRole('combobox',{name:/^Choose a cartoon/}).waitFor();
  assert.equal(await page.getByRole('combobox',{name:/^Choose a cartoon/}).locator('option').count(),40);
  for(const [id,ppi] of [['fine',301],['classic',256],['medium',205],['large',171]]) {
    await page.getByRole('combobox',{name:/^Artwork size/}).selectOption(id);
    await page.getByText(`${ppi} effective PPI`,{exact:true}).waitFor();
  }
  await page.getByRole('combobox',{name:/^Artwork size/}).selectOption('fine');
  await page.getByRole('combobox',{name:/^Paper/}).selectOption('a4');
  await page.getByRole('combobox',{name:/^Paper/}).selectOption('letter');
  async function download(name,filename){const pending=page.waitForEvent('download');await page.getByRole('button',{name,exact:true}).click();const file=await pending;assert.equal(await file.failure(),null);await file.saveAs(dir+'/'+filename);return PDFDocument.load(await fs.readFile(dir+'/'+filename));}
  const letter=await download('Download 6-cartoon print PDF','six-letter.pdf');
  assert.equal(letter.getPageCount(),6);assert.deepEqual(letter.getPages()[0].getSize(),{width:612,height:792});
  await page.getByRole('button',{name:'Clear selection',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Download 0-cartoon print PDF',exact:true}).isEnabled(),false);
  assert.equal(await page.getByRole('status').filter({hasText:'Your 6-cartoon PDF'}).count(),0,'No stale download message');
  const choices=page.locator('.showcase-selection-grid input[type=checkbox]');
  for(let i=0;i<12;i++)await choices.nth(i).check();
  // Native click avoids Playwright check's assertion for a correctly rejected 13th selection.
  await choices.nth(12).click();
  assert.equal(await choices.nth(12).isChecked(),false);
  await page.getByRole('alert').filter({hasText:'up to 12'}).waitFor();
  await page.getByRole('button',{name:'Preview seasonal one chair',exact:true}).click();
  assert.equal(await choices.nth(12).isChecked(),false,'Preview must not change the packet');
  await page.getByRole('button',{name:'Clear selection',exact:true}).click();
  await choices.nth(0).check();
  for(const paper of ['letter','a4'])for(const size of ['fine','classic','medium','large']){
    await page.getByRole('combobox',{name:/^Paper/}).selectOption(paper);
    await page.getByRole('combobox',{name:/^Artwork size/}).selectOption(size);
    const proof=await download('Download 1-cartoon print PDF',`${size}-${paper}.pdf`);
    assert.equal(proof.getPageCount(),1);
    assert.ok(Math.abs(proof.getPage(0).getWidth()-(paper==='letter'?612:210/25.4*72))<.001);
    assert.ok(Math.abs(proof.getPage(0).getHeight()-(paper==='letter'?792:297/25.4*72))<.001);
  }
  await page.getByRole('button',{name:'Use featured six',exact:true}).click();
  await page.getByRole('combobox',{name:/^Artwork size/}).selectOption('fine');
  await page.getByRole('combobox',{name:/^Choose a cartoon/}).selectOption('0');
  await page.getByLabel('Preview in a newspaper',{exact:true}).check();
  await page.getByText('FICTIONAL MASTHEAD · NEWSPAPER LAYOUT STUDY',{exact:true}).waitFor();
  assert.equal(await page.getByRole('combobox',{name:/^Paper/}).isEnabled(),false);
  await page.locator('.showcase-paper').screenshot({path:dir+'/newspaper-preview.png'});
  const news=await download('Download 6-cartoon newspaper PDF','six-newspaper.pdf');
  assert.equal(news.getPageCount(),6);assert.deepEqual(news.getPages()[0].getSize(),{width:792,height:1224});
  await page.getByRole('button',{name:'Full-screen slides',exact:true}).click();
  await page.getByRole('button',{name:'Next cartoon',exact:true}).click();
  await page.getByText('2 / 40 · Los Angeles, California',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Exit slides',exact:true}).click();
  // Browser-denied fullscreen must remain usable without scrolling the page behind it.
  await page.evaluate(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('QA fullscreen unavailable'));});
  await page.getByRole('button',{name:'Full-screen slides',exact:true}).click();
  assert.equal(await page.evaluate(()=>document.body.style.overflow),'hidden');
  await page.keyboard.press('ArrowLeft');
  await page.getByText('1 / 40 · Austin, Texas',{exact:true}).waitFor();
  await page.keyboard.press('ArrowLeft');
  await page.getByText('40 / 40 · Cancellation Season',{exact:true}).waitFor();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-label')),'Previous cartoon');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Exit slides');
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog',{name:'Cartoon presentation'}).count(),0);
  assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');
  assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Full-screen slides');
  // Walk every original and require completed native-resolution image loads.
  await page.getByLabel('Preview in a newspaper',{exact:true}).uncheck();
  for(let i=0;i<40;i++){
    await page.getByRole('combobox',{name:/^Choose a cartoon/}).selectOption(String(i));
    await page.waitForFunction(()=>{const img=document.querySelector('.showcase-paper-art');return img?.complete&&img.naturalWidth===1024&&img.naturalHeight===1536;});
  }
  for(const ext of ['pdf','pptx']){const file=`/gallery/presentation-20260915/rick-system-showcase.${ext}`;const r=await page.request.get(base+file);assert.equal(r.status(),200);const digest=bytes=>createHash('sha256').update(bytes).digest('hex');assert.equal(digest(await r.body()),digest(await fs.readFile('public'+file)));}
  await page.screenshot({path:dir+'/desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:dir+'/mobile.png',fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile overflow');
  await page.getByRole('button',{name:'Full-screen slides',exact:true}).click();
  const visibleArt=await page.locator('.showcase-slide-image').boundingBox();
  assert.ok(visibleArt.y>=0&&visibleArt.y+visibleArt.height<=844,'Mobile slideshow image stays on screen');
  await page.screenshot({path:dir+'/mobile-slides.png'});
  await page.getByRole('button',{name:'Exit slides',exact:true}).click();
  const anonymous=await page.request.get(base+'/api/gallery/automation/jobs');assert.equal(anonymous.status(),401);
  assert.deepEqual(errors,[]);
  const result={base,checkedAt:new Date().toISOString(),collection:40,printSizes:4,papers:2,exactSizeCombinations:8,letterPages:6,newspaperPages:6,selectionLimit:12,fullscreenFallback:true,keyboard:true,slides:true,downloadsMatch:true,mobile:true,anonymousQueue:401,errors};
  await fs.writeFile(dir+'/verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
