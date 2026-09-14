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
  if(job.status==='succeeded')return {percent:100,label:'Your cartoons are ready',detail:`${job.input.quantity} completed cartoon${job.input.quantity===1?'':'s'}`};
  if(job.status==='failed')return {percent:0,label:'This edition needs attention',detail:job.lastError || 'No incomplete cartoon was delivered.'};
  if(job.status==='queued')return {percent:0,label:job.attempt?'Waiting to resume':'Request saved in the queue',detail:job.lastError || 'The studio will pick this up automatically when it is available.'};
  const stage=job.progress.stage;
  const labels:Record<string,string>={starting:'Checking the studio',history:'Checking previous captions',sources:'Researching local subjects',draft:'Writing the caption',critique:'Reviewing the humor and grammar',tv:'Drawing the television artwork',vision:'Checking the television artwork',compose:'Assembling the cartoon',composed:'Cartoon assembled',uploading:'Saving your finished images'};
  const kind=stage.split('-')[0], count=stage.match(/^(?:draft|critique|tv|vision|compose)-(\d+)/)?.[1];
  // Only the worker's actual milestone counter drives this bar. Never a timer.
  return {percent:job.progress.total>0?Math.min(99,Math.floor(job.progress.completed/job.progress.total*100)):0,label:labels[kind]||'Working in the studio',detail:count?`Cartoon ${Number(count)} of ${job.input.quantity}`:'Your request and completed steps are saved.'};
}
