import fs from 'node:fs/promises';
import path from 'node:path';
import {hash,atomicWrite,inside,uploadArtifacts,WorkerError} from './worker-core.mjs';

export function panelGeometry(acting,regions){
  const W=1024,H=1536,{crop}=acting,scaleX=W/crop.width,scaleY=Math.round(crop.height*scaleX)/crop.height;
  const map=p=>p.map(([x,y])=>[(x-crop.left)*scaleX,(y-crop.top)*scaleY]);
  return {W,H,tvQuad:map(regions.tv),boardQuad:map(regions.board),foot:[[0,1365],[W,1365],[W,H],[0,H]]};
}
export async function buildCanvas(ctx,m,actor,acting,regions){
  const geometry=panelGeometry(acting,regions),{W,H,tvQuad,boardQuad}=geometry;
  const bytes=await fs.readFile(await inside(ctx.config.workspaceRoot,actor.framePath));
  if(hash(bytes)!==actor.sha256)throw new WorkerError('Approved cast plate changed.');
  const base=await m.core.readRGB(bytes,W,H);
  // Erase only the two replaceable display surfaces, not any part of the cast.
  let pixels=m.core.warp(base,W,H,Buffer.alloc(3*4,24),2,2,tvQuad);
  pixels=m.core.warp(pixels,W,H,Buffer.alloc(3*4,29),2,2,boardQuad);
  return {...geometry,base,pixels};
}
export async function saveBuildFrame(ctx,m,{stage,index,cast,actor,selected,pixels,png}){
  if(ctx.config.buildPreviews!==true)return;
  ctx.assertLease();
  const image=await (png?m.sharp(png):m.sharp(pixels,{raw:{width:1024,height:1536,channels:3}})).grayscale().png({compressionLevel:9}).toBuffer();
  const sha=hash(image),name=`build-${String(index+1).padStart(2,'0')}-${sha.slice(0,20)}.png`;
  const relative=path.join('build-previews',name);
  await atomicWrite(path.join(ctx.dir,relative),image);
  const frame={index:index+1,stage,...cast,actorSha256:actor.sha256,caption:selected?.caption||'',tvHeadline:selected?.tvHeadline||'',boardLines:selected?.boardLines||[],sourceTitle:(selected?.source?.title||'').slice(0,300),sourceUrl:selected?.source?.url||'',sourceScope:(selected?.source?.scope||'').slice(0,1200)};
  const key=`${ctx.job.attempt}:${index+1}:${stage}`,signature=hash({frame,sha});
  ctx.state.buildReceipts??={};
  if(ctx.state.buildReceipts[key]){
    if(ctx.state.buildReceipts[key]!==signature)throw new WorkerError('Saved assembly checkpoint changed.');
    return;
  }
  const [artifact]=await uploadArtifacts(ctx,[await ctx.artifact(relative,'image','image/png')]);
  const result=await ctx.api.call({action:'build',jobId:ctx.job.id,leaseToken:ctx.job.leaseToken,frame:{...frame,artifact}},{signal:ctx.signal});
  if(result.saved!==true)throw new WorkerError('Assembly checkpoint is not confirmed.',{retryable:true});
  ctx.state.buildReceipts[key]=signature;await ctx.flush();
}
