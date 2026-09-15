import 'server-only';
import sharp from 'sharp';
import {AutomationError} from './automation-studio-core';
import {uuid} from './automation-queue-core';
import {completedOwnerJob,verifiedOwnerArtifact,queueDatabaseConfig,queueDatabaseData} from './automation-queue-server';
import {inspectCartoon,publicationSnapshot,reviewAction,type CartoonReview,type ReviewDecision} from './cartoon-review-core';
import type {BestOfCartoon} from './best-of-cartoons';

type Row={public_id:string;job_id:string;image_name:string;decision:Exclude<ReviewDecision,'draft'>;version:number;updated_at:string;image_sha256:string;report_sha256:string;snapshot:BestOfCartoon|null};
const fields='public_id,job_id,image_name,decision,version,updated_at,image_sha256,report_sha256,snapshot';
async function rows(query:Record<string,string>):Promise<Row[]>{
  const result=await queueDatabaseData(queueDatabaseConfig(),`/rest/v1/cartoon_reviews?${new URLSearchParams({select:fields,owner_key:'eq.backroom-owner',limit:'1000',...query})}`);
  if(!Array.isArray(result)||result.length>=1000||result.some(r=>!r||!['approved','rejected','withdrawn'].includes(r.decision)||!Number.isSafeInteger(r.version)||r.version<1||typeof r.public_id!=='string'))throw new AutomationError(503,'Editorial decisions are temporarily unavailable.');
  return result;
}
async function loadEdition(jobId:string){
  const job=await completedOwnerJob(uuid(jobId));
  const manifest=job.artifacts.find(a=>a.name==='edition-report.json'&&a.kind==='report'&&a.contentType==='application/json');
  const report=manifest?JSON.parse((await verifiedOwnerArtifact(job,manifest.name)).toString('utf8')):null;
  return {job,manifest,report};
}
async function hiddenIds():Promise<Set<string>>{
  const result=await queueDatabaseData(queueDatabaseConfig(),'/rest/v1/gallery_visibility?select=cartoon_id&hidden=eq.true&limit=1000');
  if(!Array.isArray(result)||result.length>=1000)throw new AutomationError(503,'Gallery visibility is unavailable.');
  return new Set(result.map(r=>r.cartoon_id));
}
function withDecision(review:CartoonReview,row?:Row,hidden=false):CartoonReview{
  if(!row)return review;
  if(row.image_sha256!==review.imageSha256)throw new AutomationError(409,'This review belongs to a different saved image.');
  return {...review,decision:row.decision,isPublic:row.decision==='approved'&&!hidden,version:row.version,updatedAt:row.updated_at,title:row.snapshot?.title||review.title};
}
export async function editionReviews(jobId:string){
  const [{job,report},decisions,hidden]=await Promise.all([loadEdition(jobId),rows({job_id:`eq.${uuid(jobId)}`}),hiddenIds()]);
  return {jobId:job.id,reviews:job.artifacts.filter(a=>a.kind==='image').map(a=>{const review=inspectCartoon(job,a,report);return withDecision(review,decisions.find(r=>r.image_name===a.name),hidden.has(review.publicId));})};
}
export async function decideCartoon(raw:unknown){
  const action=reviewAction(raw),{job,manifest,report}=await loadEdition(action.jobId);
  const art=job.artifacts.find(a=>a.kind==='image'&&a.name===action.imageName);
  if(!art||art.sha256!==action.imageSha256||!manifest)throw new AutomationError(409,'The image or report changed. Reload the review before deciding.');
  const review=inspectCartoon(job,art,report);
  let snapshot=null;
  if(action.action==='approve'){
    snapshot=publicationSnapshot(job,review,action.title,report);
    const bytes=await verifiedOwnerArtifact(job,art.name),meta=await sharp(bytes).metadata();
    if(meta.width!==1024||meta.height!==1536)throw new AutomationError(409,'The image does not match the expected print dimensions.');
  }
  try{
    const result=await queueDatabaseData(queueDatabaseConfig(),'/rest/v1/rpc/review_generated_cartoon',{
      p_job_id:job.id,p_image_name:art.name,p_public_id:review.publicId,p_decision:action.action==='approve'?'approved':action.action==='reject'?'rejected':'withdrawn',
      p_image_sha256:art.sha256,p_report_sha256:manifest.sha256,p_snapshot:snapshot,p_expected_version:action.expectedVersion,p_request_id:action.requestId,p_checks:action.checks,
    });
    const row=(Array.isArray(result)?result[0]:result) as Row;
    if(!row||row.public_id!==review.publicId||!Number.isSafeInteger(row.version)||!['approved','rejected','withdrawn'].includes(row.decision))throw new AutomationError(503,'The editorial decision is not confirmed. Reload to check its status.');
    return withDecision(review,row,(await hiddenIds()).has(review.publicId));
  }catch(e){if(e instanceof AutomationError&&e.status===409)throw new AutomationError(409,'This review changed in another session. Reload it before deciding again.');throw e;}
}
function snapshot(row:Row):BestOfCartoon{
  const s=row.snapshot,src=`/api/gallery/published/${row.public_id}`;
  if(!s||s.id!==row.public_id||s.sha256!==row.image_sha256||s.src!==src||s.previewSrc!==src||s.width!==1024||s.height!==1536)throw new AutomationError(503,'Published artwork metadata is unavailable.');
  return s;
}
export async function approvedGeneratedCartoons():Promise<BestOfCartoon[]>{
  return (await rows({decision:'eq.approved',order:'updated_at.desc,public_id'})).map(snapshot);
}
export async function publishedCartoonImage(id:string){
  if(!/^generated-[a-f0-9-]{36}-cartoon-[0-9]{2}$/.test(id))throw new AutomationError(404,'Published cartoon not found.');
  const [published,hidden]=await Promise.all([rows({public_id:`eq.${id}`,decision:'eq.approved'}),queueDatabaseData(queueDatabaseConfig(),`/rest/v1/gallery_visibility?select=cartoon_id&cartoon_id=eq.${id}&hidden=eq.true&limit=1`)]);
  if(!Array.isArray(hidden))throw new AutomationError(503,'Gallery availability could not be checked.');
  if(published.length!==1||hidden.length)throw new AutomationError(404,'Published cartoon not found.');
  const row=published[0];snapshot(row);
  const job=await completedOwnerJob(row.job_id),art=job.artifacts.find(a=>a.name===row.image_name&&a.kind==='image'&&a.sha256===row.image_sha256);
  if(!art)throw new AutomationError(404,'Published cartoon not found.');
  const bytes=await verifiedOwnerArtifact(job,art.name);
  // Recheck after the fetch: withdrawal while the image was loading must win.
  const [current,nowHidden]=await Promise.all([rows({public_id:`eq.${id}`,decision:'eq.approved',version:`eq.${row.version}`}),queueDatabaseData(queueDatabaseConfig(),`/rest/v1/gallery_visibility?select=cartoon_id&cartoon_id=eq.${id}&hidden=eq.true&limit=1`)]);
  if(!Array.isArray(nowHidden))throw new AutomationError(503,'Gallery availability could not be checked.');
  if(current.length!==1||nowHidden.length)throw new AutomationError(404,'Published cartoon not found.');
  return bytes;
}
