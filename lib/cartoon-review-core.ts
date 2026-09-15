import {AutomationError} from './automation-studio-core';
import {artifactName,exactKeys,uuid,type AutomationJob,type JobArtifact} from './automation-queue-core';
import type {BestOfCartoon} from './best-of-cartoons';

// The owner-approved head, not the earlier runtime's similar-looking retriever.
export const APPROVED_CAST={
  identity:'barclay-reference-v2',
  portrait:'938dcdb8d4fb191ddd7551c2a231b13596db645995fe57e722dfac5ebfb88493',
  head:'ab76ccbf36c54b1bb3b8aaebecb3913089d70cc162b865d0beedb199c6c89ce8',
  poses:{
    'duo-drew':'0b26d5c5d123d0a85d7a69c8bae87df64ae693980e2ebf430d72f956722d7660',
    'duo-barclay':'3f643713bf3700e8802295ff658df8f52a8c974efc8f514b1447e8de5efef889',
    'trio-drew':'78cb4bc8ea085620f3ae42dfa69b2e8ca586616d34fe97dcefba6cdb866f88ff',
    'trio-barclay':'8c433b161af35fe1d0e830134a1e12a6b5779ebd5847cb0258524cb70213804e',
    'trio-abby':'28e1a5870da8da0dce382eb42c1ed980ebd96eb8982c3e8ce10ce0a391ec0b7f',
  } as Record<string,string>,
};
export type ReviewDecision='draft'|'approved'|'rejected'|'withdrawn';
export type CartoonReview={imageName:string;imageSha256:string;decision:ReviewDecision;isPublic:boolean;version:number;updatedAt:string|null;eligible:boolean;blockReason:string|null;caption:string;tv:string;board:string[];sourceUrl:string|null;sourceTitle:string|null;explanation:string;publicId:string;title:string};
export type ReviewAction={jobId:string;imageName:string;action:'approve'|'reject'|'withdraw';title:string;expectedVersion:number;requestId:string;imageSha256:string;checks:{artwork:boolean;caption:boolean;context:boolean}};
const record=(v:unknown):Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const str=(v:unknown,max=1200)=>typeof v==='string'&&v.trim().length>0&&v.length<=max?v.trim():'';
function sourceURL(v:unknown){try{const u=new URL(str(v,2048));return /^https?:$/.test(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}}
export function publicationId(jobId:string,name:string){return `generated-${uuid(jobId)}-${artifactName(name).replace(/\.png$/,'')}`;}
export function reviewAction(raw:unknown):ReviewAction{
  const v=exactKeys(raw,['jobId','imageName','action','title','expectedVersion','requestId','imageSha256','checks'],'Editorial decision');
  const checks=exactKeys(v.checks,['artwork','caption','context'],'Review checklist');
  if(!['approve','reject','withdraw'].includes(String(v.action))||!Number.isSafeInteger(v.expectedVersion)||Number(v.expectedVersion)<0||
    typeof v.title!=='string'||v.title.length>100||typeof v.imageSha256!=='string'||! /^[a-f0-9]{64}$/.test(v.imageSha256)||Object.values(checks).some(c=>typeof c!=='boolean'))throw new AutomationError(400,'Choose a valid editorial decision.');
  if(v.action==='approve'&&(!v.title.trim()||Object.values(checks).some(c=>c!==true)))throw new AutomationError(400,'Review the artwork, caption, and source context before approving.');
  return {...v,jobId:uuid(v.jobId),imageName:artifactName(v.imageName),requestId:uuid(v.requestId),title:v.title.trim(),checks} as ReviewAction;
}
export function inspectCartoon(job:AutomationJob,art:JobArtifact,rawReport:unknown):CartoonReview{
  const report=record(rawReport),cartoons=Array.isArray(report.cartoons)?report.cartoons.map(record):[];
  const matching=cartoons.filter(c=>c.name===art.name),c=matching[0]||{},tv=record(c.tv),board=record(c.board),source=record(c.source),audit=record(c.audit);
  const lines=Array.isArray(board.lines)?board.lines.map(l=>str(l,100)).filter(Boolean):[];
  const speaker=str(c.speaker),variant=str(c.variant),pose=`${variant}-${speaker.toLowerCase()}`;
  const reportInput=record(report.input),location=record(reportInput.location),timing=record(reportInput.timing);
  const sameEdition=location.name===job.input.location.name&&location.region===job.input.location.region&&location.country===job.input.location.country&&timing.date===job.input.timing.date&&reportInput.quantity===job.input.quantity;
  const binding=report.jobId===job.id&&sameEdition&&matching.length===1&&c.sha256===art.sha256;
  const cast=report.castIdentity===APPROVED_CAST.identity&&report.castIdentitySha256===APPROVED_CAST.portrait&&report.castHeadSha256===APPROVED_CAST.head&&
    Object.hasOwn(APPROVED_CAST.poses,pose)&&c.actorId===pose&&c.actorSha256===APPROVED_CAST.poses[pose]&&c.retainedStaticCast===true;
  const caption=str(c.caption,400),headline=str(tv.headline,140),sourceUrl=sourceURL(source.url);
  const sourceRecord=(Array.isArray(report.sources)?report.sources.map(record):[]).find(s=>s.url===source.url);
  const context=!!caption&&!!headline&&lines.length>=1&&lines.length<=6&&lines.length===(Array.isArray(board.lines)?board.lines.length:0)&&!!sourceUrl;
  const safe=audit.protectedChangedPixels===0&&audit.coloredPixels===0;
  const blockReason=!binding?'The saved image and production report do not match. Keep this draft private.':!cast?'Older or unverified cast release. Regenerate with the approved Barclay worker before publication.':!safe?'The protected set or black-and-white checks did not pass.':!context?'Caption, TV, chalkboard, or source context is incomplete.':null;
  return {imageName:art.name,imageSha256:art.sha256,decision:'draft',isPublic:false,version:0,updatedAt:null,eligible:!blockReason,blockReason,caption,tv:headline,board:lines,sourceUrl,sourceTitle:str(sourceRecord?.title,300)||null,explanation:str(c.explanation),publicId:publicationId(job.id,art.name),title:`${job.input.location.name} · ${job.input.timing.date} · ${art.name.replace(/\D/g,'')}`};
}
export function publicationSnapshot(job:AutomationJob,review:CartoonReview,title:string,rawReport:unknown):BestOfCartoon{
  if(!review.eligible)throw new AutomationError(409,review.blockReason||'This draft is not ready for approval.');
  const c=(record(rawReport).cartoons as Record<string,unknown>[]).find(c=>c.name===review.imageName)!;
  const src=`/api/gallery/published/${review.publicId}`;
  return {id:review.publicId,title,speaker:c.speaker as BestOfCartoon['speaker'],variant:c.variant as BestOfCartoon['variant'],caption:review.caption,src,previewSrc:src,width:1024,height:1536,sha256:review.imageSha256,tv:review.tv,board:review.board,cityLabel:`${job.input.location.name}, ${job.input.location.region}`,editionDate:job.input.timing.date,sourceUrl:review.sourceUrl!,sourceTitle:review.sourceTitle||undefined,context:review.explanation,productionMethod:'Local generation; individually approved by the studio owner.'};
}
