import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {readRGB,maskFor,blendMasked,auditPixels,sha256} from './core.mjs';

const root='output/fixed-set-v1/barclay-reference-rollout-v2';
const release=path.resolve(process.argv[2]||'Z:/ImageGenerator/Cartoon-release-best-of-20260914');
const W=1024,H=1536,crop={left:712,top:620,width:312,height:370};
const approved='output/fixed-set-v1/barclay-chin-cleanup-v4/head-review.png';
const approvedSha='ab76ccbf36c54b1bb3b8aaebecb3913089d70cc162b865d0beedb199c6c89ce8';
const approvedBytes=await fs.readFile(approved);
if(sha256(approvedBytes)!==approvedSha)throw Error('Owner-approved head changed');
const prior=JSON.parse(await fs.readFile(path.join(release,'canon/fixed-set/barclay-reference-v1/acting/verification.json'),'utf8'));
// Complete head and old-outline union. Unlike v1, NEVER intersect the donor
// with the retired fur silhouette. The exterior margin removes all old lobes.
// Coordinates refer to the approved 1151 x 1366 close-up.
const head=[[102,470],[115,436],[171,408],[200,405],[205,390],[220,375],
 [210,355],[219,320],[242,283],[274,243],[310,212],[385,175],[460,129],[537,112],[635,115],[720,144],
 [800,185],[875,250],[953,325],[1005,420],[1038,520],[1030,612],
 [1009,660],[987,680],[1000,734],[1010,790],[1020,830],[960,885],
 [870,963],[784,1043],[717,1100],[671,1155],[611,1230],[561,1280],
 [507,1270],[490,1175],[485,1090],[480,1020],[464,960],[455,890],
 [433,841],[416,800],[398,761],[378,740],[343,738],[299,734],
 [239,723],[199,701],[170,675],[152,646],[134,612],[119,567],[110,526]];
const mouth=[[131,557],[181,582],[237,614],[314,631],[385,620],[450,582],
 [476,559],[511,566],[534,614],[522,668],[478,700],[449,735],
 [415,758],[356,757],[295,757],[235,748],[205,729],[187,700],
 [177,668],[161,638],[144,603]];
const eyes=[[[303,311],[333,306],[355,317],[365,342],[349,369],[321,378],[304,356]],
 [[427,338],[463,331],[490,348],[511,379],[502,397],[469,405],[438,397],[421,371]]];
const global=p=>p.map(([x,y])=>[crop.left+x*crop.width/1151,crop.top+y*crop.height/1366]);
const headMask=maskFor(W,H,[global(head)]),mouthMask=maskFor(W,H,[global(mouth)]),eyeMask=maskFor(W,H,eyes.map(global));
const allowed=Uint8Array.from(headMask,(v,i)=>Number(v||mouthMask[i]||eyeMask[i]));
const donor=async file=>{
 const normalized=await sharp(file).resize(crop.width,crop.height,{fit:'fill'}).grayscale().png().toBuffer();
 return readRGB(await sharp({create:{width:W,height:H,channels:3,background:'white'}}).composite([{input:normalized,left:crop.left,top:crop.top}]).png().toBuffer(),W,H);
};
const face=await donor(approved),speech=await donor(root+'/speak-generated.png'),up=await donor(root+'/listen-abby-generated.png');
await fs.mkdir(root+'/acting',{recursive:true});await fs.mkdir(root+'/cartoons',{recursive:true});
const states={},reports=[];
for(const actor of prior.reports){
 const source=await fs.readFile(path.join(release,actor.framePath));if(sha256(source)!==actor.sha256)throw Error('Acting drift '+actor.id);
 const before=await readRGB(source,W,H);
 // One complete approved head is common to all states. Only genuine speech
 // and eye-direction regions differ, never the forehead, rear ear or crown.
 let after=blendMasked(before,face,headMask,W,H,2);
 const state=actor.id.endsWith('barclay')?'speak':actor.id.endsWith('abby')?'listen-abby':'listen-drew';
 if(state==='speak')after=blendMasked(after,speech,mouthMask,W,H,2);
 if(state==='listen-abby')after=blendMasked(after,up,eyeMask,W,H,1);
 const audit=auditPixels(before,after,allowed);
 const framePath=root+'/acting/'+actor.id+'.png';
 const bytes=await sharp(after,{raw:{width:W,height:H,channels:3}}).withMetadata({density:300}).png().toBuffer();
 await fs.writeFile(framePath,bytes);
 states[actor.id]={before,after};
 reports.push({...actor,sourcePath:actor.framePath,sourceSha256:actor.sha256,framePath,sha256:sha256(bytes),preferredBarclayState:state,audit});
 await sharp(bytes).extract(crop).resize(624,740).png().toFile(root+'/'+actor.id+'-face.png');
}
const identity=JSON.parse(await fs.readFile(path.join(release,'lib/cast-identity.json'),'utf8'));
await fs.writeFile(root+'/acting/verification.json',JSON.stringify({crop:prior.crop,reports,identitySha256:identity.portraitSha256,approvedHeadSha256:approvedSha,approvedHeadSource:approved,method:'Complete corrected head with union silhouette replacement. Speaking mouth and upward eyes are bounded edits of that same approved head.'},null,2));
const catalog=JSON.parse(await fs.readFile(path.join(release,'lib/best-of-cartoons.json'),'utf8'));
const cities=JSON.parse(await fs.readFile(path.join(release,'lib/city-editions.json'),'utf8'));
const cartoons=[];
for(const item of [...catalog,...cities]){
 const actorId=item.variant+'-'+item.speaker.toLowerCase(),state=states[actorId];
 const sourcePath=path.join(release,'public',item.src),source=await fs.readFile(sourcePath);
 if(sha256(source)!==item.sha256)throw Error('Published source drift '+item.id);
 const before=await readRGB(source,W,H),after=Buffer.from(before);
 for(let i=0;i<allowed.length;i++)if(allowed[i]){
  if(!before.subarray(i*3,i*3+3).equals(state.before.subarray(i*3,i*3+3)))throw Error('Head differs from pinned plate: '+item.id+' pixel '+i);
  state.after.copy(after,i*3,i*3,i*3+3);
 }
 const audit=auditPixels(before,after,allowed);
 const bytes=await sharp(after,{raw:{width:W,height:H,channels:3}}).withMetadata({density:300}).png().toBuffer();
 const output=root+'/cartoons/'+item.id+'.png';await fs.writeFile(output,bytes);
 cartoons.push({id:item.id,actorId,sourcePath,sourceSha256:item.sha256,output,sha256:sha256(bytes),audit,captionUnchanged:true,metadata:item});
}
await fs.writeFile(root+'/rollout-verification.json',JSON.stringify({status:'pixel-checks-passed-pending-visual-review',ownerApprovedIdentity:true,identitySha256:identity.portraitSha256,approvedHeadSha256:approvedSha,approvedHeadSource:approved,cartoonCount:cartoons.length,bestOfCount:catalog.length,cityEditionCount:cities.length,actors:reports.map(({id,audit,sha256})=>({id,audit,sha256})),crop,headPolygon:global(head),mouthPolygon:global(mouth),eyePolygons:eyes.map(global),cartoons,productionUpdated:false},null,2));
await sharp({create:{width:1872,height:740,channels:3,background:'white'}}).composite(await Promise.all(['duo-drew','duo-barclay','trio-abby'].map(async(id,i)=>({input:await fs.readFile(root+'/'+id+'-face.png'),left:i*624,top:0})))).png().toFile(root+'/acting-review.png');
console.log(JSON.stringify({cartoons:cartoons.length,actors:reports.map(({id,audit})=>({id,audit})),protectedChanges:cartoons.reduce((n,c)=>n+c.audit.protectedChangedPixels,0)}));
