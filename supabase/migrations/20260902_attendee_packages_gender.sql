-- Attendee gender, sourced from the external Attendees API and normalized
-- by huella-moderator (see src/lib/gender.ts) before it's stored here.

alter table public.attendee_packages
  add column if not exists gender text null
    check (gender is null or gender in ('hombre', 'mujer'));
