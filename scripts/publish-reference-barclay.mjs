// Publish only the owner-approved identity rollout after its pixel audit.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root=process.cwd(),studio=path.resolve(process.argv[2]||'Z:/ImageGenerator/Cartoon');
const work='output/fixed-set-v1/barclay-reference-rollout-v1';
const canonical='canon/fixed-set/barclay-reference-v1';
const digest=b=>createHash('sha256').update(b).digest('hex');
const report=JSON.parse(await fs.readFile(path.join(studio,work,'rollout-verification.json'),'utf8'));
if(!report.ownerApprovedIdentity||report.bestOfCount!==38||report.cityEditionCount!==2||report.cartoons.length!==40)throw Error('Unexpected rollout scope');
for(const item of report.cartoons){
 if(item.audit.protectedChangedPixels||item.audit.coloredPixels||!item.audit.changedPixels)throw Error('Invalid image audit '+item.id);
 const bytes=await fs.readFile(path.join(studio,item.output));if(digest(bytes)!==item.sha256)throw Error('New artwork drift '+item.id);
 const dest=path.join(root,'public',item.metadata.src),prior=await fs.readFile(dest);
 if(![item.sourceSha256,item.sha256].includes(digest(prior)))throw Error('Public original changed independently '+item.id);
 await fs.writeFile(dest,bytes);
 await sharp(bytes).resize({width:640}).webp({quality:88}).toFile(path.join(root,'public',item.metadata.previewSrc));
}
for(const name of ['best-of-cartoons','city-editions']){
 const file=path.join(root,'lib',name+'.json'),items=JSON.parse(await fs.readFile(file,'utf8'));
 for(const item of items){const approved=report.cartoons.find(a=>a.id===item.id);if(!approved)throw Error('Missing cartoon '+item.id);item.sha256=approved.sha256;}
 await fs.writeFile(file,JSON.stringify(items,null,2)+'\n');
}
const source='output/fixed-set-v1/barclay-reference-face-v1/portrait-monochrome.png';
const portrait=await fs.readFile(path.join(studio,source));
if(digest(portrait)!==report.identitySha256)throw Error('Approved portrait drift');
await fs.writeFile(path.join(root,'public/gallery/cast-september-2026/barclay.png'),portrait);
const acting=JSON.parse(await fs.readFile(path.join(studio,work,'acting/verification.json'),'utf8'));
for(const actor of acting.reports){
 const bytes=await fs.readFile(path.join(studio,actor.framePath));if(digest(bytes)!==actor.sha256)throw Error('Acting drift '+actor.id);
 actor.framePath=canonical+'/acting/'+actor.id+'.png';
 for(const workspace of [studio,root]){await fs.mkdir(path.dirname(path.join(workspace,actor.framePath)),{recursive:true});await fs.writeFile(path.join(workspace,actor.framePath),bytes);}
}
for(const workspace of [studio,root]){
 await fs.writeFile(path.join(workspace,canonical,'acting/verification.json'),JSON.stringify(acting,null,2)+'\n');
 await fs.writeFile(path.join(workspace,canonical,'approved-portrait.png'),portrait);
 await fs.copyFile(path.join(studio,'output/fixed-set-v1/barclay-reference-face-v1/owner-reference.png'),path.join(workspace,canonical,'owner-reference.png'));
}
const proof={identity:'barclay-reference-v1',approvedOn:'2026-09-14',ownerApproval:'I like it fully implement him in all of the cartoons and update the 38 cartoons with him',portraitSha256:report.identitySha256,method:'Built-in reference-conditioned image edits followed by deterministic, protected-pixel compositing. All previous art retained in the studio and Git history.',scope:{bestOf:38,cityEditions:2,actingPlates:5},cartoons:report.cartoons.map(({id,sourceSha256,sha256,audit,actorId})=>({id,sourceSha256,sha256,audit,actorId})),acting:acting.reports.map(({id,sha256,audit})=>({id,sha256,audit}))};
await fs.mkdir(path.join(root,'docs/artwork'),{recursive:true});
await fs.writeFile(path.join(root,'docs/artwork/barclay-reference-rollout.json'),JSON.stringify(proof,null,2)+'\n');
console.log('Published 40 local gallery images, the approved portrait, and five versioned acting plates. Live deployment is still required.');
