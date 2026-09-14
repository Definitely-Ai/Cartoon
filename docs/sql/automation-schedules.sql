-- Additive recurring production. Existing running work is never cancelled.
begin;
create table if not exists public.automation_schedules (
  id uuid primary key default gen_random_uuid(), request_id uuid not null unique,
  input jsonb not null check(jsonb_typeof(input)='object' and octet_length(input::text)<=12288),
  input_hash text not null check(input_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'active' check(status in ('active','paused')),
  validated_at timestamptz not null, cursor_at timestamptz not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists automation_schedules_cursor_idx on public.automation_schedules(cursor_at) where status='active';
alter table public.automation_schedules enable row level security;
alter table public.automation_schedules force row level security;
revoke all on public.automation_schedules from public,anon,authenticated,service_role;
grant select,insert,update on public.automation_schedules to service_role;
alter table public.automation_jobs add column if not exists input_validated_at timestamptz;
update public.automation_jobs set input_validated_at=created_at where input_validated_at is null;
alter table public.automation_jobs alter column input_validated_at set not null;
alter table public.automation_jobs alter column input_validated_at set default now();
alter table public.automation_jobs add column if not exists schedule_id uuid references public.automation_schedules(id);
alter table public.automation_jobs add column if not exists occurrence_at timestamptz;
create unique index if not exists automation_jobs_occurrence_idx on public.automation_jobs(schedule_id,occurrence_at) where schedule_id is not null;

create or replace function public.automation_materialize_schedule(p_id uuid,p_expected timestamptz,p_next timestamptz,p_dates jsonb)
returns boolean language plpgsql security invoker set search_path=pg_catalog as $$
declare s public.automation_schedules%rowtype; d text; at_time timestamptz;
begin
  select * into s from public.automation_schedules where id=p_id for update;
  if not found or s.status<>'active' or s.cursor_at<>p_expected then return false; end if;
  if p_expected is null or p_next is null or p_dates is null or p_next<=p_expected or p_next>now()+interval '8 days' or jsonb_typeof(p_dates)<>'array' or jsonb_array_length(p_dates)>52 then
    raise exception 'Invalid schedule batch' using errcode='22023';
  end if;
  for d in select jsonb_array_elements_text(p_dates) loop
    at_time:=d::timestamptz;
    if at_time is null or at_time<=p_expected or at_time>p_next then raise exception 'Occurrence outside cursor range' using errcode='22023'; end if;
    insert into public.automation_jobs(request_id,input_hash,input,input_validated_at,schedule_id,occurrence_at,due_at,available_at)
    values(gen_random_uuid(),s.input_hash,s.input,s.validated_at,s.id,at_time,at_time,at_time)
    on conflict(schedule_id,occurrence_at) where schedule_id is not null do nothing;
  end loop;
  update public.automation_schedules set cursor_at=p_next,updated_at=now() where id=s.id;
  return true;
end; $$;
revoke all on function public.automation_materialize_schedule(uuid,timestamptz,timestamptz,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.automation_materialize_schedule(uuid,timestamptz,timestamptz,jsonb) to service_role;
create or replace function public.automation_set_schedule_status(p_id uuid,p_status text)
returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$
declare s public.automation_schedules%rowtype;
begin
  if p_status is null or p_status not in ('active','paused') then raise exception 'Invalid status' using errcode='22023'; end if;
  update public.automation_schedules set status=p_status,updated_at=now() where id=p_id returning * into s;
  if not found then return null; end if;
  return to_jsonb(s);
end; $$;
revoke all on function public.automation_set_schedule_status(uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.automation_set_schedule_status(uuid,text) to service_role;

-- Preserve live lease identity. A pause prevents new claims only.
create or replace function public.automation_claim_job(p_worker_id uuid,p_token_hash text)
returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$
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
    progress=jsonb_build_object('stage',case when attempt=0 then 'Starting worker' else 'Resuming after interruption' end,'completed',0,'total',0)
    where id=v_job.id returning * into v_job;
  return to_jsonb(v_job);
end; $$;
revoke all on function public.automation_claim_job(uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.automation_claim_job(uuid,text) to service_role;
notify pgrst,'reload schema';
commit;
