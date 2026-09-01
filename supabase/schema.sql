-- Huella Digital control plane (queue, kiosks, packages)
-- Run in Supabase SQL editor / Studio after Railway deploy.

create extension if not exists "pgcrypto";

-- Preloaded attendee packages (before event)
create table if not exists public.attendee_packages (
  user_id text primary key,
  first_name text not null,
  last_name text not null default '',
  role text not null default '—',
  company text not null default '—',
  sector text not null default '—',
  email text not null default '',
  overall_score integer not null default 0,
  headline text not null default '',
  package_status text not null default 'ready'
    check (package_status in ('ready', 'missing')),
  journey_completed_at timestamptz null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Corfilink check-ins → moderator queue
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.attendee_packages (user_id) on delete restrict,
  nombre text not null,
  cargo text not null default '—',
  company text not null default '—',
  email text not null default '',
  event_id text not null default 'corfi-2026',
  status text not null default 'pending'
    check (status in ('pending', 'assigned', 'in_session', 'done', 'cancelled')),
  package_status text not null default 'missing'
    check (package_status in ('ready', 'missing')),
  kiosk_id text null,
  checked_in_at timestamptz not null default now(),
  assigned_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists check_ins_status_idx on public.check_ins (status, checked_in_at desc);
create index if not exists check_ins_user_active_idx on public.check_ins (user_id, status);

-- Physical kiosks / devices
create table if not exists public.kiosks (
  id text primary key,
  label text not null,
  busy text not null default 'free' check (busy in ('free', 'busy')),
  current_user_id text null,
  current_nombre text null,
  screen text null,
  last_heartbeat_at timestamptz null,
  last_delivery_at timestamptz null,
  agent_id text null,
  created_at timestamptz not null default now()
);

-- Assignment / delivery audit
create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  user_id text not null,
  nombre text not null,
  kiosk_id text not null,
  kiosk_label text not null
);

create index if not exists deliveries_at_idx on public.deliveries (at desc);

-- Realtime: allow clients to receive postgres changes (event floor apps)
do $$
begin
  alter publication supabase_realtime add table public.check_ins;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.kiosks;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.deliveries;
exception when duplicate_object then null;
end $$;

-- Open RLS for event demo (tighten later with service role / auth)
alter table public.attendee_packages enable row level security;
alter table public.check_ins enable row level security;
alter table public.kiosks enable row level security;
alter table public.deliveries enable row level security;

create policy "attendee_packages_all" on public.attendee_packages
  for all using (true) with check (true);
create policy "check_ins_all" on public.check_ins
  for all using (true) with check (true);
create policy "kiosks_all" on public.kiosks
  for all using (true) with check (true);
create policy "deliveries_all" on public.deliveries
  for all using (true) with check (true);

-- Attendee packages: run "Sync roster + queue" in moderator (data/roster/*.json).

insert into public.kiosks (id, label, busy, screen, last_heartbeat_at)
values
  ('kiosk-01', 'Kiosk 01', 'free', 'attract', now()),
  ('kiosk-02', 'Kiosk 02', 'free', 'attract', now()),
  ('kiosk-03', 'Kiosk 03', 'free', null, null)
on conflict (id) do nothing;
