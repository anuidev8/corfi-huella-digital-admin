# Correct Flow: COLA → Kiosk Assignment → Screen Logic

## Your Understanding is 100% Correct! ✅

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER SCANS WRISTBAND (completed or not)                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. WEBHOOK: POST /api/webhooks/corfilink                    │
│    ✅ ALWAYS creates entry                                  │
│    ✅ Stores payload.status in DB                           │
│    ✅ NO BLOCKING (even if completed)                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. MODERATOR DASHBOARD - COLA SECTION                       │
│                                                              │
│    REGISTRADOS: 1                                            │
│    ┌─────────────────────────────────────┐                  │
│    │ Francisco Bejarano  [registrado]    │                  │
│    │ Compañía: Pajonales, Mavalle y...   │                  │
│    │                                      │                  │
│    │ Shows in queue NO MATTER WHAT! ✅   │                  │
│    └─────────────────────────────────────┘                  │
│                                                              │
│    DISPOSITIVOS:                                             │
│    ┌─────────────────────────────────────┐                  │
│    │ Kiosk 01  [en línea] [libre]        │                  │
│    │ Kiosk 02  [desconectado]             │                  │
│    │ Kiosk 03  [desconectado]             │                  │
│    └─────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
                  [Moderator clicks "Asignar"]
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. ASSIGNMENT TO KIOSK                                       │
│    - Francisco → Kiosk 01                                    │
│    - check_ins.status = "assigned"                           │
│    - check_ins.kiosk_id = "kiosk-01"                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. KIOSK FETCHES SESSION                                     │
│    GET /api/kiosks/kiosk-01/session                          │
│                                                              │
│    Response:                                                 │
│    {                                                         │
│      "session": {                                            │
│        "userId": "1",                                        │
│        "nombre": "Francisco Bejarano",                       │
│        "payload": {                                          │
│          "status": "completed",  ← KEY FIELD!               │
│          "overallScore": 75,                                 │
│          ...                                                 │
│        }                                                     │
│      }                                                       │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. KIOSK DECISION LOGIC                                      │
│                                                              │
│    if (session.payload?.status === "completed") {            │
│                                                              │
│      ┌──────────────────────────────────────┐               │
│      │  SHOW "MISSION ACCOMPLISHED" SCREEN  │               │
│      │                                       │               │
│      │  ┌─────────────────────────────────┐ │               │
│      │  │    SETI LOGO                    │ │               │
│      │  │                                  │ │               │
│      │  │  ¡MISIÓN CUMPLIDA!              │ │               │
│      │  │  YA DESCUBRISTE TU HUELLA       │ │               │
│      │  │                                  │ │               │
│      │  │  [QR CODE]                      │ │               │
│      │  │                                  │ │               │
│      │  │  Tu tarjeta e informe completo  │ │               │
│      │  │  ya están en tu correo.         │ │               │
│      │  │                                  │ │               │
│      │  │  Francisco Bejarano             │ │               │
│      │  │                                  │ │               │
│      │  │  Regresando en 15s...           │ │               │
│      │  └─────────────────────────────────┘ │               │
│      └──────────────────────────────────────┘               │
│                                                              │
│    } else {                                                  │
│                                                              │
│      ┌──────────────────────────────────────┐               │
│      │   SHOW NORMAL EXPERIENCE             │               │
│      │   - Onboarding                        │               │
│      │   - Huella journey                    │               │
│      │   - Full experience                   │               │
│      └──────────────────────────────────────┘               │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
```

## Key Points

### ✅ COLA (Queue) Behavior
- **Shows ALL check-ins**, regardless of completion status
- Francisco appears in "REGISTRADOS" even if he completed before
- This is correct! Moderator can see everyone who checked in

### ✅ Kiosk Assignment
- Moderator can assign completed users to kiosks
- No blocking - assignment always works
- Kiosk receives the `payload` with `status` field

### ✅ Kiosk Screen Logic
```typescript
// Kiosk code
const response = await fetch(`/api/kiosks/${kioskId}/session`);
const { session } = await response.json();

if (session?.payload?.status === "completed") {
  // Show "Mission Accomplished" screen
  showCompletionScreen(session);
  
  // Auto-release after 15 seconds
  setTimeout(() => {
    releaseKiosk();
  }, 15000);
  
} else {
  // Show normal experience
  startHuellaJourney(session);
}
```

## What You See in Screenshot

Your moderator screenshot shows:
- **COLA**: Empty (no one in queue right now)
- **REGISTRADOS**: 1 (Francisco is registered)
- **DISPOSITIVOS LIBRES**: 1 (Kiosk 01 available)

This is correct! Francisco completed the experience (`journeyCompletedAt` is set), so he's in "REGISTRADOS" but not in the active queue.

## Testing Steps

1. **Scan wristband again** (Francisco or anyone who completed)
   → Entry appears in COLA ✅
   
2. **Moderator assigns to Kiosk 01**
   → Entry moves to "REGISTRO DE ENTREGAS" ✅
   
3. **Kiosk checks `payload.status`**
   → If "completed": Show Mission Accomplished screen ✅
   → If "pending": Show normal experience ✅

## Summary

Your understanding is **perfect**! 

- ✅ Webhook allows entry (shows in COLA)
- ✅ Moderator can assign (async to kiosk)
- ✅ Kiosk checks status and shows correct screen

The backend is ready. The kiosk frontend just needs to check `session.payload?.status` and show the appropriate screen!
