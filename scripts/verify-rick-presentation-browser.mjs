// Public presentation QA; never logs in, queues work, or changes saved data.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_BASE_URL||'http://localhost:21361';
const dir='output/presentation-browser-verified';await fs.mkdir(dir,{recursive:true});
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
  for(const ext of ['pdf','pptx']){const r=await page.request.get(base+`/gallery/presentation-20260914/rick-system-showcase.${ext}`);assert.equal(r.status(),200);assert.ok((await r.body()).length>100000);}
  await page.screenshot({path:dir+'/desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:dir+'/mobile.png',fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile overflow');
  const anonymous=await page.request.get(base+'/api/gallery/automation/jobs');assert.equal(anonymous.status(),401);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({base,collection:40,printSizes:4,letterPages:6,newspaperPages:6,slides:true,downloads:true,mobile:true,anonymousQueue:401,errors}));
}finally{await browser.close();}
