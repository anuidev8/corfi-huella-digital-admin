#!/bin/bash
# Test script to verify payload is returned in kiosk session

echo "=== Testing Kiosk Session Payload ==="
echo ""
echo "1. Checking if Francisco (user_id: 1) is in queue..."
curl -s http://localhost:3001/api/state | jq '.queue[] | select(.userId == "1")'

echo ""
echo "2. If Francisco were assigned to kiosk-01, the session would return:"
echo ""
echo "Expected structure:"
cat <<'EOF'
{
  "ok": true,
  "assigned": true,
  "kioskId": "kiosk-01",
  "session": {
    "userId": "1",
    "nombre": "Francisco Bejarano",
    "packageStatus": "ready",
    "assignedAt": "...",
    "deliveryId": null,
    "payload": {
      "status": "completed",  ← KIOSK CHECKS THIS!
      "overallScore": 75,
      ...
    }
  }
}
EOF

echo ""
echo "3. To test, click 'Asignar' button in moderator for Francisco"
echo "   Then check: http://localhost:3001/api/kiosks/kiosk-01/session"
