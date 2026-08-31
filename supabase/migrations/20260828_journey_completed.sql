-- Mark attendees who finished the kiosk journey (admin + returning visitor UX).

alter table public.attendee_packages
  add column if not exists journey_completed_at timestamptz null;

alter table public.check_ins
  add column if not exists completed_at timestamptz null;
