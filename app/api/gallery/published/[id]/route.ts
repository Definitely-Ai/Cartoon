import {publishedCartoonImage} from '@/lib/cartoon-review-server';
import {AutomationError} from '@/lib/automation-studio-core';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const headers={'Cache-Control':'no-store, max-age=0','CDN-Cache-Control':'no-store','Vercel-CDN-Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{
  const bytes=await publishedCartoonImage((await params).id);
  return new Response(new Uint8Array(bytes),{headers:{...headers,'Content-Type':'image/png','Content-Length':String(bytes.length)}});
}catch(e){return Response.json({error:'This published cartoon is unavailable.'},{status:e instanceof AutomationError?e.status:503,headers});}}
