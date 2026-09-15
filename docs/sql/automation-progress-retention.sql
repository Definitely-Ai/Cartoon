-- Apply after automation-queue.sql and automation-schedules.sql.
-- No requests are requeued or rewritten by this migration. Preserve confirmed
-- milestones on the NEXT interruption/claim, retaining all lease fences.
create or replace function public.automation_claim_job(p_worker_id uuid, p_token_hash text)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare v_job public.automation_jobs%rowtype;
begin
  perform 1 from public.automation_workers w where w.id=p_worker_id and w.token_hash=p_token_hash and w.enabled for update;
  if not found then raise exception 'Worker authentication failed' using errcode='28000'; end if;
  update public.automation_workers set last_seen_at=now() where id=p_worker_id;
  select j.* into v_job from public.automation_jobs j where j.worker_id=p_worker_id and j.status='running' and j.lease_expires_at>now()
    order by j.created_at,j.id limit 1 for update;
  if found then return to_jsonb(v_job); end if;
  select j.* into v_job from public.automation_jobs j
    where j.owner_key='backroom-owner' and j.due_at<=now() and j.available_at<=now()
      and (j.status='queued' or (j.status='running' and j.lease_expires_at<=now()))
      and (j.schedule_id is null or exists(select 1 from public.automation_schedules s where s.id=j.schedule_id and s.status='active'))
    order by j.available_at,j.created_at,j.id limit 1 for update skip locked;
  if not found then return null; end if;
  update public.automation_jobs set status='running',worker_id=p_worker_id,lease_token=gen_random_uuid(),lease_expires_at=now()+interval '180 seconds',
    attempt=attempt+1,updated_at=now(),finished_at=null,
    progress=jsonb_set(progress,'{stage}',to_jsonb(case when attempt=0 then 'Starting worker'::text else 'Resuming after interruption'::text end))
    where id=v_job.id returning * into v_job;
  return to_jsonb(v_job);
end; $$;

create or replace function public.automation_update_job(
  p_worker_id uuid, p_token_hash text, p_job_id uuid, p_lease_token uuid,
  p_action text, p_progress jsonb default null, p_artifacts jsonb default null,
  p_error text default null, p_retryable boolean default true
) returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare v_job public.automation_jobs%rowtype; v_progress jsonb;
begin
  perform 1 from public.automation_workers w where w.id=p_worker_id and w.token_hash=p_token_hash and w.enabled for update;
  if not found then raise exception 'Worker authentication failed' using errcode='28000'; end if;
  select j.* into v_job from public.automation_jobs j where j.id=p_job_id and j.owner_key='backroom-owner' for update;
  if not found or v_job.worker_id is distinct from p_worker_id or v_job.lease_token is distinct from p_lease_token then
    raise exception 'Lease is no longer current' using errcode='40001';
  end if;
  if p_action='complete' and v_job.status='succeeded' and v_job.artifacts=p_artifacts then return to_jsonb(v_job); end if;
  if v_job.status<>'running' or v_job.lease_expires_at<=now() then raise exception 'Lease is no longer current' using errcode='40001'; end if;
  update public.automation_workers set last_seen_at=now() where id=p_worker_id;
  if p_action='heartbeat' then
    v_progress=coalesce(p_progress,v_job.progress);
    -- Replaying saved steps after a restart must not empty the progress bar.
    -- Preserve the counter, while retaining the actual current stage (e.g. GPU wait).
    if (v_job.progress->>'total')::numeric>0 and
      coalesce((v_progress->>'completed')::numeric/nullif((v_progress->>'total')::numeric,0),0)
      < (v_job.progress->>'completed')::numeric/(v_job.progress->>'total')::numeric then
      v_progress=v_job.progress || jsonb_build_object('stage',v_progress->>'stage');
    end if;
    update public.automation_jobs set lease_expires_at=now()+interval '180 seconds',updated_at=now(),progress=v_progress where id=p_job_id returning * into v_job;
  elsif p_action='complete' then
    if p_artifacts is null or jsonb_typeof(p_artifacts)<>'array' or jsonb_array_length(p_artifacts)<1 then raise exception 'Artifacts required' using errcode='22023'; end if;
    update public.automation_jobs set status='succeeded',artifacts=p_artifacts,updated_at=now(),finished_at=now(),lease_expires_at=null,last_error=null,
      progress=jsonb_build_object('stage','Drafts ready for review','completed',(input->>'quantity')::integer,'total',(input->>'quantity')::integer)
      where id=p_job_id returning * into v_job;
  elsif p_action='fail' then
    if p_error is null or length(p_error) not between 1 and 600 then raise exception 'Error required' using errcode='22023'; end if;
    update public.automation_jobs set status=case when p_retryable then 'queued' else 'failed' end,
      available_at=case when p_retryable then now()+make_interval(secs=>least(1800,15*power(2,least(attempt,7)))::integer) else available_at end,
      updated_at=now(),finished_at=case when p_retryable then null else now() end,lease_expires_at=null,last_error=p_error,
      progress=jsonb_set(progress,'{stage}',to_jsonb(case when p_retryable then 'Waiting to retry'::text else 'Needs attention'::text end))
      where id=p_job_id returning * into v_job;
  else raise exception 'Unknown action' using errcode='22023'; end if;
  return to_jsonb(v_job);
end; $$;
revoke all on function public.automation_claim_job(uuid,text) from public,anon,authenticated;
revoke all on function public.automation_update_job(uuid,text,uuid,uuid,text,jsonb,jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.automation_claim_job(uuid,text) to service_role;
grant execute on function public.automation_update_job(uuid,text,uuid,uuid,text,jsonb,jsonb,text,boolean) to service_role;
notify pgrst, 'reload schema';
