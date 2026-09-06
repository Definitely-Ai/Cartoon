create table public.studio_notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author text not null check (author in ('Rick','Zechariah')),
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  topic text not null default 'general' check (topic in ('general','room','Drew','Barclay','Abby','newspaper')),
  image_id text check (image_id is null or image_id ~ '^[a-f0-9]{64}$')
);
create index studio_notes_created_at_idx on public.studio_notes (created_at desc);
create index studio_notes_image_created_at_idx on public.studio_notes (image_id, created_at desc) where image_id is not null;
alter table public.studio_notes enable row level security;
alter table public.studio_notes force row level security;
revoke all on table public.studio_notes from public, anon, authenticated, service_role;
grant select, insert on table public.studio_notes to service_role;
comment on table public.studio_notes is 'Private studio discussion, accessible only through the authenticated server. Author is selected under the shared studio login.';
notify pgrst, 'reload schema';
