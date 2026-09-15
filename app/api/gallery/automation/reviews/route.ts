import {cookies} from 'next/headers';
import {revalidatePath} from 'next/cache';
import {BACKROOM_COOKIE,isDoorOpen} from '@/lib/backroom-auth';
import {AutomationError} from '@/lib/automation-studio-core';
import {readQueueJson,sameOrigin} from '@/lib/automation-queue-core';
import {editionReviews,decideCartoon} from '@/lib/cartoon-review-server';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store',Vary:'Cookie','X-Content-Type-Options':'nosniff'}});
const failure=(e:unknown)=>json({error:e instanceof AutomationError?e.message:'Editorial review is temporarily unavailable. Your draft remains saved.'},e instanceof AutomationError?e.status:503);
export async function GET(request:Request){try{
  if(!await isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value))return json({error:'Sign in to review private drafts.'},401);
  sameOrigin(request,false);const q=new URL(request.url).searchParams;
  if([...q.keys()].length!==1||!q.has('jobId'))throw new AutomationError(400,'Choose an edition to review.');
  return json(await editionReviews(q.get('jobId')!));
}catch(e){return failure(e);}}
export async function POST(request:Request){try{
  if(!await isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value))return json({error:'Sign in to approve cartoons.'},401);
  sameOrigin(request);const review=await decideCartoon(await readQueueJson(request));
  revalidatePath('/gallery/best-of');revalidatePath('/gallery/presentation');revalidatePath('/gallery/best-of/print/[id]','page');
  return json({review});
}catch(e){return failure(e);}}
