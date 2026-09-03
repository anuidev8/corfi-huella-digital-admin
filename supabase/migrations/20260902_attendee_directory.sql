-- Read-only search cache of the FULL registered roster, backfilled from the
-- external Attendees API (GET /attendees/{id}, no bulk-list endpoint exists —
-- see scripts/sync-attendee-directory.mjs). Separate from attendee_packages
-- on purpose: attendee_packages is live, reactive session state written by
-- the webhook/moderator per check-in (package_status, journey_completed_at),
-- while this table exists only so the kiosk's manual-search screen has
-- someone to find *before* they've tapped a wristband.
create table if not exists public.attendee_directory (
  attendee_id text primary key,
  full_name text not null,
  first_name text not null default '',
  last_name text not null default '',
  company text not null default '',
  sector text not null default '',
  email text not null default '',
  synced_at timestamptz not null default now()
);

create index if not exists attendee_directory_name_idx
  on public.attendee_directory (full_name);

alter table public.attendee_directory enable row level security;

create policy "attendee_directory_all" on public.attendee_directory
  for all using (true) with check (true);
