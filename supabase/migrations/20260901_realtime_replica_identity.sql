-- attendee_packages was missing from the publication — a listener subscribing to
-- a table not in the publication can cause the entire Supabase Realtime channel
-- to be silently dropped, breaking all updates on the moderator board.
do $$ begin
  alter publication supabase_realtime add table public.attendee_packages;
exception when duplicate_object then null;
end $$;

-- REPLICA IDENTITY FULL is required so Supabase Realtime broadcasts UPDATE and
-- DELETE events (not just INSERT). Without this the moderator board only sees
-- new rows, not status changes (assigned→done, kiosk busy→free, etc).
alter table public.check_ins replica identity full;
alter table public.kiosks replica identity full;
alter table public.deliveries replica identity full;
alter table public.attendee_packages replica identity full;
