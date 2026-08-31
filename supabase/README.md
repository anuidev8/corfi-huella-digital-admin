# Huella Supabase on Railway

## Deployed project

- Railway project: **huella-supabase**
- Kong (API): https://kong-production-9634.up.railway.app
- Studio: https://studio-production-717a.up.railway.app

## Finish setup (required)

1. Open Studio and wait until it loads.
2. SQL editor → paste and run `supabase/schema.sql` (creates tables + seed).
3. Copy keys from Init-JWT logs (or Railway vars) into local env:

### `huella-moderator/.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://kong-production-9634.up.railway.app
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
```

### `huella-digital/.env.local` (Realtime on kiosk)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://kong-production-9634.up.railway.app
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
```

4. Restart both Next apps.

## Behavior

| Env | Backend |
|-----|---------|
| Supabase URL + key set | Postgres + Realtime |
| Missing | In-memory (local demo) |

- Corfilink webhook still hits moderator `/api/webhooks/corfilink` (writes `check_ins`).
- Assign updates `kiosks` → kiosk Realtime subscription starts session (~sub-second).
- Heartbeat still goes through moderator API → updates `kiosks.last_heartbeat_at`.

## Tables

- `attendee_packages` — preloaded profiles
- `check_ins` — queue
- `kiosks` — devices
- `deliveries` — assign log
