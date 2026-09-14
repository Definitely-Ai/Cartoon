// Identity-preserving crops from current presentation portraits and published acting plates.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root=process.cwd(),studio=path.resolve(process.argv[2]||'Z:/ImageGenerator/Cartoon');
const publicDir=path.join(root,'public/gallery/cast-dossiers-20260914-v1');
const data=JSON.parse(await fs.readFile('lib/cast-dossiers.json','utf8'));
const acting=JSON.parse(await fs.readFile(path.join(studio,'output/fixed-set-v1/best-of-v1/acting/verification.json'),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex'),records=[];
await fs.mkdir(publicDir,{recursive:true});
for(const member of data){
  for(const item of [...member.signature.map(s=>({...s,kind:'detail',source:'public/gallery/cast-september-2026/'+member.id+'.png'})),...member.poses.map(p=>({...p,kind:'pose',crop:member.poseCrop}))]){
    const actor=item.actor?acting.reports.find(a=>a.id===item.actor):null;
    const source=actor?path.join(studio,actor.framePath):path.join(root,item.source);
    const original=await fs.readFile(source);
    if(actor&&hash(original)!==actor.sha256)throw Error('Current acting plate changed: '+actor.id);
    const [left,top,width,height]=item.crop;
    const bytes=await sharp(original).extract({left,top,width,height}).png().toBuffer();
    const filename=member.id+'-'+item.key+'.png';
    await fs.writeFile(path.join(publicDir,filename),bytes);
    records.push({character:member.id,key:item.key,kind:item.kind,filename,width,height,source:actor?.framePath||item.source,sourceSha256:hash(original),sha256:hash(bytes),crop:item.crop,actorId:actor?.id||null,acting:actor?.acting[member.id==='drew'?'Drew':member.id==='barclay'?'Barclay':'Abby']||null});
  }
}
await fs.writeFile(path.join(publicDir,'manifest.json'),JSON.stringify({edition:'September 14, 2026',method:'Unretouched pixel crops; no retired concept sheets, no resampling, no cast redraw. Pose cards are facial acting crops, not new full-body gestures.',assets:records},null,2)+'\n');
console.log('Prepared',records.length,'current-cast details and facial acting crops.');
