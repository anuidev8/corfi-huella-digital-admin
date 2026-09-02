# Implementation Summary: Completion Status Handling

## Date: 2026-09-02

## Problem Solved

When users who had already completed the Huella Digital experience scanned their wristband again, the system needed to:
1. Allow the check-in (not block them)
2. Store the completion status from the API
3. Let the kiosk detect this and show a "Mission Accomplished" screen instead of the full experience

## Solution Implemented

### 1. **Webhook Behavior** ✅
- The webhook **ALWAYS allows check-ins**, regardless of completion status
- It stores the full API payload (including `status` field) in `attendee_packages.payload`
- No blocking logic - users can always check in

### 2. **Database Updates** ✅
- The `sbGetKioskSession` function now returns the `payload` field
- Kiosks receive the complete API payload when they fetch session data
- The payload includes `status: "completed"` or `"pending"`

### 3. **Kiosk Responsibility** ⚠️ (Not Yet Implemented)
- The kiosk must check `session.payload?.status === "completed"`
- If completed, show "Mission Accomplished" screen
- If pending, show normal experience
- See `docs/KIOSK-COMPLETION-FLOW.md` for implementation guide

## Files Changed

### Modified Files:
1. **`src/lib/supabaseStore.ts`**
   - Added `payload` field to `sbGetKioskSession` return type
   - Updated query to select `payload` from `attendee_packages`
   - Returns payload to kiosk for status checking

2. **`docs/webhook-openapi.yaml`**
   - Updated webhook flow documentation
   - Added step 7: "El kiosk es responsable de verificar payload.status"

3. **`src/app/api/webhooks/corfilink/route.ts`**
   - Fixed resolution order comments (cosmetic)

### New Files:
4. **`docs/COMPLETION-CHECK.md`**
   - Complete technical documentation
   - Data flow diagrams
   - Status field comparison table

5. **`docs/KIOSK-COMPLETION-FLOW.md`**
   - Kiosk implementation guide
   - Visual flow diagram
   - Pseudocode examples
   - Screen reference with screenshot

## Code Changes Detail

### `src/lib/supabaseStore.ts` (lines 637-706)

**Before:**
```typescript
export async function sbGetKioskSession(kioskId: string): Promise<{
  kioskId: string;
  userId: string;
  nombre: string;
  packageStatus: PackageStatus;
  assignedAt: string | null;
  deliveryId: string | null;
} | null> {
  // ...
  const pkgRes = await sb
    .from("attendee_packages")
    .select("package_status")  // Only status
    .eq("user_id", userId)
    .maybeSingle();
  // ...
  return {
    kioskId: kiosk.id,
    userId,
    nombre: kiosk.current_nombre || entry?.nombre || userId,
    packageStatus: ...,
    assignedAt: entry?.assigned_at ?? kiosk.last_delivery_at,
    deliveryId: (delRes.data?.id as string) ?? null,
    // payload missing!
  };
}
```

**After:**
```typescript
export async function sbGetKioskSession(kioskId: string): Promise<{
  kioskId: string;
  userId: string;
  nombre: string;
  packageStatus: PackageStatus;
  assignedAt: string | null;
  deliveryId: string | null;
  payload?: Record<string, unknown> | null;  // ← Added
} | null> {
  // ...
  const pkgRes = await sb
    .from("attendee_packages")
    .select("package_status, payload")  // ← Now includes payload
    .eq("user_id", userId)
    .maybeSingle();
  // ...
  return {
    kioskId: kiosk.id,
    userId,
    nombre: kiosk.current_nombre || entry?.nombre || userId,
    packageStatus: ...,
    assignedAt: entry?.assigned_at ?? kiosk.last_delivery_at,
    deliveryId: (delRes.data?.id as string) ?? null,
    payload: (pkgRes.data?.payload as Record<string, unknown>) ?? null,  // ← Added
  };
}
```

## API Response Changes

### `GET /api/kiosks/{kioskId}/session`

**Before:**
```json
{
  "ok": true,
  "assigned": true,
  "session": {
    "userId": "1",
    "nombre": "Francisco Bejarano",
    "packageStatus": "ready",
    "assignedAt": "2026-09-02T05:00:00Z",
    "deliveryId": null
  }
}
```

**After:**
```json
{
  "ok": true,
  "assigned": true,
  "session": {
    "userId": "1",
    "nombre": "Francisco Bejarano",
    "packageStatus": "ready",
    "assignedAt": "2026-09-02T05:00:00Z",
    "deliveryId": null,
    "payload": {
      "status": "completed",  ← Kiosk checks this!
      "overallScore": 85,
      "suggested_aboutme_ik": "Líder transformador...",
      "level": "Visionario",
      "axes": { ... },
      "attendee": { ... }
    }
  }
}
```

## Testing

### Quick Test (Using Postman/curl):

1. **First Time User:**
```bash
# Check session endpoint
GET http://localhost:3001/api/kiosks/kiosk-01/session

# Expected: payload.status = "pending" (or null)
```

2. **Completed User:**
```bash
# Same endpoint
GET http://localhost:3001/api/kiosks/kiosk-01/session

# Expected: payload.status = "completed"
```

## Next Steps for Kiosk Team

1. ✅ **Backend is ready** - The session endpoint now returns the payload
2. ⚠️ **Frontend needs implementation:**
   - Add check for `session.payload?.status === "completed"`
   - Create/show "Mission Accomplished" screen component
   - Implement auto-release after 10-15 seconds
3. 📖 **Reference:** See `docs/KIOSK-COMPLETION-FLOW.md` for complete implementation guide

## Visual Flow

```
User Scans Wristband
        ↓
Webhook (allows entry)
        ↓
Stores payload.status in DB
        ↓
Moderator assigns to kiosk
        ↓
Kiosk fetches session
        ↓
Checks payload.status
        ↓
    ┌───┴───┐
    ↓       ↓
"completed"  "pending"
    ↓         ↓
Mission     Normal
Accomplished Journey
Screen
```

## Database Schema (Reference)

```sql
create table attendee_packages (
  user_id text primary key,
  ...
  payload jsonb not null default '{}'::jsonb,  -- Stores full API response
  journey_completed_at timestamptz null,       -- Local completion timestamp
  ...
);
```

The `payload` field contains:
- `status`: "pending" | "completed" (from External API)
- `overallScore`: number
- `suggested_aboutme_ik`: string
- `level`: string
- `axes`: object
- `attendee`: object

## Status Fields Reference

| Field | Location | What It Means |
|-------|----------|---------------|
| **`payload.status`** | `attendee_packages.payload` | External API completion status - **This is what the kiosk should check** |
| `journey_completed_at` | `attendee_packages` | Timestamp when user finished locally |
| `check_ins.status` | `check_ins` | Queue status (pending/assigned/in_session/done) |

## No Changes Needed In:
- ✅ Webhook logic (already stores payload correctly)
- ✅ Database schema (payload field already exists)
- ✅ Moderator dashboard (no changes needed)

## Verification Checklist

- [x] Webhook allows completed users to check in
- [x] Payload is stored in database
- [x] Session endpoint returns payload
- [x] Documentation created
- [ ] Kiosk checks payload.status (frontend work)
- [ ] "Mission Accomplished" screen implemented (frontend work)
- [ ] Auto-release timer implemented (frontend work)
- [ ] Testing with real completed users

## Notes

- The webhook does NOT block completed users - this is intentional
- The kiosk has full control over what to show
- The External API's `status` field is the source of truth
- Local `journey_completed_at` is only set after completing locally
