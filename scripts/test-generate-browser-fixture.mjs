// LOCAL-ONLY UI regression fixture. No production queue writes or real generation.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base='http://localhost:21361';
assert.ok(process.env.ADMIN_PASSWORD,'Supply the local test-server environment, never production credentials.');
const image=await fs.readFile('public/gallery/best-of-v1/originals/professional-opposition.png');
const sha256=createHash('sha256').update(image).digest('hex');
const dir='output/generate-fixture-verified';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1400,height:1000},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const login=await page.request.post(base+'/api/backroom/login',{form:{username:process.env.ADMIN_USERNAME||'theswingingdoor',password:process.env.ADMIN_PASSWORD},maxRedirects:0});
  assert.equal(login.status(),303);
  let job=null,connected=true;const submissions=[];
  await page.route('**/api/gallery/automation/jobs',async route=>{
    if(route.request().method()==='POST') {
      const body=route.request().postDataJSON();submissions.push(body);
      if(submissions.length===1){await route.fulfill({status:503,json:{error:'Fixture: simulated unconfirmed response.'}});return;}
      job={id:'e9f4cdfc-d1c5-4d37-ae59-562ca7fb4931',requestId:body.requestId,input:body.input,status:'queued',attempt:1,dueAt:new Date().toISOString(),createdAt:new Date().toISOString(),progress:{stage:'Waiting for worker',completed:0,total:0},artifacts:[]};
      await route.fulfill({json:{job}});return;
    }
    await route.fulfill({json:{jobs:job?[job]:[],workerConnected:connected}});
  });
  await page.route('**/api/gallery/automation/assets?*',route=>route.fulfill({status:200,contentType:'image/png',body:image}));
  await page.goto(base+'/gallery/automation');
  await page.getByRole('textbox',{name:'City or town',exact:true}).fill('Denver');
  await page.getByRole('combobox',{name:/^State/}).selectOption('Colorado');
  await page.getByRole('button',{name:'Generate cartoons',exact:true}).click();
  await page.getByRole('button',{name:'Resume saved request',exact:true}).click();
  await page.getByRole('progressbar').waitFor();
  assert.equal(submissions.length,2);assert.equal(submissions[0].requestId,submissions[1].requestId);
  job.status='running';job.progress={stage:'vision-01-1-v2',completed:4,total:7};job.leaseExpiresAt=new Date(Date.now()+60000).toISOString();
  await page.waitForFunction(()=>document.querySelector('progress')?.value===57);
  connected=false;
  await page.getByText('Studio connection lost.',{exact:false}).waitFor({timeout:10000});
  assert.equal(await page.getByRole('progressbar').getAttribute('value'),'57');
  connected=true;await page.reload();
  await page.waitForFunction(()=>document.querySelector('progress')?.value===57);
  job.status='succeeded';job.progress={stage:'Drafts ready for review',completed:7,total:7};job.artifacts=[{name:'cartoon-01.png',kind:'image',sha256}];
  await page.locator('.generation-image-grid img').waitFor({timeout:10000});
  await page.locator('.generation-image-grid img').evaluate(i=>i.decode());
  assert.equal(await page.getByRole('progressbar').getAttribute('value'),'100');
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download print PDF',exact:true}).click();
  const file=await pending;await file.saveAs(dir+'/fixture-print.pdf');
  assert.equal((await PDFDocument.load(await fs.readFile(dir+'/fixture-print.pdf'))).getPageCount(),1);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:dir+'/mobile.png',fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);
  console.log(JSON.stringify({fixtureOnly:true,stableRequestId:true,offlineBarPaused:true,reloadRecovery:true,automaticImage:true,pdf:true,mobile:true,errors}));
}finally{await browser.close();}
