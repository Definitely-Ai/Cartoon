-- Rollback-only recovery checks. Run before connecting workers.
begin;
set local statement_timeout='10s';
set local lock_timeout='1s';
set local role service_role;
lock table public.automation_schedules,public.automation_jobs,public.automation_workers in share row exclusive mode nowait;
do $probe$
declare sid uuid:=gen_random_uuid(); wid uuid:=gen_random_uuid(); token text:=repeat('b',64);
  cursor_time timestamptz:=now()-interval '2 days'; due_time timestamptz:=now()-interval '1 day'; future_time timestamptz:=now()+interval '1 day'; result jsonb;
begin
  if exists(select 1 from public.automation_jobs where status in ('queued','running')) then raise exception 'Real pending work exists; probe refused'; end if;
  insert into public.automation_workers(id,name,token_hash)values(wid,'ROLLBACK recurrence probe',token);
  insert into public.automation_schedules(id,request_id,input,input_hash,validated_at,cursor_at)
    values(sid,gen_random_uuid(),'{"quantity":1}',token,cursor_time,cursor_time);
  if not public.automation_materialize_schedule(sid,cursor_time,future_time,jsonb_build_array(due_time,future_time))then raise exception 'First materialization failed'; end if;
  if public.automation_materialize_schedule(sid,cursor_time,future_time,jsonb_build_array(due_time,future_time))then raise exception 'Stale cursor was accepted'; end if;
  if(select count(*) from public.automation_jobs where schedule_id=sid)<>2 then raise exception 'Occurrence duplication'; end if;
  if exists(select 1 from public.automation_jobs where schedule_id=sid and input_validated_at<>cursor_time)then raise exception 'Original validation clock was lost'; end if;
  perform public.automation_set_schedule_status(sid,'paused');
  if public.automation_claim_job(wid,token) is not null then raise exception 'Paused work was claimed'; end if;
  if public.automation_materialize_schedule(sid,future_time,future_time+interval '1 day','[]')then raise exception 'Paused cursor advanced'; end if;
  perform public.automation_set_schedule_status(sid,'active');
  result:=public.automation_claim_job(wid,token);
  if result->>'schedule_id' is distinct from sid::text or (result->>'due_at')::timestamptz<>due_time then raise exception 'Resume skipped the overdue occurrence'; end if;
  perform public.automation_set_schedule_status(sid,'paused');
  if(public.automation_claim_job(wid,token))->>'lease_token' is distinct from result->>'lease_token' then raise exception 'Pause disturbed a live lease'; end if;
  raise notice 'PASS: atomic occurrence creation, stale cursor rejection, uniqueness, original clock, pause and overdue resume; rolled back.';
end;
$probe$;
rollback;
