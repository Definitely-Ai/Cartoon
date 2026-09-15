// Stage reviewed showcase assets locally. Git/Vercel publication is separate.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd(),output=path.join(root,'output/city-showcase-20260915'),target=path.join(root,'public/gallery/city-showcase-20260915');
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await fs.readFile(path.join(output,'manifest.json'),'utf8'));
const provenance=JSON.parse(await fs.readFile(path.join(output,'provenance.json'),'utf8'));
if(manifest.length!==12||new Set(manifest.map(c=>c.id)).size!==12)throw Error('The complete twelve-city edition is required');
await fs.mkdir(target,{recursive:true});
for(const c of manifest){
  const report=provenance.reports.find(r=>r.id===c.id),bytes=await fs.readFile(path.join(output,c.id,'cartoon-01.png'));
  if(hash(bytes)!==c.sha256||report.sha256!==c.sha256||report.audit.protectedChangedPixels||report.audit.coloredPixels)throw Error('Integrity or fixed-set failure: '+c.id);
  await fs.copyFile(path.join(output,c.id,'cartoon-01.png'),path.join(target,c.id+'.png'));
  await fs.copyFile(path.join(output,c.id,'preview.webp'),path.join(target,c.id+'.webp'));
}
await fs.writeFile(path.join(root,'lib/city-showcase-20260915.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Staged 12 source-checked city cartoons, with protected artwork and grayscale checks intact.');
