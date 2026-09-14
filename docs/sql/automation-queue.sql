-- Durable private draft queue. Execute against the intended restored Supabase
-- project, then verify permissions/RPC behavior. No publishing or recurring cron.
begin;

create table if not exists public.automation_workers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 80),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);
create table if not exists public.automation_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_key text not null default 'backroom-owner' check (owner_key = 'backroom-owner'),
  request_id uuid not null unique,
  input_hash text not null check (input_hash ~ '^[a-f0-9]{64}$'),
  input jsonb not null check (jsonb_typeof(input) = 'object' and octet_length(input::text) <= 12288),
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  due_at timestamptz not null,
  available_at timestamptz not null,
  attempt integer not null default 0 check (attempt >= 0),
  worker_id uuid references public.automation_workers(id),
  lease_token uuid,
  lease_expires_at timestamptz,
  progress jsonb not null default '{"stage":"Waiting for worker","completed":0,"total":0}'::jsonb
    check (jsonb_typeof(progress) = 'object' and octet_length(progress::text) <= 1024),
  last_error text check (length(last_error) <= 600),
  artifacts jsonb not null default '[]'::jsonb
    check (jsonb_typeof(artifacts) = 'array' and jsonb_array_length(artifacts) <= 24 and octet_length(artifacts::text) <= 24576),
  finished_at timestamptz,
  constraint automation_jobs_live_lease check (status <> 'running' or (worker_id is not null and lease_token is not null and lease_expires_at is not null))
);
create index if not exists automation_jobs_ready_idx on public.automation_jobs (available_at, due_at, created_at) where status in ('queued', 'running');
create index if not exists automation_jobs_worker_idx on public.automation_jobs (worker_id, lease_expires_at) where status = 'running';
create index if not exists automation_jobs_owner_newest_idx on public.automation_jobs (owner_key, created_at desc, id desc);
alter table public.automation_workers enable row level security;
alter table public.automation_workers force row level security;
alter table public.automation_jobs enable row level security;
alter table public.automation_jobs force row level security;
revoke all on table public.automation_workers, public.automation_jobs from public, anon, authenticated, service_role;
grant select, insert, update on table public.automation_workers, public.automation_jobs to service_role;

create or replace function public.automation_claim_job(p_worker_id uuid, p_token_hash text)
returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare v_job public.automation_jobs%rowtype;
begin
  -- Serialize all actions for a worker, including concurrent claim requests.
  perform 1 from public.automation_workers w where w.id = p_worker_id and w.token_hash = p_token_hash and w.enabled for update;
  if not found then raise exception 'Worker authentication failed' using errcode = '28000'; end if;
  update public.automation_workers set last_seen_at = now() where id = p_worker_id;
  select j.* into v_job from public.automation_jobs j
    where j.worker_id = p_worker_id and j.status = 'running' and j.lease_expires_at > now()
    order by j.created_at, j.id limit 1 for update;
  if found then return to_jsonb(v_job); end if;
  select j.* into v_job from public.automation_jobs j
    where j.owner_key = 'backroom-owner' and j.due_at <= now() and j.available_at <= now()
      and (j.status = 'queued' or (j.status = 'running' and j.lease_expires_at <= now()))
    order by j.available_at, j.created_at, j.id limit 1 for update skip locked;
  if not found then return null; end if;
  update public.automation_jobs set status = 'running', worker_id = p_worker_id,
    lease_token = gen_random_uuid(), lease_expires_at = now() + interval '180 seconds',
    attempt = attempt + 1, updated_at = now(), finished_at = null,
    progress = jsonb_build_object('stage', case when attempt = 0 then 'Starting worker' else 'Resuming after interruption' end, 'completed', 0, 'total', 0)
    where id = v_job.id returning * into v_job;
  return to_jsonb(v_job);
end;
$$;

create or replace function public.automation_update_job(
  p_worker_id uuid, p_token_hash text, p_job_id uuid, p_lease_token uuid,
  p_action text, p_progress jsonb default null, p_artifacts jsonb default null,
  p_error text default null, p_retryable boolean default true
) returns jsonb language plpgsql security invoker set search_path = pg_catalog as $$
declare v_job public.automation_jobs%rowtype;
begin
  perform 1 from public.automation_workers w where w.id = p_worker_id and w.token_hash = p_token_hash and w.enabled for update;
  if not found then raise exception 'Worker authentication failed' using errcode = '28000'; end if;
  select j.* into v_job from public.automation_jobs j where j.id = p_job_id and j.owner_key = 'backroom-owner' for update;
  if not found or v_job.worker_id is distinct from p_worker_id or v_job.lease_token is distinct from p_lease_token then
    raise exception 'Lease is no longer current' using errcode = '40001';
  end if;
  -- A lost HTTP completion response can be retried with the identical manifest.
  if p_action = 'complete' and v_job.status = 'succeeded' and v_job.artifacts = p_artifacts then return to_jsonb(v_job); end if;
  if v_job.status <> 'running' or v_job.lease_expires_at <= now() then
    raise exception 'Lease is no longer current' using errcode = '40001';
  end if;
  update public.automation_workers set last_seen_at = now() where id = p_worker_id;
  if p_action = 'heartbeat' then
    update public.automation_jobs set lease_expires_at = now() + interval '180 seconds',
      updated_at = now(), progress = coalesce(p_progress, progress) where id = p_job_id returning * into v_job;
  elsif p_action = 'complete' then
    if p_artifacts is null or jsonb_typeof(p_artifacts) <> 'array' or jsonb_array_length(p_artifacts) < 1 then
      raise exception 'Artifacts required' using errcode = '22023';
    end if;
    update public.automation_jobs set status = 'succeeded', artifacts = p_artifacts,
      updated_at = now(), finished_at = now(), lease_expires_at = null, last_error = null,
      progress = jsonb_build_object('stage', 'Drafts ready for review', 'completed', (input->>'quantity')::integer, 'total', (input->>'quantity')::integer)
      where id = p_job_id returning * into v_job;
  elsif p_action = 'fail' then
    if p_error is null or length(p_error) not between 1 and 600 then raise exception 'Error required' using errcode = '22023'; end if;
    update public.automation_jobs set status = case when p_retryable then 'queued' else 'failed' end,
      available_at = case when p_retryable then now() + make_interval(secs => least(1800, 15 * power(2, least(attempt, 7)))::integer) else available_at end,
      updated_at = now(), finished_at = case when p_retryable then null else now() end,
      lease_expires_at = null, last_error = p_error,
      progress = jsonb_build_object('stage', case when p_retryable then 'Waiting to retry' else 'Needs attention' end, 'completed', 0, 'total', 0)
      where id = p_job_id returning * into v_job;
  else raise exception 'Unknown action' using errcode = '22023';
  end if;
  return to_jsonb(v_job);
end;
$$;
revoke all on function public.automation_claim_job(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.automation_update_job(uuid, text, uuid, uuid, text, jsonb, jsonb, text, boolean) from public, anon, authenticated, service_role;
grant execute on function public.automation_claim_job(uuid, text) to service_role;
grant execute on function public.automation_update_job(uuid, text, uuid, uuid, text, jsonb, jsonb, text, boolean) to service_role;

-- Private bucket: no public/authenticated object policies. Worker capabilities are
-- path-scoped signed uploads without upsert; website owner receives short downloads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('automation-drafts', 'automation-drafts', false, 8388608, array['image/png','application/json','text/plain'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
comment on table public.automation_jobs is 'Durable one-occurrence private cartoon draft jobs. No automatic publication. No automatic expiry of pending jobs.';
notify pgrst, 'reload schema';
commit;

-- Register from a trusted operator session; store ONLY SHA256(random 32-byte
-- base64url bearer token). The plaintext token belongs in the worker config.
-- insert into public.automation_workers(name, token_hash)
-- values ('Studio PC', '<64 lowercase hexadecimal SHA256 characters>') returning id;
-- Revoke: update public.automation_workers set enabled = false where id = '<UUID>';
-- Rotate: replace token_hash with the new hash; every RPC rechecks the current hash.
