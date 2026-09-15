import {cookies} from 'next/headers';
import {revalidatePath} from 'next/cache';
import {BACKROOM_COOKIE,isDoorOpen} from '@/lib/backroom-auth';
import {AutomationError} from '@/lib/automation-studio-core';
import {exactKeys,readQueueJson,sameOrigin} from '@/lib/automation-queue-core';
import {hiddenCartoonIds,setCartoonHidden} from '@/lib/gallery-visibility-server';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store',Vary:'Cookie','X-Content-Type-Options':'nosniff'}});
export async function GET(request:Request){try{
  if(!await isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value))return json({error:'Sign in to manage the gallery.'},401);
  sameOrigin(request,false);return json({hiddenIds:await hiddenCartoonIds()});
}catch(error){return json({error:'Gallery settings are temporarily unavailable.'},error instanceof AutomationError?error.status:503);}}
export async function POST(request:Request){try{
  if(!await isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value))return json({error:'Sign in to manage the gallery.'},401);
  sameOrigin(request);const body=exactKeys(await readQueueJson(request),['id','hidden'],'Gallery change');
  const result=await setCartoonHidden(body.id,body.hidden);
  revalidatePath('/gallery/best-of');revalidatePath('/gallery/presentation');revalidatePath('/gallery/best-of/print/[id]','page');
  return json(result);
}catch(error){return json({error:error instanceof AutomationError?error.message:'The gallery change is not confirmed. Retry the same action safely.'},error instanceof AutomationError?error.status:503);}}
