# Huella Moderator

Next.js ops board for the Corfi / Huella Digital event floor.

Flow:

1. Totem / Corfilink POSTs a check-in → person appears in the **queue**
2. Moderator assigns them to a free **kiosk**
3. Server records the delivery (ready package) for that device

Later: wire the assign action to push into `huella-digital` (WebSocket / LiveKit / device webhook). For now delivery is in-memory so you can validate the ops UX.

## Run

```bash
cd huella-moderator
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) (port **3001** so it does not clash with `huella-digital` on 3000).

## Demo

1. Click **Simulate Corfilink** — seeds queue entries as if bands were scanned.
2. Assign a waiting person to **Kiosk 01** or **Kiosk 02**.
3. Watch Devices + Delivery log update.
4. **Release** frees the device when the session ends.

## APIs

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/webhooks/corfilink` | Corfilink / totem check-in |
| `GET` | `/api/state` | Queue + kiosks + deliveries |
| `POST` | `/api/assign` | `{ queueId, kioskId }` → push package |
| `POST` | `/api/release` | `{ kioskId }` → free device |
| `POST` | `/api/kiosks/heartbeat` | Device presence `{ kioskId, screen?, userId? }` |
| `POST` | `/api/demo` | `{ action: "seed" \| "reset" }` |

### Example Corfilink webhook

```bash
curl -s -X POST http://localhost:3001/api/webhooks/corfilink \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "diego",
    "nombre": "Diego",
    "cargo": "Director de Planta",
    "company": "Mavalle"
  }'
```

Optional auth: set `CORFILINK_WEBHOOK_SECRET` and send header `x-webhook-secret`.

## Join with huella-digital (no DB)

Attendee `userId` must exist in Supabase `attendee_packages` (sync via **Sync roster + queue** from `data/roster/*.json`).

1. Start moderator: `npm run dev` → http://localhost:3001  
2. Start kiosk with:

```bash
# huella-digital/.env.local
NEXT_PUBLIC_MODERATOR_URL=http://localhost:3001
MODERATOR_URL=http://localhost:3001
NEXT_PUBLIC_KIOSK_ID=kiosk-01
NEXT_PUBLIC_MODERATOR_BRIDGE=1
```

3. Simulate Corfilink / curl webhook → **Assign → Kiosk 01**  
4. Kiosk on **attract** polls `/api/moderator/session`, receives `userId`, starts welcome with that attendee.

Kiosk session API: `GET /api/kiosks/:kioskId/session`

## Supabase (Railway)

See [`supabase/README.md`](./supabase/README.md). When `NEXT_PUBLIC_SUPABASE_URL` + keys are set, the moderator uses Postgres; the kiosk can subscribe via Realtime for faster assign.
