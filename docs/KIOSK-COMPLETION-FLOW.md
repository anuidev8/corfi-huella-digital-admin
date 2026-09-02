# Kiosk Completion Screen Flow

## Summary

When a user who has already completed the Huella Digital experience scans their wristband again:

1. ✅ **Webhook ALLOWS the check-in** (creates entry in queue)
2. ✅ **Database stores the API status** in `attendee_packages.payload.status`
3. ⚠️ **Kiosk MUST check the status** and show the appropriate screen

## Visual Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER SCANS WRISTBAND                                         │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. WEBHOOK: POST /api/webhooks/corfilink                        │
│    - Resolves identity via Attendees API                        │
│    - Gets payload: { status: "completed", ... }                 │
│    - Stores in attendee_packages.payload                        │
│    - Creates check_in (status: pending)                         │
│    - ✅ ALLOWS ENTRY (does not block)                           │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. MODERATOR ASSIGNS TO KIOSK                                   │
│    - Updates check_ins.kiosk_id = "kiosk-01"                    │
│    - Updates check_ins.status = "assigned"                      │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. KIOSK RECEIVES ASSIGNMENT                                    │
│    - GET /api/kiosks/kiosk-01/session                           │
│    - Receives:                                                  │
│      {                                                          │
│        "userId": "1",                                           │
│        "nombre": "Francisco Bejarano",                          │
│        "packageStatus": "ready",                                │
│        "payload": {                                             │
│          "status": "completed",  ← CHECK THIS!                 │
│          "overallScore": 85,                                    │
│          ...                                                    │
│        }                                                        │
│      }                                                          │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. KIOSK DECISION LOGIC                                         │
│                                                                 │
│    if (session.payload?.status === "completed") {               │
│      → Show "MISSION ACCOMPLISHED" screen                       │
│      → Display previous results (optional)                      │
│      → Auto-release after 10-15 seconds                         │
│    } else {                                                     │
│      → Show normal onboarding                                   │
│      → Start Huella journey                                     │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### `attendee_packages` table
```sql
create table attendee_packages (
  user_id text primary key,
  first_name text not null,
  last_name text not null,
  ...
  payload jsonb not null default '{}'::jsonb,  -- ← Contains status field
  ...
);
```

### Example `payload` content:
```json
{
  "status": "completed",  // ← This is what the kiosk checks
  "overallScore": 85,
  "suggested_aboutme_ik": "Líder transformador con visión estratégica",
  "level": "Visionario",
  "axes": {
    "influencia": 22,
    "conocimiento": 20,
    ...
  },
  "attendee": {
    "attendee_id": "1",
    "full_name": "Francisco Bejarano",
    "company": "Pajonales, Mavalle y Unipalma",
    ...
  }
}
```

## Kiosk Implementation Pseudocode

```typescript
// Main kiosk assignment handler
async function onAssignmentReceived(kioskId: string) {
  // 1. Fetch session data
  const response = await fetch(`/api/kiosks/${kioskId}/session`);
  const data = await response.json();
  
  if (!data.assigned || !data.session) {
    // No assignment, show attract screen
    showAttractScreen();
    return;
  }
  
  const { session } = data;
  const apiStatus = session.payload?.status;
  
  // 2. Check completion status from API
  if (apiStatus === "completed") {
    // User already completed the experience
    showMissionAccomplishedScreen({
      nombre: session.nombre,
      userId: session.userId,
      // Optionally show their previous results
      results: session.payload,
      autoReleaseSeconds: 15
    });
    
    // Auto-release after timeout
    setTimeout(() => {
      releaseKiosk(kioskId, session.userId);
    }, 15000);
    
  } else {
    // Normal flow: start the journey
    showOnboardingScreen();
    await startHuellaJourney(session);
  }
}

// Mission accomplished screen component
function showMissionAccomplishedScreen(props) {
  return (
    <div className="mission-accomplished">
      <img src="/seti-logo.png" alt="SETI" />
      <h1>¡MISIÓN CUMPLIDA!</h1>
      <h2>YA DESCUBRISTE TU HUELLA</h2>
      
      <div className="user-card">
        <QRCode value={`https://huella.seti.com/results/${props.userId}`} />
        <p>Tu tarjeta e informe completo ya están en tu correo.</p>
        <p>Escanéalo • descubre todo lo que hace SETI por ti.</p>
      </div>
      
      <p className="name">{props.nombre}</p>
      
      {/* Auto-release countdown */}
      <p className="countdown">Regresando en {props.autoReleaseSeconds}s...</p>
    </div>
  );
}

// Release kiosk when done
async function releaseKiosk(kioskId: string, userId: string) {
  await fetch(`/api/kiosks/${kioskId}/release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  
  // Return to attract screen
  showAttractScreen();
}
```

## Screen Reference

Based on your screenshot, the "Mission Accomplished" screen shows:

![Mission Accomplished Screen](../assets/Screenshot_2026-09-01_at_10.35.13_PM-3d0c1ddd-bd1f-497d-96cb-8c500f9e967e.png)

**Elements**:
- SETI logo
- "¡MISIÓN CUMPLIDA!"
- "YA DESCUBRISTE TU HUELLA"
- QR code for accessing results
- User information
- Auto-return message

## API Endpoints

### Kiosk Session Endpoint
```
GET /api/kiosks/{kioskId}/session

Response (when assigned):
{
  "ok": true,
  "assigned": true,
  "kioskId": "kiosk-01",
  "session": {
    "userId": "1",
    "nombre": "Francisco Bejarano",
    "packageStatus": "ready",
    "assignedAt": "2026-09-02T05:00:00Z",
    "deliveryId": null,
    "payload": {
      "status": "completed",  // ← Check this field
      "overallScore": 85,
      ...
    }
  }
}
```

### Kiosk Release Endpoint
```
POST /api/kiosks/{kioskId}/release

Body:
{
  "userId": "1"
}

Response:
{
  "ok": true,
  "kiosk": {
    "id": "kiosk-01",
    "busy": "free",
    "currentUserId": null,
    ...
  }
}
```

## Status Field Comparison

| Field | Location | Purpose |
|-------|----------|---------|
| `payload.status` | `attendee_packages.payload` | API's completion status (`"pending"` or `"completed"`) - **Use this in kiosk** |
| `journey_completed_at` | `attendee_packages.journey_completed_at` | Local timestamp when user finished |
| `check_ins.status` | `check_ins.status` | Queue status (`"pending"`, `"assigned"`, `"in_session"`, `"done"`) |
| `check_ins.completed_at` | `check_ins.completed_at` | When this specific check-in was completed |

## Testing Scenarios

### Scenario 1: First Time User
1. User scans wristband → API returns `status: "pending"`
2. Webhook creates check-in
3. Moderator assigns to kiosk
4. Kiosk checks `payload.status === "pending"`
5. **Result**: Shows normal onboarding and journey

### Scenario 2: Returning User (Already Completed)
1. User scans wristband → API returns `status: "completed"`
2. Webhook creates check-in (**allowed**, not blocked)
3. Moderator assigns to kiosk
4. Kiosk checks `payload.status === "completed"`
5. **Result**: Shows "Mission Accomplished" screen
6. Auto-releases after 15 seconds

## Important Notes

⚠️ **The webhook does NOT block completed users**
- It always creates a check-in entry
- The kiosk is responsible for showing the correct screen

✅ **The kiosk MUST check `payload.status`**
- This is the source of truth from the External API
- It's stored in the database when the webhook runs

🔄 **Auto-release is recommended**
- Show the completion screen for 10-15 seconds
- Then automatically release the kiosk
- Return to attract screen

## Files Modified

- ✅ `docs/webhook-openapi.yaml` - Updated webhook flow description
- ✅ `docs/COMPLETION-CHECK.md` - Complete documentation
- ✅ `docs/KIOSK-COMPLETION-FLOW.md` - This file (kiosk implementation guide)
- ❌ `src/lib/supabaseStore.ts` - No changes (blocking logic reverted)

## Next Steps for Kiosk Team

1. Add logic to check `session.payload?.status` when receiving assignment
2. Create/update "Mission Accomplished" screen component
3. Implement auto-release timer
4. Test both scenarios (first time vs. returning user)
