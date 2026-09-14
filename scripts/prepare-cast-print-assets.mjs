// Color-space normalization for print delivery; no retouching or invented detail.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const source=path.resolve(process.argv[2]||'Z:/ImageGenerator/Cartoon/output/fixed-set-v1/cast-print-20260914-v1');
const output=path.resolve('public/gallery/cast-september-2026');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
await fs.mkdir(output,{recursive:true});
const report=[];
for(const id of ['drew','barclay','abby']){
  const input=await fs.readFile(id==='barclay'?'canon/fixed-set/barclay-reference-v1/approved-portrait.png':path.join(source,id+'-print-portrait.png'));
  const final=id==='barclay'?input:await sharp(input).grayscale().png({compressionLevel:9}).toBuffer();
  const {data,info}=await sharp(final).toColourspace('srgb').removeAlpha().raw().toBuffer({resolveWithObject:true});
  if(info.width!==1024||info.height!==1536)throw Error('Unexpected portrait size');
  for(let i=0;i<data.length;i+=3)if(data[i]!==data[i+1]||data[i]!==data[i+2])throw Error('Color remains');
  await fs.writeFile(path.join(output,id+'.png'),final);
  report.push({id,width:info.width,height:info.height,sourceSha256:hash(input),sha256:hash(final),bytes:final.length,strictGrayscale:true});
}
await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify({edition:'September 2026',portraits:report,barclayIdentity:'barclay-reference-v1',method:'Current presentation portraits. Barclay uses the exact owner-approved September 14 reference portrait, matched by the versioned cartoon acting plates. Strict grayscale delivery.'},null,2)+'\n');
console.log(JSON.stringify(report,null,2));
