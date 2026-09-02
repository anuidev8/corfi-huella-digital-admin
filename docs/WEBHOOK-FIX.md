# Fix: Webhook Now Creates New Entries for Completed Users

## Problem Found

When you tested the webhook with Francisco (who already completed), it returned:
```json
{
  "ok": true,
  "resolvedBy": "direct_id",
  "created": false,  ← PROBLEM: Should be true!
  "entry": {
    "status": "done",
    ...
  }
}
```

### Why This Happened

The webhook had a check at lines 316-338 in `supabaseStore.ts`:

```typescript
// OLD CODE (NOW REMOVED)
const completed = await sb
  .from("attendee_packages")
  .select("journey_completed_at")
  .eq("user_id", userId)
  .not("journey_completed_at", "is", null)
  .maybeSingle();
  
if (completed.data) {
  // Return old "done" entry instead of creating new one
  const doneEntry = await sb
    .from("check_ins")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "done")
    ...
  return { entry: mapCheckIn(doneEntry.data), created: false };
}
```

This prevented completed users from being re-queued!

## Fix Applied

**Removed lines 316-338** - the check for `journey_completed_at`

### New Behavior

The webhook now only checks for **active entries** (pending/assigned/in_session):

```typescript
// NEW CODE
const active = await sb
  .from("check_ins")
  .select("*")
  .eq("user_id", userId)
  .in("status", ["pending", "assigned", "in_session"])
  .limit(1)
  .maybeSingle();
  
if (active.data) {
  // Only skip if there's an ACTIVE entry
  return { entry: mapCheckIn(active.data), created: false };
}

// Otherwise, create new entry!
// ... (continues to create new check-in)
```

## Result

### Before Fix:
- User with `journey_completed_at` set → Webhook returns old entry (`created: false`)
- User does NOT appear in COLA
- Cannot be assigned to kiosk again

### After Fix: ✅
- User with `journey_completed_at` set → Webhook creates NEW entry (`created: true`)
- User APPEARS in COLA
- Can be assigned to kiosk
- Kiosk checks `payload.status` and shows appropriate screen

## Testing

### Test 1: Completed User Scans Again

```bash
POST /api/webhooks/corfilink
{
  "userId": "1",
  "nombre": "Francisco Bejarano"
}
```

**Expected Response:**
```json
{
  "ok": true,
  "resolvedBy": "direct_id",
  "created": true,  ← NOW TRUE!
  "entry": {
    "id": "new-uuid",
    "userId": "1",
    "nombre": "Francisco Bejarano",
    "status": "pending",  ← NEW ENTRY
    "packageStatus": "ready",
    "kioskId": null,
    "checkedInAt": "2026-09-02T06:00:00Z",
    ...
  }
}
```

**Moderator:**
- Entry appears in COLA ✅
- Can be assigned to kiosk ✅

**Kiosk:**
- Receives `payload.status === "completed"` ✅
- Shows "Mission Accomplished" screen ✅

### Test 2: User Already in Active Queue

```bash
# First check-in
POST /api/webhooks/corfilink { "userId": "2", "nombre": "María García" }
# → created: true, status: "pending"

# Scan again before assignment
POST /api/webhooks/corfilink { "userId": "2", "nombre": "María García" }
# → created: false (returns same pending entry)
```

**This is correct!** We don't want duplicate active entries.

## Summary of Changes

### File: `src/lib/supabaseStore.ts`

**Removed:**
- Lines 316-338: Check for `journey_completed_at`
- Logic that returned old "done" entries

**Added:**
- Lines 617: `payload` field in session return type
- Lines 653: Query for `payload` from database
- Lines 702: Return `payload` to kiosk

**Result:**
1. ✅ Completed users can check in again
2. ✅ New entry created in COLA
3. ✅ Kiosk receives `payload` with status
4. ✅ Kiosk shows correct screen

## Complete Flow (After Fix)

```
1. Francisco scans wristband
   ↓
2. Webhook checks: Active entry? No → CREATE NEW ✅
   ↓
3. Entry appears in COLA with status: "pending" ✅
   ↓
4. Moderator assigns to Kiosk 01 ✅
   ↓
5. Kiosk fetches session
   Receives: payload.status = "completed" ✅
   ↓
6. Kiosk shows "Mission Accomplished" screen ✅
```

## Why This is Better

### Old Logic (Removed):
- ❌ Blocked completed users
- ❌ Couldn't track re-visits
- ❌ Confusing UX (scan doesn't do anything)

### New Logic (Current):
- ✅ Allows re-entry
- ✅ Tracks all check-ins
- ✅ Kiosk decides what to show
- ✅ Better analytics (know who came back)
- ✅ Flexible (can show different content to returning users)

## Verification

To verify the fix is working:

1. **Check the code:**
```bash
git diff src/lib/supabaseStore.ts
# Should show removed lines 316-338
```

2. **Test webhook:**
```bash
# Use Postman or send webhook request for Francisco (user_id: 1)
# Response should show: "created": true
```

3. **Check moderator:**
```
# After webhook, Francisco should appear in COLA section
```

4. **Assign and test kiosk:**
```
# Assign Francisco to kiosk
# Kiosk session should include payload.status = "completed"
```

## Files Modified

- ✅ `src/lib/supabaseStore.ts` - Removed blocking logic, added payload to session
- ✅ `docs/webhook-openapi.yaml` - Updated documentation
- ✅ `docs/COMPLETION-CHECK.md` - Technical documentation
- ✅ `docs/KIOSK-COMPLETION-FLOW.md` - Kiosk implementation guide
- ✅ `docs/FLOW-EXPLANATION.md` - Flow explanation
- ✅ `docs/IMPLEMENTATION-SUMMARY.md` - Implementation summary
- ✅ `docs/WEBHOOK-FIX.md` - This document

All changes are ready to commit! 🎉
