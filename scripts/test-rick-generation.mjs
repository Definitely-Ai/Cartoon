import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {PDFDocument} from 'pdf-lib';
import {localNewsURL,parseLocalNews} from './automation/local-news.mjs';
import {workProgress} from './automation/work-progress.mjs';
import {reviewSchema,approvedMachineReview} from './automation/production-adapter.mjs';
import {waitForStudio} from './automation/studio-availability.mjs';

test('a busy GPU preserves milestones, waits without consuming attempts, then resumes',async()=>{
  const ctx={progress:{stage:'critique-01-1',completed:2,total:7},signal:new AbortController().signal};
  let checks=0,waits=0;
  const busy=Object.assign(new Error('Another task is active'),{retryable:true});
  await waitForStudio(ctx,async()=>{if(++checks<3)throw busy;},{pause:async()=>{waits++;assert.equal(ctx.progress.stage,'waiting-gpu');assert.equal(ctx.progress.completed,2);}});
  assert.equal(waits,2);assert.equal(ctx.progress.stage,'critique-01-1');
  await assert.rejects(waitForStudio(ctx,async()=>{throw busy;},{maxWaitMs:0}),/Another task/);
  const abort=new AbortController();abort.abort();
  await assert.rejects(waitForStudio({...ctx,signal:abort.signal},async()=>{throw Error('must not dispatch');}),{name:'AbortError'});
});

test('review schema explicitly defines numeric scales and rejects percentage responses',()=>{
  for(const visual of [false,true]) {
    const {properties}=reviewSchema(visual);
    assert.equal(properties.score.maximum,10);
    assert.equal(properties.confidence.maximum,1);
  }
  assert.equal(approvedMachineReview({accept:true,score:100,confidence:100,problems:[],reason:'The subject is drawn clearly.',noHumans:true,noWriting:true,clearSubject:true,sharpAndCoherent:true},{visual:true}),false);
});
const require=createRequire(import.meta.url);
function loadTS(file){const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const m={exports:{}};new Function('require','module','exports',code)(id=>id.startsWith('./')?loadTS('lib/'+id.slice(2)+'.ts'):require(id),m,m.exports);return m.exports;}
const {immediateEdition,generationProgress,matchingActiveEdition,US_STATES}=loadTS('lib/automation-simple.ts');
const {showcasePDF}=loadTS('lib/showcase-pdf.ts');

test('different city batches can queue while identical active inputs are protected from duplicate clicks',()=>{
  const job={status:'queued',dueAt:new Date(Date.now()-1000).toISOString(),input:{location:{name:'Denver',region:'Colorado'},quantity:2,cast:'mixed'}};
  assert.equal(matchingActiveEdition([job],' Denver ','COLORADO',2),job);
  assert.equal(matchingActiveEdition([job],'Seattle','Washington',2),undefined);
  assert.equal(matchingActiveEdition([job],'Denver','Colorado',1),undefined);
  assert.equal(matchingActiveEdition([{...job,status:'succeeded'}],'Denver','Colorado',2),undefined);
});
test('simple form validates city/state/count and uses the correct immediate local date',()=>{
  const now=new Date('2026-09-15T02:00:00Z');
  assert.equal(US_STATES.length,51);
  for(const state of US_STATES){const input=immediateEdition('Sample City',state,12,now);assert.equal(input.timing.mode,'now');assert.equal(input.timing.date,'2026-09-14');}
  assert.equal(immediateEdition('Los Angeles','California',1,now).location.timezone,'America/Los_Angeles');
  for(const args of [['A','Florida',1],['Naples','ZZ',1],['Naples','Florida',13],['Denver site:evil','Colorado',1]])assert.throws(()=>immediateEdition(...args,now));
});
test('real stage counters never report completion before server delivery succeeds',()=>{
  const input=immediateEdition('Denver','Colorado',2,new Date('2026-09-14T18:00:00Z'));
  const job={input,status:'running',progress:{stage:'uploading',completed:2,total:2}};
  assert.equal(generationProgress(job).percent,99);
  assert.equal(generationProgress({...job,status:'succeeded'}).percent,100);
  assert.equal(generationProgress({...job,status:'queued'}).percent,0);
  assert.equal(workProgress('tv-02-1',2).completed,8);
  assert.equal(workProgress('vision-01-1-v2',2).completed,4);
  assert.equal(workProgress('uploading',2).completed,11);
  assert.equal(workProgress('uploading',2).total,12);
});
test('city discovery fetches one fixed public host and accepts only dated local money topics',()=>{
  const place={name:'Denver',region:'Colorado'},now=Date.parse('2026-09-14');
  assert.equal(new URL(localNewsURL(place)).hostname,'news.google.com');
  assert.throws(()=>localNewsURL({name:'Denver" OR passwords',region:'Colorado'}));
  const row=(title,link,date='Mon, 07 Sep 2026 12:00:00 GMT')=>`<item><title>${title}</title><link>${link}</link><pubDate>${date}</pubDate><source>Local News</source></item>`;
  const good=row('Denver housing market listing prices fall this summer','https://news.google.com/rss/articles/example');
  const xml=good+good+row('Denver housing market listing prices fall','http://127.0.0.1/secrets')+row('Denver housing prices from last year','https://news.google.com/rss/articles/old','Mon, 01 Sep 2025 12:00:00 GMT')+row('Miami housing listing prices drop this summer','https://news.google.com/rss/articles/miami');
  const result=parseLocalNews(xml,place,now);assert.equal(result.length,1);assert.match(result[0].scope,/full article NOT retrieved/);
});
test('selected newspaper and print PDFs have exact media sizes and reject altered originals',async t=>{
  const c=JSON.parse(fs.readFileSync('lib/city-editions.json','utf8'))[0],bytes=fs.readFileSync('public'+c.src);
  t.mock.method(globalThis,'fetch',async()=>new Response(bytes));
  for(const newspaper of [false,true]){const pdf=await PDFDocument.load(await showcasePDF([c],'fine','letter',newspaper));assert.equal(pdf.getPageCount(),1);assert.equal(pdf.getPage(0).getWidth(),newspaper?792:612);assert.equal(pdf.getPage(0).getHeight(),newspaper?1224:792);}
  await assert.rejects(showcasePDF([{...c,sha256:'0'.repeat(64)}],'fine','letter',false),/integrity/);
  await assert.rejects(showcasePDF([],'fine','letter',false),/between/);
});
