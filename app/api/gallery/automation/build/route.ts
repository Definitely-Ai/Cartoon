import {cookies} from 'next/headers';
import {BACKROOM_COOKIE,isDoorOpen} from '@/lib/backroom-auth';
import {AutomationError} from '@/lib/automation-studio-core';
import {sameOrigin} from '@/lib/automation-queue-core';
import {ownerBuildFrames,ownerBuildImage} from '@/lib/automation-queue-server';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(request:Request){
  const headers={'Cache-Control':'private, no-store','CDN-Cache-Control':'no-store','Vercel-CDN-Cache-Control':'no-store',Vary:'Cookie','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
  try{
    if(!await isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value))return Response.json({error:'Sign in to watch private production.'},{status:401,headers});
    sameOrigin(request,false);
    const query=new URL(request.url).searchParams;
    const keys=[...query.keys()];
    if(keys.length===1&&query.has('jobId'))return Response.json({frames:await ownerBuildFrames(query.get('jobId')!)},{headers});
    if(keys.length!==4||!['jobId','index','stage','sha256'].every(k=>query.has(k))||!/^([1-9]|1[0-2])$/.test(query.get('index')!)||!/^[a-f0-9]{64}$/.test(query.get('sha256')!))throw new AutomationError(400,'Choose a saved build checkpoint.');
    const bytes=await ownerBuildImage(query.get('jobId')!,Number(query.get('index')),query.get('stage')!,query.get('sha256')!);
    return new Response(new Uint8Array(bytes),{headers:{...headers,'Content-Type':'image/png','Content-Length':String(bytes.length)}});
  }catch(error){return Response.json({error:error instanceof AutomationError?error.message:'Build previews are reconnecting. The generation request remains saved.'},{status:error instanceof AutomationError?error.status:503,headers});}
}
