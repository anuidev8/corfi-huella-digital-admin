-- Allow the moderator to assign a named LiveKit agent to each kiosk.
-- The value matches the LIVEKIT_AGENT_NAME env var on the agent process
-- (e.g. "huella-guide"). NULL means no agent is configured for this kiosk.

alter table public.kiosks
  add column if not exists agent_id text null;
