-- Ensure attendees.wristband_uid has a unique index for fast totem resolution.
-- The attendees table is owned by the analysis pipeline; this migration only
-- adds the index if it doesn't exist. Run after the analysis pipeline has
-- created the attendees table.

create unique index if not exists attendees_wristband_uid_idx
  on public.attendees (wristband_uid)
  where wristband_uid is not null;

create index if not exists attendees_full_name_idx
  on public.attendees (lower(full_name));
