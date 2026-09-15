import type {AutomationJob,JobArtifact} from './automation-queue-core';
import type {CartoonReview} from './cartoon-review-core';

// A saved result is not proof that its artwork uses the current approved cast.
export function verifiedPreview(art:JobArtifact,review?:CartoonReview):boolean {
  return review?.eligible===true&&review.imageName===art.name&&review.imageSha256===art.sha256;
}
export function defaultGenerationJob(jobs:AutomationJob[],now=Date.now()):AutomationJob|undefined {
  return jobs.find(j=>j.status==='running')||jobs.find(j=>j.status==='queued'&&j.scheduleStatus!=='paused'&&Date.parse(j.dueAt)<=now);
}
export function approvedThumbnail(job:AutomationJob):JobArtifact|undefined {
  const images=job.artifacts.filter(a=>a.kind==='image');
  // Do not guess which image was approved in a partially reviewed batch.
  return images.length>0&&job.editorial?.approved===images.length&&job.editorial.draft===0&&job.editorial.rejected===0&&job.editorial.withdrawn===0?images[0]:undefined;
}
