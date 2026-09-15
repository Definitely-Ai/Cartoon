import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const castFor = variant => {
  if (!['duo','trio'].includes(variant)) throw Error('Unknown cast variant');
  return variant === 'duo' ? ['Drew','Barclay'] : ['Drew','Barclay','Abby'];
};
export function actingFor(variant, speaker) {
  const cast=castFor(variant);
  if(!cast.includes(speaker))throw Error('Speaker is not present');
  return Object.fromEntries(cast.map(name=>[name,{mouth:name===speaker?'open':'closed',lookAt:name===speaker?(speaker==='Drew'?'Barclay':'Drew'):speaker}]));
}
export function validateEpisode(e) {
  const acting=actingFor(e.variant,e.speaker);
  if(typeof e.line!=='string'||!e.line.trim()||e.line.split(/\s+/u).length>20)throw Error('Caption must contain 1–20 words');
  if(/[\r\n<>]/u.test(e.line))throw Error('Caption must be plain single-line text');
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(e.id))throw Error('Invalid episode id');
  if(typeof e.tv?.headline!=='string'||e.tv.headline.length>30||/[\r\n]/u.test(e.tv.headline))throw Error('TV requires one headline, at most 30 characters');
  if(e.tv.headline&&(!e.tv.picture||!/^\d{1,2}:\d{2} ET$/u.test(e.tv.timestamp)))throw Error('TV requires a literal picture brief and an explicit scene timestamp');
  if(!Array.isArray(e.board?.lines)||e.board.lines.length>5||e.board.lines.length===1||e.board.lines.some(l=>typeof l!=='string'||!l.length||l.length>22))throw Error('Board needs zero or 2–5 short lines');
  if(e.board.lines.length&&!e.board.lines.some(l=>/\d/u.test(l)))throw Error('The board must price the joke');
  if(!e.sources?.length||e.sources.some(s=>!/^https:\/\//u.test(s.url)||!s.checkedOn||!s.supports))throw Error('Dated sources are required');
  return acting;
}
export function inside(x,y,p) {
  let yes=false;
  for(let i=0,j=p.length-1;i<p.length;j=i++) {
    const a=p[j],b=p[i];
    if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;
  }
  return yes;
}
export function maskFor(width,height,polygons) {
  const mask=new Uint8Array(width*height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(polygons.some(p=>inside(x+.5,y+.5,p)))mask[y*width+x]=1;
  return mask;
}
export function compositeMasked(base,donor,mask) {
  if(base.length!==donor.length||base.length!==mask.length*3)throw Error('Pixel dimensions differ');
  const out=Buffer.from(base);
  for(let i=0;i<mask.length;i++)if(mask[i])donor.copy(out,i*3,i*3,i*3+3);
  return out;
}
export function blendMasked(base,donor,mask,width,height,radius=3) {
  if(!Number.isInteger(radius)||radius<0)throw Error('Blend radius must be a nonnegative integer');
  const out=compositeMasked(base,donor,mask);
  if(radius===0)return out;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const i=y*width+x;if(!mask[i])continue;
    let distance=radius;
    for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++) {
      if(x+dx<0||x+dx>=width||y+dy<0||y+dy>=height||!mask[(y+dy)*width+x+dx])distance=Math.min(distance,Math.hypot(dx,dy));
    }
    const a=distance/radius;
    for(let c=0;c<3;c++)out[i*3+c]=Math.round(base[i*3+c]*(1-a)+donor[i*3+c]*a);
  }
  return out;
}
export function auditPixels(master,output,mask) {
  if(master.length!==output.length||output.length!==mask.length*3)throw Error('Audit dimensions differ');
  let changedPixels=0,protectedChangedPixels=0,coloredPixels=0;
  for(let i=0;i<mask.length;i++) {
    const j=i*3;
    if(output[j]!==output[j+1]||output[j]!==output[j+2])coloredPixels++;
    if(master[j]!==output[j]||master[j+1]!==output[j+1]||master[j+2]!==output[j+2]) {
      changedPixels++; if(!mask[i])protectedChangedPixels++;
    }
  }
  if(protectedChangedPixels||coloredPixels)throw Error(`Pixel lock failed: ${protectedChangedPixels} protected, ${coloredPixels} colored`);
  return {changedPixels,protectedChangedPixels,coloredPixels};
}
// Solve an eight-unknown projective transform from destination corners to UV.
export function homography(quad) {
  const uv=[[0,0],[1,0],[1,1],[0,1]],a=[];
  for(let i=0;i<4;i++) {
    const [x,y]=quad[i],[u,v]=uv[i];
    a.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);
  }
  for(let i=0;i<8;i++) {
    let pivot=i; for(let j=i+1;j<8;j++)if(Math.abs(a[j][i])>Math.abs(a[pivot][i]))pivot=j;
    [a[i],a[pivot]]=[a[pivot],a[i]];
    if(Math.abs(a[i][i])<1e-10)throw Error('Degenerate display quadrilateral');
    const d=a[i][i];for(let k=i;k<9;k++)a[i][k]/=d;
    for(let j=0;j<8;j++)if(j!==i){const f=a[j][i];for(let k=i;k<9;k++)a[j][k]-=f*a[i][k];}
  }
  return [...a.map(row=>row[8]),1];
}
export function project(h,x,y) {
  const d=h[6]*x+h[7]*y+1;
  return [(h[0]*x+h[1]*y+h[2])/d,(h[3]*x+h[4]*y+h[5])/d];
}
export function warp(base,width,height,source,sw,sh,quad) {
  const out=Buffer.from(base),h=homography(quad);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    if(!inside(x+.5,y+.5,quad))continue;
    const [u,v]=project(h,x+.5,y+.5);
    const sx=Math.max(0,Math.min(sw-1,u*(sw-1))),sy=Math.max(0,Math.min(sh-1,v*(sh-1)));
    const x0=Math.floor(sx),y0=Math.floor(sy),x1=Math.min(sw-1,x0+1),y1=Math.min(sh-1,y0+1),fx=sx-x0,fy=sy-y0;
    for(let c=0;c<3;c++)out[(y*width+x)*3+c]=Math.round(
      source[(y0*sw+x0)*3+c]*(1-fx)*(1-fy)+source[(y0*sw+x1)*3+c]*fx*(1-fy)+
      source[(y1*sw+x0)*3+c]*(1-fx)*fy+source[(y1*sw+x1)*3+c]*fx*fy);
  }
  return out;
}
export async function readRGB(file,width,height) {
  const {data,info}=await sharp(file).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
  if(info.width!==width||info.height!==height)throw Error(`Wrong dimensions: ${Buffer.isBuffer(file)?'[image buffer]':file}; expected ${width}x${height}, received ${info.width}x${info.height}`);
  return data;
}
export async function checkedAsset(root,asset) {
  const file=path.resolve(root,asset.file),rel=path.relative(root,file);
  if(rel.startsWith('..')||path.isAbsolute(rel))throw Error('Asset escapes scene directory');
  const bytes=await fs.readFile(file);
  if(sha256(bytes)!==asset.sha256)throw Error(`Asset hash mismatch: ${asset.file}`);
  return bytes;
}
export const escapeXML=s=>s.replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
