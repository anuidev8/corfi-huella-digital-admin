import { NextResponse } from "next/server";
import { updateAttendeeStatus } from "@/lib/attendeesApiClient";
import { getSupabaseAdmin } from "@/lib/supabase";
import { markJourneyComplete } from "@/lib/journeyComplete";
import { sbResetAttendeeToPending } from "@/lib/supabaseStore";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  let body: { attendeeId?: string; status?: string; kioskId?: string };
  try {
    body = (await request.json()) as { attendeeId?: string; status?: string; kioskId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.attendeeId) {
    return NextResponse.json({ error: "attendeeId is required" }, { status: 400 });
  }
  if (body.status !== "pending" && body.status !== "completed") {
    return NextResponse.json(
      { error: "status must be 'pending' or 'completed'" },
      { status: 400 }
    );
  }

  if (body.status === "completed") {
    // Mark complete in both Supabase and the external Attendees API.
    // markJourneyComplete handles the external API call internally.
    try {
      const sb = getSupabaseAdmin();
      await markJourneyComplete(sb, {
        userId: body.attendeeId,
        kioskId: body.kioskId ?? "moderator",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to mark journey complete";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } else {
    // For "pending": reset Supabase (clear journey_completed_at, ensure a
    // pending check_ins row so they actually show up in Cola) — the real
    // state — then sync the external Attendees API best-effort, same as
    // the "completed" branch does via markJourneyComplete.
    try {
      await sbResetAttendeeToPending(body.attendeeId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset attendee";
      return NextResponse.json({ error: message }, { status: 500 });
    }
    void updateAttendeeStatus(body.attendeeId, body.status);
  }

  return NextResponse.json({ ok: true, attendeeId: body.attendeeId, status: body.status });
}
