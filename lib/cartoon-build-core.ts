import {AutomationError} from './automation-studio-core';
import {artifact,exactKeys,type JobArtifact} from './automation-queue-core';
import {APPROVED_CAST} from './cartoon-review-core';

export const BUILD_STAGES=['cast','story','tv','chalk','lettering'] as const;
export type BuildStage=typeof BUILD_STAGES[number];
export const BUILD_LABELS:Record<BuildStage,string>={cast:'Set & cast',story:'The idea',tv:'TV artwork',chalk:'Handwritten chalk',lettering:'Final lettering'};
export type BuildFrame={index:number;stage:BuildStage;variant:'duo'|'trio';speaker:string;actorSha256:string;artifact:JobArtifact;caption:string;tvHeadline:string;boardLines:string[];sourceTitle:string;sourceUrl:string;sourceScope:string};
export type SavedBuildFrame=BuildFrame&{attempt:number;savedAt:string};
const fail=():never=>{throw new AutomationError(400,'Invalid private build checkpoint.');};
function text(value:unknown,max:number){if(typeof value!=='string'||value.length>max||/[\u0000-\u001f\u007f<>]/.test(value))return fail();return value.trim();}
export function buildFrame(raw:unknown):BuildFrame{
  const v=exactKeys(raw,['index','stage','variant','speaker','actorSha256','artifact','caption','tvHeadline','boardLines','sourceTitle','sourceUrl','sourceScope'],'Build checkpoint');
  if(!Number.isSafeInteger(v.index)||Number(v.index)<1||Number(v.index)>12||!BUILD_STAGES.includes(v.stage as BuildStage)||!['duo','trio'].includes(String(v.variant)))return fail();
  const speaker=text(v.speaker,12),actor=`${v.variant}-${speaker.toLowerCase()}`;
  if(!APPROVED_CAST.poses[actor]||v.actorSha256!==APPROVED_CAST.poses[actor])throw new AutomationError(409,'This build does not use the approved cast.');
  const image=artifact(v.artifact,true);
  if(image.kind!=='image'||image.bytes>4*1024*1024||image.name!==`build-${String(v.index).padStart(2,'0')}-${image.sha256.slice(0,20)}.png`)return fail();
  const caption=text(v.caption,240),tvHeadline=text(v.tvHeadline,30),sourceTitle=text(v.sourceTitle,300),sourceUrl=text(v.sourceUrl,2048),sourceScope=text(v.sourceScope,1200);
  if(!Array.isArray(v.boardLines)||v.boardLines.length>4)return fail();
  const boardLines=v.boardLines.map(line=>text(line,18));
  if(v.stage!=='cast'&&(!caption||!tvHeadline||boardLines.length<2||!sourceTitle||!sourceUrl))return fail();
  if(sourceUrl){try{const url=new URL(sourceUrl);if(url.protocol!=='https:'||url.username||url.password||url.hash)return fail();}catch{return fail();}}
  return {index:Number(v.index),stage:v.stage as BuildStage,variant:v.variant as 'duo'|'trio',speaker,actorSha256:String(v.actorSha256),artifact:image,caption,tvHeadline,boardLines,sourceTitle,sourceUrl,sourceScope};
}
// Saved stages, not elapsed time, determine which parts are available to inspect.
export function latestBuildFrames(frames:SavedBuildFrame[]):SavedBuildFrame[]{
  const map=new Map<string,SavedBuildFrame>();
  for(const frame of frames){const key=`${frame.index}:${frame.stage}`,old=map.get(key);if(!old||frame.attempt>old.attempt)map.set(key,frame);}
  return [...map.values()].sort((a,b)=>a.index-b.index||BUILD_STAGES.indexOf(a.stage)-BUILD_STAGES.indexOf(b.stage));
}
