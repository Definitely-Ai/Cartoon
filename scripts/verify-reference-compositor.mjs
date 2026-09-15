// Isolated replay of the real compositor with retained TV art. No cloud job,
// inference, upload, or claim of fresh editorial/generation approval is made.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const [configPath,tvPath,out]=process.argv.slice(2);
if(!configPath||!tvPath||!out)throw Error('Provide config, retained TV image, and isolated output directory.');
const config=JSON.parse(await fs.readFile(configPath,'utf8'));
const root=config.workspaceRoot;
const load=relative=>import(pathToFileURL(path.join(root,relative)).href);
const {verifyRuntime,hash}=await load('scripts/automation/worker-core.mjs');
await verifyRuntime(config);
const {composeProductionPanel}=await load('scripts/automation/production-adapter.mjs');
process.chdir(root);
const m={core:await load('scripts/fixed-set/core.mjs'),typography:await load('scripts/fixed-set/typography.mjs'),sharp:createRequire(path.join(root,'package.json'))('sharp')};
const acting=JSON.parse(await fs.readFile(path.join(root,'canon/fixed-set/barclay-reference-v2/acting/verification.json'),'utf8'));
assert.equal(acting.identitySha256,'938dcdb8d4fb191ddd7551c2a231b13596db645995fe57e722dfac5ebfb88493');
const regions=JSON.parse(await fs.readFile(path.join(root,'canon/fixed-set/v1/regions.json'),'utf8'));
await fs.mkdir(out,{recursive:false});
const results=[];
for(const [index,actor] of acting.reports.entries()){
  const [variant,name]=actor.id.split('-');
  const speaker=name[0].toUpperCase()+name.slice(1);
  const episode={variant,speaker,line:'The view is included. The house costs extra.',tv:{headline:'HOUSING COSTS',timestamp:'6:00 PM'},board:{lines:['HOUSE RED','$8','VIEW INCLUDED']}};
  const result=await composeProductionPanel({config,dir:out},m,episode,tvPath,actor,acting,regions,index);
  assert.equal(result.audit.protectedChangedPixels,0);
  assert.equal(result.audit.coloredPixels,0);
  const region={left:712,top:620,width:312,height:370};
  const actual=await m.sharp(path.join(out,result.name)).extract(region).removeAlpha().toColourspace('srgb').raw().toBuffer();
  const expected=await m.sharp(path.join(root,actor.framePath)).extract(region).removeAlpha().toColourspace('srgb').raw().toBuffer();
  assert.ok(actual.equals(expected),'Approved head must survive the real composition unchanged.');
  results.push(result);
}
const report={method:'Actual production compositor replay with retained TV artwork; no fresh inference or cloud delivery',at:new Date().toISOString(),castIdentity:'barclay-reference-v2',identitySha256:acting.identitySha256,approvedHeadSha256:acting.approvedHeadSha256,runtimePinsHash:hash(config.runtimePins),results};
await fs.writeFile(path.join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({poses:results.length,protectedChangedPixels:0,coloredPixels:0,report:path.join(out,'verification.json')}));
