import { cookies } from 'next/headers';
import { BACKROOM_COOKIE, isDoorOpen } from '@/lib/backroom-auth';
import { AutomationError } from '@/lib/automation-studio-core';
import { exactKeys, readQueueJson, sameOrigin, uuid } from '@/lib/automation-queue-core';
import { retryJob } from '@/lib/automation-queue-server';

export const dynamic='force-dynamic';
export const runtime='nodejs';
export const maxDuration=60;
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store',Vary:'Cookie','X-Content-Type-Options':'nosniff'}});
export async function POST(request:Request){
  try{
    if(!await isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value))return json({error:'Sign in to retry an edition.'},401);
    sameOrigin(request);
    const command=exactKeys(await readQueueJson(request),['jobId'],'Retry');
    return json({job:await retryJob(uuid(command.jobId))});
  }catch(error){
    return json({error:error instanceof AutomationError?error.message:'The fresh pass is not yet confirmed. Retry the same request safely.'},error instanceof AutomationError?error.status:503);
  }
}
