import { createHash,timingSafeEqual } from "node:crypto";
import { materializeDueSchedules } from "@/lib/automation-schedules-server";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export const maxDuration=60;
export async function GET(request:Request) {
  const secret=process.env.CRON_SECRET?.trim();
  const provided=request.headers.get("authorization")||"";
  const hash=(text:string)=>createHash("sha256").update(text).digest();
  if(!secret||secret.length<32||!timingSafeEqual(hash(provided),hash(`Bearer ${secret}`)))return Response.json({error:"Unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
  try {const result=await materializeDueSchedules();return Response.json(result,{status:result.failed?503:200,headers:{"Cache-Control":"no-store"}});}
  catch{return Response.json({error:"Schedule materialization needs retry."},{status:503,headers:{"Cache-Control":"no-store"}});}
}
