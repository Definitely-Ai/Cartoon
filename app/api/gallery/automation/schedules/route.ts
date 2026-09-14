import { cookies } from "next/headers";
import { BACKROOM_COOKIE,isDoorOpen } from "@/lib/backroom-auth";
import { AutomationError } from "@/lib/automation-studio-core";
import { createCommand,exactKeys,readQueueJson,sameOrigin,uuid } from "@/lib/automation-queue-core";
import { createSchedule,listSchedules,setScheduleStatus } from "@/lib/automation-schedules-server";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export const maxDuration=60;
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"private, no-store",Vary:"Cookie","X-Content-Type-Options":"nosniff"}});
async function handle(request:Request) {
  try {
    if(!await isDoorOpen((await cookies()).get(BACKROOM_COOKIE)?.value))return json({error:"Sign in to manage schedules."},401);
    sameOrigin(request,request.method!=="GET");
    if(request.method==="GET")return json({schedules:await listSchedules()});
    const value=await readQueueJson(request);
    if(request.method==="POST") {const command=createCommand(value);return json({schedule:await createSchedule(command.requestId,command.input)});}
    const command=exactKeys(value,["id","status"],"Schedule status");
    if(command.status!=="active"&&command.status!=="paused")throw new AutomationError(400,"Choose active or paused.");
    return json({schedule:await setScheduleStatus(uuid(command.id),command.status)});
  } catch(error) {return json({error:error instanceof AutomationError?error.message:"Schedule operation was not confirmed."},error instanceof AutomationError?error.status:503);}
}
export const GET=handle;
export const POST=handle;
export const PATCH=handle;
