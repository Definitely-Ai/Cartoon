// Owner-session, read-only rehearsal. Production job writes are blocked here.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_BASE_URL||'http://localhost:21366',cloud='https://cartoon-brown-seven.vercel.app';
const dir=process.env.QA_OUTPUT_DIR||'output/city-showcase-20260915/owner-rehearsal';
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  assert.ok(process.env.ADMIN_PASSWORD,'Owner login environment is required');
  const login=await page.request.post(cloud+'/api/backroom/login',{form:{username:process.env.ADMIN_USERNAME||'theswingingdoor',password:process.env.ADMIN_PASSWORD.trim()},maxRedirects:0});
  assert.equal(login.status(),303,'Owner authentication');
  const cookie=login.headers()['set-cookie']?.split(';')[0];assert.ok(cookie?.startsWith('sd_backroom='));
  let reads=0,latest;
  await page.route('**/api/gallery/automation/**',async route=>{
    const req=route.request();assert.equal(req.method(),'GET','This rehearsal must never submit a job');
    const url=new URL(req.url()),response=await page.request.get(cloud+url.pathname+url.search,{headers:{Cookie:cookie},timeout:60000});
    if(url.pathname.endsWith('/jobs')){assert.equal(response.status(),200);latest=await response.json();reads++;}
    await route.fulfill({response});
  });
  await page.goto(base+'/login');
  await page.getByLabel('Username',{exact:true}).fill(process.env.ADMIN_USERNAME||'theswingingdoor');
  await page.getByLabel('Password',{exact:true}).fill(process.env.ADMIN_PASSWORD.trim());
  await Promise.all([page.waitForURL(base+'/'),page.getByRole('button',{name:'Sign in',exact:true}).click()]);
  await page.goto(base+'/gallery/presentation');
  await page.getByRole('button',{name:'Go to live demo',exact:true}).click();
  const city=page.getByLabel('City or town',{exact:true});await city.waitFor();
  await page.waitForResponse(r=>r.url().endsWith('/api/gallery/automation/jobs')&&r.request().method()==='GET');
  assert.equal(await page.locator('.generation-results').count(),0,'Do not present historical art as a new result');
  await city.fill('Denver');
  await page.getByRole('combobox',{name:/^State/}).selectOption('Colorado');
  await page.screenshot({path:dir+'/owner-live-entry.png'});
  const before=reads;
  await page.getByRole('combobox',{name:'Jump to presentation slide',exact:true}).selectOption('4');
  await page.waitForResponse(r=>r.url().endsWith('/api/gallery/automation/jobs')&&r.request().method()==='GET');
  assert.ok(reads>before,'Real queue polling must continue while presenting the prepared art');
  await page.getByRole('button',{name:'Live demo',exact:true}).click();
  assert.equal(await city.inputValue(),'Denver');
  assert.equal(await page.getByRole('combobox',{name:/^State/}).inputValue(),'Colorado');
  assert.equal(await page.locator('.generation-results').count(),0);
  assert.deepEqual(errors,[]);
  const report={base,checkedAt:new Date().toISOString(),ownerLogin:true,realQueueReads:reads,workerConnected:latest.workerConnected,savedJobs:latest.jobs.length,staleArtHidden:true,pollingContinuesAcrossSlides:true,formSurvivesSlideChanges:true,productionJobsSubmitted:0,freshGenerationVerified:false,errors};
  await fs.writeFile(dir+'/verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
