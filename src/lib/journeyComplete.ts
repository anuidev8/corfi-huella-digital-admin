import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureCheckInDone(
  sb: SupabaseClient,
  args: { userId: string; kioskId: string; completedAt: string }
): Promise<void> {
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
        status: "done",
        completed_at: args.completedAt,
        kiosk_id: args.kioskId,
      })
      .eq("id", active.id);
    if (res.error) throw new Error(res.error.message);
    return;
  }

  const pending = rows?.find((r) => r.status === "pending");
  if (pending) {
    const res = await sb
      .from("check_ins")
      .update({
        status: "done",
        completed_at: args.completedAt,
        kiosk_id: args.kioskId,
      })
      .eq("id", pending.id);
    if (res.error) throw new Error(res.error.message);
    return;
  }

  if (rows?.some((r) => r.status === "done")) return;

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

  const kioskRes = await sb
    .from("kiosks")
    .update({
      busy: "free",
      current_user_id: null,
      current_nombre: null,
      screen: "attract",
      last_heartbeat_at: now,
    })
    .eq("id", args.kioskId);
  if (kioskRes.error) throw new Error(kioskRes.error.message);
}
