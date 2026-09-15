// Supervised, editor-curated showcase. This is not the unattended job queue.
// Image inference uses the same local FLUX model and cooperative GPU lease.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {composeProductionPanel} from './automation/production-adapter.mjs';
const root=process.cwd();
const runtime='Z:/ImageGenerator/CartoonRuntime/releases/20260914-v17';
const out=path.join(root,'output/city-showcase-20260915');
const spec=JSON.parse(await fs.readFile(path.join(root,'docs/presentation/city-showcase-20260915.json'),'utf8'));
const prior=[...JSON.parse(await fs.readFile('lib/best-of-cartoons.json','utf8')),...JSON.parse(await fs.readFile('lib/city-editions.json','utf8'))];
const seen=new Set(prior.map(x=>x.caption.toLowerCase()));
for(const e of spec.cities){
  if(e.line.split(/\s+/u).length>20||seen.has(e.line.toLowerCase()))throw Error('Caption length or duplicate: '+e.id);
  seen.add(e.line.toLowerCase());
  if(e.board.lines.some(x=>x.length>18)||e.tv.headline.length>30)throw Error('Print text bounds: '+e.id);
  if(!e.sourceUrl.startsWith('https://')||e.alternatives.length<2)throw Error('Missing editorial evidence');
}
process.env.CARTOON_STUDIO_LOCK_ROOT='Z:/ImageGenerator/local-studio/locks';
process.chdir(runtime);
const load=p=>import(pathToFileURL(path.join(runtime,p)));
const core=await load('scripts/fixed-set/core.mjs'),typography=await load('scripts/fixed-set/typography.mjs');
const tv=await load('lib/local-tv-art.mjs');
const {LocalStudioLease}=await load('lib/local-studio-lease.mjs');
const acting=JSON.parse(await fs.readFile('canon/fixed-set/barclay-reference-v2/acting/verification.json','utf8'));
const regions=JSON.parse(await fs.readFile('canon/fixed-set/v1/regions.json','utf8'));
if(acting.identitySha256!=='938dcdb8d4fb191ddd7551c2a231b13596db645995fe57e722dfac5ebfb88493')throw Error('Wrong cast');
await fs.mkdir(out,{recursive:true});
let weights;
const checkWeights=()=>weights??=(tv.verifyTvWeights());
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const lease=new LocalStudioLease();
const availability=async()=>{
  if(await lease.inspect())throw Error('Studio GPU lease exists; waiting for its owner');
  const [q,p]=await Promise.all([fetch('http://127.0.0.1:8188/queue').then(r=>r.json()),fetch('http://127.0.0.1:11435/api/ps').then(r=>r.json())]);
  if(q.queue_running?.length||q.queue_pending?.length||p.models?.length)throw Error('Other local model work is active or resident; waiting');
  if(!Array.isArray(q.queue_running)||!Array.isArray(q.queue_pending)||!Array.isArray(p.models))throw Error('Model availability unverifiable');
};
const manifest=[],reports=[];
for(let i=0;i<spec.cities.length;i++){
  const e=spec.cities[i],dir=path.join(out,e.id),tvDir=path.join(dir,e.tvRevision?`tv-v${e.tvRevision}`:'tv');await fs.mkdir(dir,{recursive:true});
  let generated;
  const deadline=Date.now()+45*60000;
  for(;;){
    try{
      // Retained completed results can be used without acquiring or clearing GPU state.
      if(!await fs.stat(path.join(tvDir,'result.json')).catch(()=>null))await availability();
      console.log(JSON.stringify({city:e.cityLabel,stage:'local-tv-generation',index:i+1,total:spec.cities.length}));
      generated=await tv.generateTvIllustration({brief:e.tv.picture,work:tvDir,seed:202609150+i+(e.tvRevision||0)*100},{lease,checkWeights,onProgress:p=>console.log(JSON.stringify({city:e.cityLabel,...p}))});break;
    }catch(error){
      if(error.remoteMayBeRunning||!/(waiting|lease exists|queue is active|writer is loaded)/i.test(error.message)||Date.now()>deadline)throw error;
      console.log(JSON.stringify({city:e.cityLabel,stage:'waiting-for-gpu',detail:error.message}));await pause(15000);
    }
  }
  const actor=acting.reports.find(a=>a.id===e.variant+'-'+e.speaker.toLowerCase());
  const ctx={dir,config:{workspaceRoot:runtime}};
  const rendered=await composeProductionPanel(ctx,{core,typography,sharp},e,generated.path,actor,acting,regions,0);
  const bytes=await fs.readFile(path.join(dir,rendered.name));
  await sharp(bytes).resize({width:640}).webp({quality:88}).toFile(path.join(dir,'preview.webp'));
  manifest.push({id:e.id,title:e.title,cityLabel:e.cityLabel,editionDate:spec.displayDate,speaker:e.speaker,variant:e.variant,caption:e.line,
    src:`/gallery/city-showcase-20260915/${e.id}.png`,previewSrc:`/gallery/city-showcase-20260915/${e.id}.webp`,width:1024,height:1536,sha256:rendered.sha256,
    tv:e.tv.headline,board:e.board.lines,sourceUrl:e.sourceUrl,sourceTitle:e.sourceTitle,theme:e.theme,context:e.context,connection:e.connection,
    sourceKind:e.sourceKind,checkedOn:spec.editionDate,productionMethod:'editor-curated-local-generation'});
  reports.push({...e,...rendered,tvSha256:generated.sha256,editorialAssistance:true,freshLocalTv:true,automaticPublication:false,audienceRatingClaim:false,requiresHumanVisualReview:true});
  await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  await fs.writeFile(path.join(out,'provenance.json'),JSON.stringify({date:spec.editionDate,method:spec.method,reports},null,2)+'\n');
  console.log(JSON.stringify({city:e.cityLabel,stage:'composed',...rendered.audit}));
}
console.log('Prepared '+manifest.length+' cartoons for visual review. Nothing published.');
