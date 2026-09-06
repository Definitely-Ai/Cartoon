-- The sticker desk's decisions: what Rick and Zechariah arranged on the
-- website, waiting for the studio machine to act on it. Run this once in the
-- Supabase SQL editor for the project named by SUPABASE_URL. Until it exists
-- the desk page says so and nothing can be sent.
--
-- Same shape as docs/sql/studio-notes.sql: no anon access at all, service_role
-- only, reached exclusively through the authenticated server
-- (lib/studio-desk-server.ts). The site is behind one shared login, so the
-- author is a chosen name, not an account.
--
--   layout    { "<part>": { "dx": int, "dy": int, "visible": bool,
--                           "version": "v009" | null } }
--               dx/dy are plate pixels from where the sticker was cut — the
--               same meaning as canon/room-kit/v2/layout.json.
--   notes     { "<part>": "text", "_all": "the message to the studio" }
--   approvals { "<part>": { "state": "approved" | "needs-work" | "comment",
--                           "author": "Rick" | "Zechariah", "at": timestamp } }
--   status    'sent' when it leaves the website; the studio machine moves it
--             to 'received' and then 'applied'.

create table public.room_desk_decisions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author text not null check (author in ('Rick','Zechariah')),
  layout jsonb not null default '{}'::jsonb check (jsonb_typeof(layout) = 'object'),
  notes jsonb not null default '{}'::jsonb check (jsonb_typeof(notes) = 'object'),
  approvals jsonb not null default '{}'::jsonb check (jsonb_typeof(approvals) = 'object'),
  status text not null default 'sent' check (status in ('sent','received','applied'))
);
create index room_desk_decisions_created_at_idx on public.room_desk_decisions (created_at desc);
create index room_desk_decisions_status_idx on public.room_desk_decisions (status, created_at desc);
alter table public.room_desk_decisions enable row level security;
alter table public.room_desk_decisions force row level security;
revoke all on table public.room_desk_decisions from public, anon, authenticated, service_role;
grant select, insert, update on table public.room_desk_decisions to service_role;
comment on table public.room_desk_decisions is 'Sticker-desk decisions made on the website and polled by the local studio (scripts/desk-pull.py). Private: reachable only through the authenticated server.';
notify pgrst, 'reload schema';
