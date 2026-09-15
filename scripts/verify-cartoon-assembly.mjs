// Loopback UI fixtures only. No real generation, publication, or GPU calls.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_BASE_URL||'http://localhost:21368';assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const out='output/cartoon-assembly-verified',saved=JSON.parse(await fs.readFile(out+'/fixtures/frames.json','utf8'));
const id='92222222-2222-4222-8222-222222222222',now=new Date().toISOString();
const job={id,requestId:'82222222-2222-4222-8222-222222222222',status:'running',input:{location:{name:'Naples',region:'Florida',country:'US',timezone:'America/New_York',coverage:'city'},quantity:1,cast:'duo',audience:'UI fixture only.',timing:{mode:'now',date:now.slice(0,10),time:'09:00',weekdays:[]}},createdAt:now,updatedAt:now,dueAt:now,availableAt:now,attempt:1,progress:{stage:'sources',completed:0,total:7},artifacts:[],leaseExpiresAt:new Date(Date.now()+180000).toISOString()};
let count=1,offline=false,posts=0;const errors=[];
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1500,height:1200}});page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/gallery/automation/**',async route=>{
    const url=new URL(route.request().url());if(route.request().method()!=='GET'){posts++;throw Error('Unexpected mutation in visual fixture');}
    if(url.pathname.endsWith('/jobs'))return route.fulfill({json:{jobs:[job],workerConnected:!offline}});
    if(url.pathname.endsWith('/build')){
      if(url.searchParams.has('stage')){const stage=url.searchParams.get('stage');assert.ok(saved.some(f=>f.stage===stage));return route.fulfill({body:await fs.readFile(out+'/fixtures/'+stage+'.png'),contentType:'image/png'});}
      if(offline)return route.fulfill({status:503,json:{error:'Fixture offline'}});
      return route.fulfill({json:{frames:saved.slice(0,count)}});
    }
    throw Error('Unexpected route '+url.pathname);
  });
  await page.goto(base+'/login');await page.getByLabel('Username',{exact:true}).fill(process.env.ADMIN_USERNAME||'theswingingdoor');assert.ok(process.env.ADMIN_PASSWORD);await page.getByLabel('Password',{exact:true}).fill(process.env.ADMIN_PASSWORD.trim());
  await Promise.all([page.waitForURL(base+'/gallery/best-of'),page.getByRole('button',{name:'Sign in',exact:true}).click()]);
  await page.goto(base+'/gallery/automation');
  const assembly=page.getByRole('region',{name:'Live cartoon assembly'});
  await assembly.getByRole('heading',{name:'Set & cast',exact:true}).waitFor();
  assert.equal(await assembly.locator('.assembly-stages button:disabled').count(),4);
  const readyImage=()=>assembly.locator('.assembly-paper img').evaluate(img=>img.complete&&img.naturalWidth===1024);
  await page.waitForFunction(()=>{const image=document.querySelector('.assembly-paper img');return image?.complete&&image.naturalWidth===1024;});
  await assembly.screenshot({path:out+'/01-cast.png'});
  count=2;job.progress={stage:'tv-01-1',completed:3,total:7};
  await assembly.getByRole('heading',{name:'The idea',exact:true}).waitFor({timeout:15000});assert.ok(await readyImage());
  await assembly.screenshot({path:out+'/02-story.png'});
  // A reconnect retains actual saved artwork; no pretend progress or blanking.
  offline=true;await assembly.getByRole('button',{name:'Reconnect previews'}).waitFor({timeout:15000});assert.ok(await assembly.getByRole('heading',{name:'The idea',exact:true}).isVisible());
  offline=false;await assembly.getByRole('button',{name:'Reconnect previews'}).click();
  count=5;job.progress={stage:'compose-01',completed:5,total:7};
  for(const [title,file] of [['TV artwork','03-tv.png'],['Handwritten chalk','04-chalk.png'],['Final lettering','05-lettering.png']]){await assembly.getByRole('heading',{name:title,exact:true}).waitFor({timeout:15000});await assembly.screenshot({path:out+'/'+file});}
  assert.equal(await assembly.locator('.assembly-stages button:disabled').count(),0);
  await page.reload();await assembly.getByRole('heading',{name:'Final lettering',exact:true}).waitFor();
  await assembly.getByRole('button',{name:/^↺ Replay saved stages/}).click();await assembly.getByRole('heading',{name:'Set & cast',exact:true}).waitFor();
  await assembly.getByRole('button',{name:'Pause replay',exact:true}).click();await assembly.getByRole('button',{name:'Follow live →',exact:true}).click();await assembly.getByRole('heading',{name:'Final lettering',exact:true}).waitFor();
  for(const width of [320,390,768,1500]){
    await page.setViewportSize({width,height:1100});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at ${width}`);
    await assembly.screenshot({path:out+`/width-${width}.png`});
  }
  await page.setViewportSize({width:1920,height:1080});await assembly.getByRole('button',{name:'Expand cartoon assembly'}).click();
  await page.waitForFunction(()=>!!document.fullscreenElement);assert.ok(await assembly.locator('.assembly-footnote').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),'Full-screen controls and approval note must fit');await page.screenshot({path:out+'/fullscreen.png'});await page.keyboard.press('Escape');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await assembly.locator('.assembly-paper').evaluate(el=>getComputedStyle(el).animationName),'none');
  assert.equal(posts,0);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,stages:5,refreshRecovery:true,offlineRetention:true,fullscreen:true,widths:[320,390,768,1500],reducedMotion:true,productionWrites:posts}));
}finally{await browser.close();}
