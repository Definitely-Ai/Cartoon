// Explicitly editor-assisted publication; never changes a worker's retained report.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';

const root=process.cwd(), runtime=path.resolve(process.argv[2]), state=path.resolve(process.argv[3]);
const output=path.join(root,'output/city-editions-20260914');
const publicDir=path.join(root,'public/gallery/city-editions-20260914');
process.env.CARTOON_STUDIO_LOCK_ROOT='Z:/ImageGenerator/local-studio/locks';
process.chdir(runtime);
const core=await import(pathToFileURL(path.join(runtime,'scripts/fixed-set/core.mjs')));
const type=await import(pathToFileURL(path.join(runtime,'scripts/fixed-set/typography.mjs')));
const tv=await import(pathToFileURL(path.join(runtime,'lib/local-tv-art.mjs')));
const {LocalStudioLease}=await import(pathToFileURL(path.join(runtime,'lib/local-studio-lease.mjs')));
const acting=JSON.parse(await fs.readFile('output/fixed-set-v1/best-of-v1/acting/verification.json','utf8'));
const regions=JSON.parse(await fs.readFile('canon/fixed-set/v1/regions.json','utf8'));
const specs=[
  {id:'austin-taking-offers',title:'Taking Offers',cityLabel:'Austin, Texas',speaker:'Barclay',variant:'duo',
    line:'My Austin house finally got an offer. From my realtor, to lower the price.',
    tv:{headline:'AUSTIN HOME PRICE CUTS',timestamp:'1:30 PM',picture:'A modest central Texas limestone bungalow with a deep shaded porch, a spreading live oak, and a plain blank real estate sign beside the empty front walkway. No people, no lettering.'},
    board:{lines:['House Margarita','$9','Taking offers']},
    sourceUrl:'https://www.realtor.com/news/local/austin-tx/real-estate-market-austin-tx-august-2026/',sourceTitle:'Austin housing market — August 2026',
    sourceJob:'76e78ca7-51c9-4ec3-9e89-a8e7ef7287b1',sourceJobOutcome:'Automatic caption attempts rejected; editor-assisted replacement.'},
  {id:'los-angeles-view-included',title:'The View Is Extra',cityLabel:'Los Angeles, California',speaker:'Drew',variant:'trio',
    line:'In L.A., I’m renting the view. The house costs extra.',
    tv:{headline:'L.A. HOUSING COSTS',timestamp:'11:30 AM',picture:'An empty suburban house exterior with an overgrown lawn and a detached garage.'},
    board:{lines:['House Red','$8','View included']},
    sourceUrl:'https://gov.car.org/en/aboutus/mediacenter/newsreleases/2026releases/2qtr2026HAI',sourceTitle:'C.A.R. housing affordability — second quarter 2026',
    sourceJob:'701a0a02-4566-407f-890b-63a1194b9707',sourceJobOutcome:'Automatic draft completed; editorial caption, TV headline and menu polish.'},
];
await fs.mkdir(output,{recursive:true});await fs.mkdir(publicDir,{recursive:true});
const manifest=[],reports=[];
for(const e of specs){
  let tvPath;
  if(e.id.startsWith('austin')){
    // Clear only models left resident after the now-stopped bounded writer job.
    await new LocalStudioLease().run('city-edition:release-idle-writer',async()=>{
      const q=await fetch('http://127.0.0.1:8188/queue').then(r=>r.json());
      if(q.queue_running.length||q.queue_pending.length)throw Error('Image work is active');
      const ps=await fetch('http://127.0.0.1:11435/api/ps').then(r=>r.json());
      for(const model of ps.models){
        const r=await fetch('http://127.0.0.1:11435/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:model.name,keep_alive:0})});
        if(!r.ok)throw Error('Could not release idle writer');
        await r.text();
      }
    });
    const generated=await tv.generateTvIllustration({brief:e.tv.picture,work:path.join(output,'austin-tv'),seed:202609141},{onProgress:console.log});
    tvPath=generated.path;
  }else tvPath=path.join(state,'jobs',e.sourceJob,'tv-01/picture.png');
  const actor=acting.reports.find(a=>a.id===e.variant+'-'+e.speaker.toLowerCase());
  const baseBytes=await fs.readFile(actor.framePath);
  if(core.sha256(baseBytes)!==actor.sha256)throw Error('Cast plate changed');
  const W=1024,H=1536,{crop}=acting,sx=W/crop.width,sy=Math.round(crop.height*sx)/crop.height;
  const map=p=>p.map(([x,y])=>[(x-crop.left)*sx,(y-crop.top)*sy]);
  const tq=map(regions.tv),bq=map(regions.board),foot=[[0,1365],[W,1365],[W,H],[0,H]];
  const base=await core.readRGB(baseBytes,W,H);let pixels=Buffer.from(base);
  const art=await sharp(tvPath).grayscale().resize(1056,465,{fit:'cover'}).png().toBuffer();
  for(const [kind,quad] of [['tv',tq],['board',bq]]){
    const surface=await type.displayArt(e,kind,kind==='tv'?art:undefined,{profile:'print-study-v1',boardUnderline:false});
    pixels=core.warp(pixels,W,H,surface.data,surface.width,surface.height,quad);
  }
  const strip=await type.captionStrip(e.speaker,e.line,W,{transparent:true});
  const {height}=await sharp(strip).metadata();if(height>161)throw Error('Caption too long');
  const bytes=await sharp(pixels,{raw:{width:W,height:H,channels:3}}).composite([{input:strip,left:0,top:H-height-15}]).withMetadata({density:300}).png({compressionLevel:9}).toBuffer();
  const audit=core.auditPixels(base,await core.readRGB(bytes,W,H),core.maskFor(W,H,[tq,bq,foot]));
  await fs.writeFile(path.join(publicDir,e.id+'.png'),bytes);
  await sharp(bytes).resize({width:640}).webp({quality:86}).toFile(path.join(publicDir,e.id+'.webp'));
  manifest.push({id:e.id,title:e.title,cityLabel:e.cityLabel,editionDate:'September 14, 2026',speaker:e.speaker,variant:e.variant,caption:e.line,src:'/gallery/city-editions-20260914/'+e.id+'.png',previewSrc:'/gallery/city-editions-20260914/'+e.id+'.webp',width:W,height:H,sha256:core.sha256(bytes),tv:e.tv.headline,board:e.board.lines,sourceUrl:e.sourceUrl,sourceTitle:e.sourceTitle});
  reports.push({...e,audit,actorId:actor.id,actorSha256:actor.sha256,tvSha256:core.sha256(await fs.readFile(tvPath)),publishedSha256:core.sha256(bytes),editorialAssistance:true,automaticPublication:false,audienceRatingClaim:false});
  console.log(e.cityLabel,audit);
}
await fs.writeFile(path.join(root,'lib/city-editions.json'),JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile(path.join(output,'publication-provenance.json'),JSON.stringify(reports,null,2)+'\n');
