import { NextResponse } from "next/server";
import { ingestCorfilinkCheckIn, resolveAttendeeIdentity } from "@/lib/controlPlane";
import type { CorfilinkCheckIn, CorfilinkRawPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Returns true when the body looks like the new physical totem format. */
function isRawTotemPayload(body: unknown): body is CorfilinkRawPayload {
  return (
    typeof body === "object" &&
    body !== null &&
    "uidManilla" in body &&
    "asistente" in body &&
    typeof (body as Record<string, unknown>).uidManilla === "string"
  );
}

/**
 * Corfilink / totem check-in webhook.
 * Accepts both shapes:
 *   • Legacy internal: { userId, nombre, cargo, company, ... }
 *   • New totem:       { uidManilla, readerId, timestamp, asistente: { nombreCompleto, ... } }
 *
 * Resolution fallback chain (new totem only):
 *   1. attendees.wristband_uid = uidManilla        → resolvedBy: "wristband"
 *   2. attendees.full_name ilike nombreCompleto     → resolvedBy: "name"
 *   3. attendees.attendee_id = uidManilla           → resolvedBy: "direct_id"
 *   4. nothing matched → stub entry for moderator   → resolvedBy: "unmatched"
 *
 * Optional auth: header `x-webhook-secret` must match CORFILINK_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const expected = process.env.CORFILINK_WEBHOOK_SECRET;
  if (expected) {
    const got = request.headers.get("x-webhook-secret");
    if (got !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let checkIn: CorfilinkCheckIn;
  let resolvedBy: string = "legacy";

  if (isRawTotemPayload(body)) {
    // ── New physical totem payload ──────────────────────────────────────────
    if (!body.uidManilla?.trim() || !body.asistente?.nombreCompleto?.trim()) {
      return NextResponse.json(
        { error: "uidManilla and asistente.nombreCompleto are required" },
        { status: 400 }
      );
    }

    const resolved = await resolveAttendeeIdentity(body);
    resolvedBy = resolved.resolvedBy;

    checkIn = {
      userId:    resolved.attendeeId,
      nombre:    resolved.nombre,
      cargo:     body.asistente.cargo?.trim(),
      company:   resolved.company,
      email:     body.asistente.email?.trim(),
      timestamp: body.timestamp,
    };
  } else {
    // ── Legacy internal format (simulator + existing integrations) ──────────
    const legacy = body as Partial<CorfilinkCheckIn>;
    if (!legacy.userId || !legacy.nombre) {
      return NextResponse.json(
        { error: "userId and nombre are required" },
        { status: 400 }
      );
    }
    checkIn = {
      userId:    legacy.userId,
      nombre:    legacy.nombre,
      cargo:     legacy.cargo,
      company:   legacy.company,
      email:     legacy.email,
      eventId:   legacy.eventId,
      timestamp: legacy.timestamp,
    };
  }

  try {
    const result = await ingestCorfilinkCheckIn(checkIn);
    return NextResponse.json({
      ok: true,
      resolvedBy,
      created: result.created,
      entry: result.entry,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingest failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
