-- Recoverable gallery removal. Original artwork is never deleted.
create table if not exists public.gallery_visibility (
  cartoon_id text primary key check (cartoon_id ~ '^[a-z0-9][a-z0-9-]{0,119}$'),
  hidden boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.gallery_visibility enable row level security;
alter table public.gallery_visibility force row level security;
revoke all on public.gallery_visibility from public,anon,authenticated,service_role;
grant select,insert,update on public.gallery_visibility to service_role;
comment on table public.gallery_visibility is 'Owner-controlled reversible gallery exclusions. Does not delete or privatize existing artwork URLs.';
notify pgrst, 'reload schema';
