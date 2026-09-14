import "server-only";
import { createHash } from "node:crypto";
import { AutomationError, validateEditionInput } from "./automation-studio-core";
import { uuid } from "./automation-queue-core";
import { queueDatabaseConfig, queueDatabaseData, queueDatabaseRequest } from "./automation-queue-server";
import { scheduleBatch, type EditionSchedule } from "./automation-schedules-core";
const digest=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
const unavailable=()=>new AutomationError(503,"Schedules are temporarily unavailable. Retry with the same saved request.");
function schedule(raw: unknown): EditionSchedule {
  try {
    const row=raw as Record<string,unknown>;
    for (const key of ["created_at","updated_at","validated_at","cursor_at"]) if(typeof row[key]!=="string" || !Number.isFinite(Date.parse(row[key] as string))) throw Error("Invalid date");
    const input=validateEditionInput(row.input,new Date(row.validated_at as string));
    if(!["daily","weekly"].includes(input.timing.mode) || !["active","paused"].includes(row.status as string) || digest(input)!==row.input_hash) throw Error("Invalid schedule");
    return {id:uuid(row.id),requestId:uuid(row.request_id),input,status:row.status as "active"|"paused",createdAt:row.created_at as string,
      updatedAt:row.updated_at as string,validatedAt:row.validated_at as string,cursorAt:row.cursor_at as string};
  } catch { throw unavailable(); }
}
async function read(query: Record<string,string>={}) {
  const rows=await queueDatabaseData(queueDatabaseConfig(),`/rest/v1/automation_schedules?${new URLSearchParams({select:"*",limit:"50",order:"created_at.desc",...query})}`);
  if(!Array.isArray(rows)||rows.length>50) throw unavailable();
  return rows.map(schedule);
}
export const listSchedules=()=>read();
async function materialize(item:EditionSchedule,now:Date) {
  const batch=scheduleBatch(item,now);
  if(batch.nextCursor===item.cursorAt)return;
  await queueDatabaseData(queueDatabaseConfig(),"/rest/v1/rpc/automation_materialize_schedule",{
    p_id:item.id,p_expected:item.cursorAt,p_next:batch.nextCursor,p_dates:batch.dates,
  });
}
export async function materializeDueSchedules() {
  const now=new Date();
  const rows=await read({status:"eq.active",cursor_at:`lt.${new Date(now.getTime()+6*86400000).toISOString()}`,order:"cursor_at.asc",limit:"20"});
  let failed=0;
  for(const item of rows)try{await materialize(item,now);}catch{failed++;}
  return {processed:rows.length,failed,at:now.toISOString()};
}
export async function createSchedule(requestId:string,rawInput:unknown) {
  uuid(requestId);
  const existing=await read({request_id:`eq.${requestId}`,limit:"1"});
  const now=new Date();
  const input=validateEditionInput(rawInput,new Date(existing[0]?.validatedAt ?? now));
  if(!["daily","weekly"].includes(input.timing.mode))throw new AutomationError(400,"Use daily or weekly for a recurring schedule.");
  if(existing[0]&&digest(existing[0].input)!==digest(input))throw new AutomationError(409,"This request ID belongs to a different schedule.");
  if(!existing.length)await queueDatabaseRequest(queueDatabaseConfig(),"/rest/v1/automation_schedules?on_conflict=request_id",{
    request_id:requestId,input,input_hash:digest(input),validated_at:now.toISOString(),cursor_at:new Date(now.getTime()-1).toISOString(),status:"active",
  },"resolution=ignore-duplicates,return=minimal");
  const stored=(await read({request_id:`eq.${requestId}`,limit:"1"}))[0];
  if(!stored)throw unavailable();
  if(digest(stored.input)!==digest(input))throw new AutomationError(409,"This request ID belongs to a different schedule.");
  await materialize(stored,now);
  return (await read({id:`eq.${stored.id}`,limit:"1"}))[0];
}
export async function setScheduleStatus(id:string,status:"active"|"paused") {
  uuid(id);
  if(!["active","paused"].includes(status))throw new AutomationError(400,"Choose active or paused.");
  const result=await queueDatabaseData(queueDatabaseConfig(),"/rest/v1/rpc/automation_set_schedule_status",{p_id:id,p_status:status});
  if(!result)throw new AutomationError(404,"Schedule not found.");
  const stored=schedule(result);
  if(status==="active")await materialize(stored,new Date());
  return (await read({id:`eq.${id}`,limit:"1"}))[0];
}
