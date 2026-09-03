import { NextResponse } from "next/server";
import { provisionAttendee } from "@/lib/controlPlane";

export const dynamic = "force-dynamic";

/**
 * POST { userId }
 *
 * Called by the kiosk when staff manually search-selects an attendee who
 * hasn't tapped a wristband yet (no attendee_packages row). Live-fetches the
 * full record from the Attendees API and upserts it with package_status
 * "ready" — the same end state a successful wristband tap produces — so the
 * kiosk's follow-up GET /api/attendees?userId= returns a real profile.
 */
export async function POST(request: Request) {
  let body: { userId?: string };
  try {
    body = (await request.json()) as { userId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const result = await provisionAttendee(userId);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.reason },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, userId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "provision_failed";
    console.error("[attendees/provision] failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
