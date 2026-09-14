-- Manual, approval-gated setup for the private edition-planning API.
-- This file is not a deployed migration and does not configure a worker/schedule.
-- Apply to the restored project only after reviewing permissions. No user-facing
-- role has table access; the authenticated website server uses service_role.
begin;

create table if not exists public.automation_edition_plans (
  id text primary key check (id ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'planned' check (status in ('planned', 'archived')),
  input jsonb not null check (jsonb_typeof(input) = 'object' and octet_length(input::text) <= 12288),
  constraint automation_edition_plans_time_order check (updated_at >= created_at)
);

create index if not exists automation_edition_plans_newest_idx
  on public.automation_edition_plans (created_at desc, id desc);

alter table public.automation_edition_plans enable row level security;
alter table public.automation_edition_plans force row level security;
revoke all on table public.automation_edition_plans from public, anon, authenticated, service_role;
grant select, insert, update on table public.automation_edition_plans to service_role;

comment on table public.automation_edition_plans is
  'Private saved edition plans only. Planned is not active: no worker, schedule, publication, or owner approval is implied.';

-- Refresh metadata so the primary-key ignore-duplicates upsert is recognized.
notify pgrst, 'reload schema';
commit;

-- Verification after an approved apply (read-only):
-- select relrowsecurity, relforcerowsecurity from pg_class
-- where oid = 'public.automation_edition_plans'::regclass;
-- select grantee, privilege_type from information_schema.role_table_grants
-- where table_schema = 'public' and table_name = 'automation_edition_plans';
-- Expected API grants: service_role SELECT/INSERT/UPDATE only; no anon/authenticated.
