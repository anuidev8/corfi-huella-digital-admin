import type { SupabaseClient } from "@supabase/supabase-js";
import { updateAttendeeStatus } from "@/lib/attendeesApiClient";

/**
 * Closes out whatever check_ins row is active/pending for this user as
 * `status`. Used by both real completion ("done") and a plain kiosk
 * release/cancel ("cancelled") — see markJourneyComplete vs endKioskSession.
 */
async function closeActiveCheckIn(
  sb: SupabaseClient,
  args: { userId: string; kioskId: string; closedAt: string; status: "done" | "cancelled" }
): Promise<boolean> {
  const userId = args.userId.trim();
  const { data: rows, error } = await sb
    .from("check_ins")
    .select("id, status")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);

  const active = rows?.find(
    (r) => r.status === "assigned" || r.status === "in_session"
  );
  if (active) {
    const res = await sb
      .from("check_ins")
      .update({
        status: args.status,
        completed_at: args.closedAt,
        kiosk_id: args.kioskId,
      })
      .eq("id", active.id)
      .select("id");
    if (res.error) throw new Error(res.error.message);
    return true;
  }

  const pending = rows?.find((r) => r.status === "pending");
  if (pending) {
    const res = await sb
      .from("check_ins")
      .update({
        status: args.status,
        completed_at: args.closedAt,
        kiosk_id: args.kioskId,
      })
      .eq("id", pending.id)
      .select("id");
    if (res.error) throw new Error(res.error.message);
    return true;
  }

  return Boolean(rows?.some((r) => r.status === args.status));
}

export async function ensureCheckInDone(
  sb: SupabaseClient,
  args: { userId: string; kioskId: string; completedAt: string }
): Promise<void> {
  const userId = args.userId.trim();
  const closed = await closeActiveCheckIn(sb, {
    userId,
    kioskId: args.kioskId,
    closedAt: args.completedAt,
    status: "done",
  });
  if (closed) return;

  const { data: pkg, error: pkgErr } = await sb
    .from("attendee_packages")
    .select("first_name, last_name, role, company, email, package_status")
    .eq("user_id", userId)
    .maybeSingle();
  if (pkgErr) throw new Error(pkgErr.message);
  if (!pkg) return;

  const nombre = [pkg.first_name, pkg.last_name].filter(Boolean).join(" ");
  const ins = await sb.from("check_ins").insert({
    user_id: userId,
    nombre,
    cargo: pkg.role,
    company: pkg.company,
    email: pkg.email,
    package_status: pkg.package_status,
    status: "done",
    kiosk_id: args.kioskId,
    completed_at: args.completedAt,
    checked_in_at: args.completedAt,
  });
  if (ins.error) throw new Error(ins.error.message);
}

async function freeKiosk(
  sb: SupabaseClient,
  kioskId: string,
  now: string
): Promise<void> {
  const kioskRes = await sb
    .from("kiosks")
    .update({
      busy: "free",
      current_user_id: null,
      current_nombre: null,
      screen: "attract",
      last_heartbeat_at: now,
    })
    .eq("id", kioskId);
  if (kioskRes.error) throw new Error(kioskRes.error.message);
}

/**
 * Genuine completion — the visitor actually reached the end of the journey.
 * Sets attendee_packages.journey_completed_at (the field the kiosk checks
 * before showing "misión cumplida" instead of restarting the journey) and
 * syncs "completed" to the external Attendees API. Only call this from a
 * path that KNOWS the journey actually finished — see endKioskSession for
 * every other way a kiosk assignment ends (manual "Liberar", the stale/
 * orphaned-session sweep, a visitor cancelling mid-journey).
 */
export async function markJourneyComplete(
  sb: SupabaseClient,
  args: { userId: string; kioskId: string }
): Promise<void> {
  const now = new Date().toISOString();
  const userId = args.userId.trim();
  if (!userId) throw new Error("userId required");

  const pkgRes = await sb
    .from("attendee_packages")
    .update({ journey_completed_at: now, updated_at: now })
    .eq("user_id", userId);
  if (pkgRes.error) throw new Error(pkgRes.error.message);

  await ensureCheckInDone(sb, { userId, kioskId: args.kioskId, completedAt: now });
  await freeKiosk(sb, args.kioskId, now);

  // Fire-and-forget: sync status to the external Attendees API.
  // Does not throw — a failure here must never block the moderator flow.
  void updateAttendeeStatus(userId, "completed");
}

/**
 * Ends a kiosk assignment WITHOUT claiming the visitor finished — a manual
 * "Liberar" by staff, the stale/orphaned-session sweep (kiosk reload/tab-
 * close/timeout), or the kiosk's own cancel/reset path. Frees the kiosk and
 * closes the check-in as "cancelled" (not "done") so it stops blocking
 * re-assignment, but deliberately leaves attendee_packages.journey_completed_at
 * untouched and never syncs "completed" to the external API — an abandoned
 * session must not look like a real one on a later re-scan.
 */
export async function endKioskSession(
  sb: SupabaseClient,
  args: { userId: string; kioskId: string }
): Promise<void> {
  const now = new Date().toISOString();
  const userId = args.userId.trim();
  if (!userId) throw new Error("userId required");

  await closeActiveCheckIn(sb, {
    userId,
    kioskId: args.kioskId,
    closedAt: now,
    status: "cancelled",
  });
  await freeKiosk(sb, args.kioskId, now);
}
