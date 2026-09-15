-- Private, immutable assembly checkpoints. Does not alter jobs or publish art.
create table if not exists public.cartoon_build_frames (
  job_id uuid not null references public.automation_jobs(id),
  attempt integer not null check (attempt > 0),
  cartoon_index integer not null check (cartoon_index between 1 and 12),
  stage text not null check (stage in ('cast','story','tv','chalk','lettering')),
  frame jsonb not null check (jsonb_typeof(frame)='object' and octet_length(frame::text)<=8192),
  created_at timestamptz not null default now(),
  primary key (job_id,attempt,cartoon_index,stage)
);
alter table public.cartoon_build_frames enable row level security;
alter table public.cartoon_build_frames force row level security;
revoke all on public.cartoon_build_frames from public,anon,authenticated;
grant select,insert on public.cartoon_build_frames to service_role;

create or replace function public.save_cartoon_build_frame(
  p_worker_id uuid,p_token_hash text,p_job_id uuid,p_lease_token uuid,p_frame jsonb
) returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$
declare v_job public.automation_jobs%rowtype; v_saved public.cartoon_build_frames%rowtype; v_index integer; v_stage text;
begin
  -- Match the queue's worker-then-job locking order. No storage I/O in this RPC.
  perform 1 from public.automation_workers where id=p_worker_id and token_hash=p_token_hash and enabled for update;
  if not found then raise exception 'Worker authentication failed' using errcode='28000'; end if;
  select * into v_job from public.automation_jobs where id=p_job_id and owner_key='backroom-owner' for update;
  if not found or v_job.status<>'running' or v_job.worker_id is distinct from p_worker_id or v_job.lease_token is distinct from p_lease_token or v_job.lease_expires_at<=now() then
    raise exception 'Lease is no longer current' using errcode='40001';
  end if;
  v_index=(p_frame->>'index')::integer; v_stage=p_frame->>'stage';
  if v_index is null or v_index<1 or v_index>(v_job.input->>'quantity')::integer or
    v_stage is null or v_stage not in ('cast','story','tv','chalk','lettering') or
    (p_frame#>>'{artifact,path}') is distinct from (p_job_id::text||'/'||v_job.attempt::text||'/'||(p_frame#>>'{artifact,name}')) then
    raise exception 'Invalid build frame' using errcode='22023';
  end if;
  insert into public.cartoon_build_frames(job_id,attempt,cartoon_index,stage,frame)
    values(p_job_id,v_job.attempt,v_index,v_stage,p_frame) on conflict do nothing;
  select * into v_saved from public.cartoon_build_frames where job_id=p_job_id and attempt=v_job.attempt and cartoon_index=v_index and stage=v_stage;
  if v_saved.frame is distinct from p_frame then raise exception 'Saved frame cannot change' using errcode='40001'; end if;
  return to_jsonb(v_saved);
end; $$;
revoke all on function public.save_cartoon_build_frame(uuid,text,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_cartoon_build_frame(uuid,text,uuid,uuid,jsonb) to service_role;
notify pgrst,'reload schema';
