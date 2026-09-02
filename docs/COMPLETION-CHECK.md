# Completion Status Handling

## Overview

This document explains how the system handles users who have already completed the Huella Digital experience.

## The Correct Flow

### 1. **Webhook Behavior** ✅
**The webhook ALWAYS allows check-ins**, regardless of completion status:
- Creates a new `check_ins` entry with `status: pending`
- Upserts `attendee_packages` with the full API `payload` (including `status` field)
- Assigns the user to an available kiosk

### 2. **Data Storage** ✅
**Location**: `attendee_packages.payload` (JSONB field)

The webhook stores the complete API response in the `payload` field, which includes:
```json
{
  "status": "completed",  // or "pending"
  "overallScore": 85,
  "suggested_aboutme_ik": "...",
  "attendee": { ... },
  ...
}
```

### 3. **Kiosk Responsibility** ⚠️
**The kiosk must check the payload status** when it receives an assignment:

```typescript
// When kiosk fetches session data
GET /api/kiosks/{kioskId}/session

// The response includes the attendee_packages.payload
{
  "ok": true,
  "assigned": true,
  "session": {
    "userId": "1",
    "nombre": "Francisco Bejarano",
    "packageStatus": "ready",
    "payload": {
      "status": "completed",  // ← Check this!
      ...
    }
  }
}

// Kiosk logic:
if (session.payload?.status === "completed") {
  // Show "Mission Accomplished" screen
  showCompletedScreen();
} else {
  // Show normal experience
  startJourney();
}
```

## Complete Data Flow

```
1. User scans wristband
   ↓
2. Webhook: POST /api/webhooks/corfilink
   ├─ Resolves identity via Attendees API
   ├─ Gets full payload (including status field)
   └─ Stores in attendee_packages.payload
   ↓
3. Webhook creates check_in (status: pending)
   ↓
4. Moderator assigns to kiosk
   ↓
5. Kiosk fetches session: GET /api/kiosks/{id}/session
   ├─ Receives payload with status field
   └─ Checks: payload.status === "completed"?
   ↓
6. Kiosk Decision:
   ├─ If completed → Show "Mission Accomplished" screen
   └─ If pending → Show normal experience
```

## Why This Approach?

1. **Flexibility**: Users can still check in even after completion (for data tracking)
2. **Kiosk Control**: The kiosk decides what to show based on real-time data
3. **No Blocking**: The webhook doesn't reject entries (better UX)
4. **Async-Safe**: Even if local DB isn't synced, the API payload is the source of truth

## Database Schema

### `attendee_packages` table
```sql
create table attendee_packages (
  user_id text primary key,
  first_name text not null,
  last_name text not null,
  ...
  journey_completed_at timestamptz null,  -- Set when local journey completes
  payload jsonb not null default '{}'::jsonb,  -- Full API response (includes status)
  ...
);
```

## Status Field Values

| Field | Location | Values | Meaning |
|-------|----------|--------|---------|
| `payload.status` | API response → `attendee_packages.payload` | `"pending"`, `"completed"` | External API completion status |
| `journey_completed_at` | `attendee_packages.journey_completed_at` | `null` or timestamp | Local completion timestamp |
| `check_ins.status` | `check_ins.status` | `"pending"`, `"assigned"`, `"in_session"`, `"done"`, `"cancelled"` | Check-in queue status |

## Kiosk Implementation TODO

The kiosk needs to:

1. Check `payload.status` when fetching session data
2. If `"completed"`:
   - Show "Mission Accomplished" screen (like the one in your screenshot)
   - Optionally allow them to view their previous results
   - Auto-release after a timeout
3. If `"pending"`:
   - Show normal onboarding/journey flow

## Example Kiosk Code

```typescript
async function handleAssignment(kioskId: string) {
  const response = await fetch(`/api/kiosks/${kioskId}/session`);
  const data = await response.json();
  
  if (!data.assigned) {
    showAttractScreen();
    return;
  }
  
  const { session } = data;
  const apiStatus = session.payload?.status;
  
  if (apiStatus === "completed") {
    // User already did the experience
    showMissionAccomplishedScreen({
      nombre: session.nombre,
      autoReleaseAfter: 10000, // 10 seconds
    });
  } else {
    // Start normal journey
    startHuellaJourney(session);
  }
}
```

## Testing

### Test Case 1: First Time User
```bash
POST /api/webhooks/corfilink
{ "uidManilla": "WB-001", ... }
# API returns: payload.status = "pending"
```
**Expected**: Kiosk shows normal experience

### Test Case 2: Returning User (Completed)
```bash
POST /api/webhooks/corfilink
{ "uidManilla": "WB-001", ... }
# API returns: payload.status = "completed"
```
**Expected**: Kiosk shows "Mission Accomplished" screen

## Modified Files

- ❌ `src/lib/supabaseStore.ts` - NO changes needed (reverted blocking logic)
- ⚠️ `[Kiosk Frontend]` - NEEDS implementation to check `payload.status`
- ✅ `supabase/schema.sql` - Already has `payload jsonb` field

