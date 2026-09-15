import { validateEditionInput, type EditionInput } from './automation-studio-core';
import type { AutomationJob } from './automation-queue-core';
export const US_STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','District of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
export function immediateEdition(city: string, state: string, quantity: number, now = new Date()): EditionInput {
  if (!US_STATES.includes(state) || !/^[\p{L}\p{M} .'-]{2,80}$/u.test(city.trim())) throw Error('Enter a city name and select its state.');
  let timezone='America/New_York';
  if (['Alabama','Arkansas','Illinois','Iowa','Kansas','Louisiana','Minnesota','Mississippi','Missouri','Nebraska','North Dakota','Oklahoma','South Dakota','Tennessee','Texas','Wisconsin'].includes(state)) timezone='America/Chicago';
  if (['Colorado','Idaho','Montana','New Mexico','Utah','Wyoming'].includes(state)) timezone='America/Denver';
  if (['California','Nevada','Oregon','Washington'].includes(state)) timezone='America/Los_Angeles';
  if (state==='Arizona') timezone='America/Phoenix';
  if (state==='Alaska') timezone='America/Anchorage';
  if (state==='Hawaii') timezone='Pacific/Honolulu';
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  return validateEditionInput({location:{name:city.trim(),region:state,country:'US',timezone,coverage:'city'},quantity,cast:'mixed',audience:'Adult local newspaper readers. Warm, smart, accessible money and everyday-life humor. Politically balanced. No investment advice or mockery of hardship.',timing:{mode:'now',date,time:'09:00',weekdays:[]}},now);
}
export function generationProgress(job: AutomationJob) {
  const percent=job.progress.total>0?Math.min(99,Math.floor(job.progress.completed/job.progress.total*100)):0;
  if(job.status==='succeeded')return {percent:100,label:'Your cartoons are ready',detail:`${job.input.quantity} completed cartoon${job.input.quantity===1?'':'s'}`};
  if(job.status==='failed')return {percent,label:'Another pass is needed',detail:recoveryReason(job)};
  if(job.status==='queued'&&job.scheduleStatus==='paused')return {percent:job.attempt?percent:0,label:'Schedule paused',detail:'This edition stays saved. Resume its schedule in Advanced plans and schedules when you are ready.'};
  if(job.status==='queued')return {percent:job.attempt?percent:0,label:job.attempt?'Saved · waiting to resume':'Request saved in the queue',detail:job.attempt?'The studio will retry automatically. Confirmed milestones stay saved.':'The studio will pick this up automatically when it is available.'};
  const stage=job.progress.stage;
  if(stage==='waiting-gpu')return {percent:job.progress.total>0?Math.min(99,Math.floor(job.progress.completed/job.progress.total*100)):0,label:'Waiting for the local GPU',detail:'Another local render is active. Completed work is saved; production resumes when the studio is free.'};
  const labels:Record<string,string>={starting:'Checking the studio',history:'Checking previous captions',sources:'Researching local subjects',draft:'Writing the caption',critique:'Reviewing the humor and grammar',tv:'Drawing the television artwork',vision:'Checking the television artwork',compose:'Assembling the cartoon',composed:'Cartoon assembled',uploading:'Saving your finished images'};
  const kind=stage.split('-')[0], count=stage.match(/^(?:draft|critique|tv|vision|compose)-(\d+)/)?.[1];
  // Only the worker's actual milestone counter drives this bar. Never a timer.
  return {percent:job.progress.total>0?Math.min(99,Math.floor(job.progress.completed/job.progress.total*100)):0,label:labels[kind]||'Working in the studio',detail:count?`Cartoon ${Number(count)} of ${job.input.quantity}`:'Your request and completed steps are saved.'};
}
export function recoveryReason(job: AutomationJob) {
  const error=job.lastError||'';
  if(/source|research/i.test(error))return 'Local research needs another pass. Check the city spelling, or retry with fresh dated sources.';
  if(/caption|editorial/i.test(error))return 'The captions did not clear editorial review. A fresh edition will try new ideas and check them again.';
  if(/TV|vision|visual/i.test(error))return 'The television artwork needs another pass. A fresh edition will create and review new artwork.';
  return 'Production needs attention before this edition can finish. Review the details or try a fresh edition; the original request stays saved.';
}
export function queueGroups(jobs: AutomationJob[],now=Date.now()) {
  const active=jobs.filter(j=>j.status==='running'||j.status==='queued').sort((a,b)=>{
    if((a.scheduleStatus==='paused')!==(b.scheduleStatus==='paused'))return a.scheduleStatus==='paused'?1:-1;
    if(a.status!==b.status)return a.status==='running'?-1:1;
    return Math.max(Date.parse(a.dueAt),Date.parse(a.availableAt))-Math.max(Date.parse(b.dueAt),Date.parse(b.availableAt))||a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id);
  });
  return {active,ready:jobs.filter(j=>j.status==='succeeded'),attention:jobs.filter(j=>j.status==='failed'),
    eligible:active.filter(j=>j.status==='queued'&&j.scheduleStatus!=='paused'&&Date.parse(j.dueAt)<=now&&Date.parse(j.availableAt)<=now)};
}
export function requestLabel(job: AutomationJob,now=Date.now()) {
  if(job.status==='succeeded')return 'Ready to view';
  if(job.status==='failed')return 'Another pass needed';
  if(job.status==='running')return job.progress.stage==='waiting-gpu'?'Waiting for GPU':'In production';
  if(job.scheduleStatus==='paused')return 'Schedule paused';
  if(Date.parse(job.dueAt)>now)return 'Scheduled';
  return job.attempt?'Auto-retry queued':'Queued';
}
export function matchingActiveEdition(jobs:AutomationJob[],city:string,state:string,quantity:number) {
  const key=(value:string)=>value.trim().toLocaleLowerCase('en-US');
  return jobs.find(j=>(j.status==='running'||j.status==='queued'&&j.scheduleStatus!=='paused')&&Date.parse(j.dueAt)<=Date.now()&&key(j.input.location.name)===key(city)&&key(j.input.location.region)===key(state)&&j.input.quantity===quantity&&j.input.cast==='mixed');
}
