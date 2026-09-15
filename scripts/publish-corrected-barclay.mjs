// Scoped promotion of the owner-approved whole-head correction.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const studio=path.resolve(process.argv[2]||'Z:/ImageGenerator/Cartoon');
const work='output/fixed-set-v1/barclay-reference-rollout-v2',canonical='canon/fixed-set/barclay-reference-v2';
const hash=b=>createHash('sha256').update(b).digest('hex');
const report=JSON.parse(await fs.readFile(path.join(studio,work,'rollout-verification.json'),'utf8'));
if(!report.ownerApprovedIdentity||report.cartoons.length!==40||report.approvedHeadSha256!=='ab76ccbf36c54b1bb3b8aaebecb3913089d70cc162b865d0beedb199c6c89ce8')throw Error('Wrong approved correction');
// Verify every file BEFORE replacing any selected public original.
for(const c of report.cartoons){
 if(c.audit.protectedChangedPixels||c.audit.coloredPixels||!c.audit.changedPixels)throw Error('Failed audit '+c.id);
 if(hash(await fs.readFile(path.join(studio,c.output)))!==c.sha256)throw Error('Output drift '+c.id);
 if(![c.sourceSha256,c.sha256].includes(hash(await fs.readFile(path.join('public',c.metadata.src)))))throw Error('Independent public change '+c.id);
}
for(const c of report.cartoons){
 const bytes=await fs.readFile(path.join(studio,c.output));
 await fs.writeFile(path.join('public',c.metadata.src),bytes);
 await sharp(bytes).resize({width:640}).webp({quality:88}).toFile(path.join('public',c.metadata.previewSrc));
}
for(const name of ['best-of-cartoons','city-editions']){
 const file='lib/'+name+'.json',items=JSON.parse(await fs.readFile(file,'utf8'));
 for(const item of items)item.sha256=report.cartoons.find(c=>c.id===item.id).sha256;
 await fs.writeFile(file,JSON.stringify(items,null,2)+'\n');
}
const identity=JSON.parse(await fs.readFile('lib/cast-identity.json','utf8'));
const portrait=await fs.readFile(identity.portraitPath);
const acting=JSON.parse(await fs.readFile(path.join(studio,work,'acting/verification.json'),'utf8'));
for(const a of acting.reports){
 const bytes=await fs.readFile(path.join(studio,a.framePath));if(hash(bytes)!==a.sha256)throw Error('Pose drift '+a.id);
 a.framePath=canonical+'/acting/'+a.id+'.png';
 for(const workspace of [process.cwd(),studio]){await fs.mkdir(path.dirname(path.join(workspace,a.framePath)),{recursive:true});await fs.writeFile(path.join(workspace,a.framePath),bytes);}
}
for(const workspace of [process.cwd(),studio]){
 await fs.writeFile(path.join(workspace,canonical,'acting/verification.json'),JSON.stringify(acting,null,2)+'\n');
 await fs.writeFile(path.join(workspace,canonical,'approved-portrait.png'),portrait);
 await fs.copyFile(path.join(studio,report.approvedHeadSource),path.join(workspace,canonical,'approved-head.png'));
 await fs.copyFile(path.join(studio,work,'speak-generated.png'),path.join(workspace,canonical,'speaking-source.png'));
 await fs.copyFile(path.join(studio,work,'listen-abby-generated.png'),path.join(workspace,canonical,'upward-gaze-source.png'));
}
Object.assign(identity,{id:'barclay-reference-v2',portraitPath:canonical+'/approved-portrait.png',actingManifest:canonical+'/acting/verification.json',actingRoot:canonical+'/acting',approvedHeadPath:canonical+'/approved-head.png',approvedHeadSha256:report.approvedHeadSha256,scope:'Earlier reference identity with owner-approved complete forehead, ear and under-chin repair. Original portrait retained; all five scene poses use the corrected whole head.'});
await fs.writeFile('lib/cast-identity.json',JSON.stringify(identity,null,2)+'\n');
const proof={identity:identity.id,approvedOn:'2026-09-14',ownerApproval:'perfect fix all of the cartoons',portraitSha256:identity.portraitSha256,approvedHeadSha256:report.approvedHeadSha256,method:acting.method,scope:{bestOf:38,cityEditions:2,actingPlates:5},visualReview:{checked:['rounded crown','far-eye outline','near ear and nape','single chin outline','collar join','open speaking mouth','listener gaze'],allFivePlatesReviewed:true},cartoons:report.cartoons.map(({id,sourceSha256,sha256,audit,actorId})=>({id,sourceSha256,sha256,audit,actorId})),acting:acting.reports.map(({id,sha256,audit})=>({id,sha256,audit}))};
await fs.writeFile('docs/artwork/barclay-reference-rollout.json',JSON.stringify(proof,null,2)+'\n');
console.log('Updated 40 local originals, previews and five versioned poses. Deployment still pending.');
