/**
 * Supabase-backed store for moderator control plane.
 * Falls back is handled by store.ts when Supabase env is missing.
 */

import { markJourneyComplete } from "@/lib/journeyComplete";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  getAttendeeByWristband,
  getAttendeeById as getAttendeeByApiId,
  type AttendeeApiFull,
} from "@/lib/attendeesApiClient";
import type {
  CorfilinkCheckIn,
  CorfilinkRawPayload,
  DeliveryLog,
  Kiosk,
  KioskPackage,
  ModeratorState,
  PackageStatus,
  QueueEntry,
  QueueStatus,
  ResolvedBy,
} from "@/lib/types";

const EVENT_ID = "corfi-2026";
const OFFLINE_AFTER_MS = 45_000;

type PackageRow = {
  user_id: string;
  first_name: string;
  last_name: string;
  role: string;
  company: string;
  sector: string;
  email: string;
  overall_score: number;
  headline: string;
  package_status: PackageStatus;
  journey_completed_at?: string | null;
};

type CheckInRow = {
  id: string;
  user_id: string;
  nombre: string;
  cargo: string;
  company: string;
  email: string;
  event_id: string;
  status: QueueStatus;
  package_status: PackageStatus;
  kiosk_id: string | null;
  checked_in_at: string;
  assigned_at: string | null;
  completed_at?: string | null;
};

type KioskRow = {
  id: string;
  label: string;
  busy: "free" | "busy";
  current_user_id: string | null;
  current_nombre: string | null;
  screen: string | null;
  last_heartbeat_at: string | null;
  last_delivery_at: string | null;
  agent_id: string | null;
};

type DeliveryRow = {
  id: string;
  at: string;
  user_id: string;
  nombre: string;
  kiosk_id: string;
  kiosk_label: string;
};

function mapPackage(row: PackageRow): KioskPackage {
  return {
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    company: row.company,
    sector: row.sector,
    email: row.email,
    overallScore: row.overall_score,
    headline: row.headline,
    packageStatus: row.package_status,
    journeyCompletedAt: row.journey_completed_at ?? null,
  };
}

function mapCheckIn(row: CheckInRow): QueueEntry {
  return {
    id: row.id,
    userId: row.user_id,
    nombre: row.nombre,
    cargo: row.cargo,
    company: row.company,
    email: row.email,
    eventId: row.event_id,
    status: row.status,
    packageStatus: row.package_status,
    kioskId: row.kiosk_id,
    checkedInAt: row.checked_in_at,
    assignedAt: row.assigned_at,
    completedAt: row.completed_at ?? null,
  };
}

function mapKiosk(row: KioskRow): Kiosk {
  const last = row.last_heartbeat_at
    ? Date.parse(row.last_heartbeat_at)
    : NaN;
  const online =
    Number.isFinite(last) && Date.now() - last <= OFFLINE_AFTER_MS;
  return {
    id: row.id,
    label: row.label,
    status: online ? "online" : "offline",
    busy: row.busy,
    currentUserId: row.current_user_id,
    currentNombre: row.current_nombre,
    screen: row.screen,
    lastHeartbeatAt: row.last_heartbeat_at,
    lastDeliveryAt: row.last_delivery_at,
    agentId: row.agent_id ?? null,
  };
}

function mapDelivery(row: DeliveryRow): DeliveryLog {
  return {
    id: row.id,
    at: row.at,
    userId: row.user_id,
    nombre: row.nombre,
    kioskId: row.kiosk_id,
    kioskLabel: row.kiosk_label,
  };
}

function splitNombre(nombre: string): { firstName: string; lastName: string } {
  const parts = nombre.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1] ?? "",
  };
}

type AttendeeRow = {
  attendee_id: string;
};

export type ResolveResult = {
  attendeeId: string;
  nombre: string;
  company: string;
  resolvedBy: ResolvedBy;
  /** Full attendee record from the API, used to populate attendee_packages. Null when resolved via name/unmatched. */
  apiData: AttendeeApiFull | null;
};

/**
 * Four-step identity resolution for raw Corfilink totem payloads.
 *
 * 1. Attendees API  GET /attendees/wristband/{uid}  →  resolvedBy: "wristband"
 * 2. Attendees API  GET /attendees/{uid}            →  resolvedBy: "direct_id"
 * 3. Supabase attendees.full_name ilike fallback    →  resolvedBy: "name"
 * 4. Nothing matched → stub entry for moderator     →  resolvedBy: "unmatched"
 *
 * The API is the primary source of truth (AWS / attendees pipeline).
 * Supabase direct queries are the fallback when the API is not configured.
 */
export async function sbResolveAttendeeIdentity(
  raw: CorfilinkRawPayload
): Promise<ResolveResult> {
  const uid = raw.uidManilla.trim();
  const nombreRaw = raw.asistente.nombreCompleto.trim();
  const empresa = raw.asistente.empresa?.trim() || "—";

  // ── Step 1: API wristband lookup → then fetch full data by attendee_id ────
  if (uid) {
    const ref = await getAttendeeByWristband(uid);
    if (ref) {
      const full = await getAttendeeByApiId(ref.attendee_id);
      return {
        attendeeId: ref.attendee_id,
        nombre: nombreRaw,
        company: empresa,
        resolvedBy: "wristband",
        apiData: full,
      };
    }
  }

  // ── Step 2: API direct_id lookup (uidManilla might already be attendee_id) ─
  if (uid) {
    const full = await getAttendeeByApiId(uid);
    if (full) {
      return {
        attendeeId: full.attendee_id,
        nombre: nombreRaw,
        company: empresa,
        resolvedBy: "direct_id",
        apiData: full,
      };
    }
  }

  // ── Step 3: Supabase name fallback ────────────────────────────────────────
  if (nombreRaw) {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from("attendees")
      .select("attendee_id")
      .ilike("full_name", nombreRaw)
      .limit(1)
      .maybeSingle();
    if (data) {
      const row = data as { attendee_id: string };
      return {
        attendeeId: row.attendee_id,
        nombre: nombreRaw,
        company: empresa,
        resolvedBy: "name",
        apiData: null,
      };
    }
  }

  // ── Step 4: unmatched stub for moderator review ───────────────────────────
  return {
    attendeeId: uid || `unmatched_${Date.now()}`,
    nombre: nombreRaw,
    company: empresa,
    resolvedBy: "unmatched",
    apiData: null,
  };
}

export async function sbGetModeratorState(): Promise<ModeratorState> {
  const sb = getSupabaseAdmin();
  const [queueRes, kioskRes, pkgRes, delRes] = await Promise.all([
    sb.from("check_ins").select("*").order("checked_in_at", { ascending: false }),
    sb.from("kiosks").select("*").order("id", { ascending: true }),
    sb.from("attendee_packages").select("*"),
    sb.from("deliveries").select("*").order("at", { ascending: false }).limit(40),
  ]);

  if (queueRes.error) throw new Error(queueRes.error.message);
  if (kioskRes.error) throw new Error(kioskRes.error.message);
  if (pkgRes.error) throw new Error(pkgRes.error.message);
  if (delRes.error) throw new Error(delRes.error.message);

  const packages: Record<string, KioskPackage> = {};
  for (const row of (pkgRes.data ?? []) as PackageRow[]) {
    packages[row.user_id] = mapPackage(row);
  }

  const queue = ((queueRes.data ?? []) as CheckInRow[]).map(mapCheckIn);
  const kiosks = ((kioskRes.data ?? []) as KioskRow[]).map(mapKiosk);

  for (const kiosk of kiosks) {
    if (kiosk.busy === "busy" && kiosk.currentUserId) continue;
    const assigned = queue.find(
      (q) =>
        q.kioskId === kiosk.id &&
        (q.status === "assigned" || q.status === "in_session")
    );
    if (!assigned) continue;
    kiosk.busy = "busy";
    kiosk.currentUserId = assigned.userId;
    kiosk.currentNombre = assigned.nombre;
  }

  return {
    queue,
    kiosks,
    packages,
    deliveries: ((delRes.data ?? []) as DeliveryRow[]).map(mapDelivery),
    updatedAt: new Date().toISOString(),
  };
}

/** Returns ts if it parses as a valid date, otherwise now. */
function validTimestamp(ts?: string): string {
  if (ts && !Number.isNaN(Date.parse(ts))) return ts;
  return new Date().toISOString();
}

export async function sbIngestCorfilinkCheckIn(
  payload: CorfilinkCheckIn,
  apiData?: AttendeeApiFull | null
): Promise<{ entry: QueueEntry; created: boolean }> {
  const sb = getSupabaseAdmin();
  const userId = payload.userId.trim();
  if (!userId) throw new Error("userId is required");
  const nombre = payload.nombre?.trim() || userId;

  const active = await sb
    .from("check_ins")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["pending", "assigned", "in_session"])
    .limit(1)
    .maybeSingle();
  if (active.error) throw new Error(active.error.message);
  if (active.data) {
    return { entry: mapCheckIn(active.data as CheckInRow), created: false };
  }

  // If the user already completed their journey, do not re-queue them.
  // Return the most recent done entry so the caller can report it without
  // creating a duplicate queue entry.
  const completed = await sb
    .from("attendee_packages")
    .select("journey_completed_at")
    .eq("user_id", userId)
    .not("journey_completed_at", "is", null)
    .maybeSingle();
  if (completed.error) throw new Error(completed.error.message);
  if (completed.data) {
    const doneEntry = await sb
      .from("check_ins")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "done")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (doneEntry.data) {
      return { entry: mapCheckIn(doneEntry.data as CheckInRow), created: false };
    }
  }

  // ── Upsert attendee_packages from API data when available ─────────────────
  if (apiData) {
    const ap = apiData.payload?.attendee as Record<string, unknown> | undefined;
    const overallScore =
      typeof apiData.payload?.overallScore === "number"
        ? apiData.payload.overallScore
        : 0;
    const headline =
      typeof apiData.payload?.suggested_aboutme_ik === "string"
        ? apiData.payload.suggested_aboutme_ik
        : "";
    const nameParts = apiData.full_name.trim().split(/\s+/);
    const firstName =
      nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : nameParts[0];
    const lastName =
      nameParts.length > 1 ? (nameParts[nameParts.length - 1] ?? "") : "";

    const { error: pkgErr } = await sb.from("attendee_packages").upsert(
      {
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        role: (ap?.role as string) || payload.cargo?.trim() || "—",
        company:
          (ap?.company as string) || apiData.company || payload.company?.trim() || "—",
        sector: (ap?.sector as string) || apiData.sector || "—",
        email: apiData.email || payload.email?.trim() || "",
        overall_score: overallScore,
        headline,
        package_status: "ready",
        payload: apiData.payload ?? {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (pkgErr) throw new Error(pkgErr.message);
  } else {
    // No API data — create a stub only if no package exists yet
    const existing = await sb
      .from("attendee_packages")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing.error) throw new Error(existing.error.message);
    if (!existing.data) {
      const { firstName, lastName } = splitNombre(nombre);
      const { error: stubErr } = await sb.from("attendee_packages").insert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        role: payload.cargo?.trim() || "—",
        company: payload.company?.trim() || "—",
        email: payload.email?.trim() || "",
        package_status: "missing",
        headline: "Paquete de análisis pendiente",
      });
      if (stubErr) throw new Error(stubErr.message);
    }
  }

  const pkgRes = await sb
    .from("attendee_packages")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (pkgRes.error) throw new Error(pkgRes.error.message);
  const pkgRow = pkgRes.data as PackageRow;

  const insertedQueue = await sb
    .from("check_ins")
    .insert({
      user_id: userId,
      nombre,
      cargo: payload.cargo?.trim() || pkgRow.role || "—",
      company: payload.company?.trim() || pkgRow.company || "—",
      email: payload.email?.trim() || pkgRow.email || "",
      event_id: payload.eventId?.trim() || EVENT_ID,
      status: "pending",
      package_status: pkgRow.package_status,
      checked_in_at: validTimestamp(payload.timestamp),
    })
    .select("*")
    .single();
  if (insertedQueue.error) throw new Error(insertedQueue.error.message);

  return {
    entry: mapCheckIn(insertedQueue.data as CheckInRow),
    created: true,
  };
}

export async function sbAssignToKiosk(args: {
  queueId: string;
  kioskId: string;
}): Promise<{
  entry: QueueEntry;
  kiosk: Kiosk;
  delivery: DeliveryLog;
  kioskPackage: KioskPackage;
}> {
  const sb = getSupabaseAdmin();

  const entryRes = await sb
    .from("check_ins")
    .select("*")
    .eq("id", args.queueId)
    .single();
  if (entryRes.error) throw new Error(entryRes.error.message);
  const entry = entryRes.data as CheckInRow;
  if (entry.status !== "pending" && entry.status !== "assigned") {
    throw new Error(`Cannot assign from status ${entry.status}`);
  }

  const kioskRes = await sb
    .from("kiosks")
    .select("*")
    .eq("id", args.kioskId)
    .single();
  if (kioskRes.error) throw new Error(kioskRes.error.message);
  let kioskRow = kioskRes.data as KioskRow;
  const kioskMapped = mapKiosk(kioskRow);
  if (kioskMapped.status !== "online") throw new Error("Kiosk is offline");
  if (
    kioskRow.busy === "busy" &&
    kioskRow.current_user_id !== entry.user_id
  ) {
    throw new Error("Kiosk is busy");
  }

  if (entry.kiosk_id && entry.kiosk_id !== args.kioskId) {
    await sb
      .from("kiosks")
      .update({
        busy: "free",
        current_user_id: null,
        current_nombre: null,
        screen: "attract",
      })
      .eq("id", entry.kiosk_id)
      .eq("current_user_id", entry.user_id);
  }

  const pkgRes = await sb
    .from("attendee_packages")
    .select("*")
    .eq("user_id", entry.user_id)
    .single();
  if (pkgRes.error) throw new Error(pkgRes.error.message);
  const kioskPackage = mapPackage(pkgRes.data as PackageRow);

  const now = new Date().toISOString();
  const updEntry = await sb
    .from("check_ins")
    .update({
      status: "assigned",
      kiosk_id: args.kioskId,
      assigned_at: now,
      package_status: kioskPackage.packageStatus,
    })
    .eq("id", entry.id)
    .select("*")
    .single();
  if (updEntry.error) throw new Error(updEntry.error.message);

  const updKiosk = await sb
    .from("kiosks")
    .update({
      busy: "busy",
      current_user_id: entry.user_id,
      current_nombre: entry.nombre,
      screen: "welcome",
      last_delivery_at: now,
      last_heartbeat_at: now,
    })
    .eq("id", args.kioskId)
    .select("*")
    .single();
  if (updKiosk.error) throw new Error(updKiosk.error.message);
  kioskRow = updKiosk.data as KioskRow;

  const del = await sb
    .from("deliveries")
    .insert({
      user_id: entry.user_id,
      nombre: entry.nombre,
      kiosk_id: kioskRow.id,
      kiosk_label: kioskRow.label,
      at: now,
    })
    .select("*")
    .single();
  if (del.error) throw new Error(del.error.message);

  return {
    entry: mapCheckIn(updEntry.data as CheckInRow),
    kiosk: mapKiosk(kioskRow),
    delivery: mapDelivery(del.data as DeliveryRow),
    kioskPackage,
  };
}

export async function sbReleaseKiosk(
  kioskId: string,
  userId?: string | null
): Promise<Kiosk> {
  const sb = getSupabaseAdmin();
  const kioskRes = await sb.from("kiosks").select("*").eq("id", kioskId).single();
  if (kioskRes.error) throw new Error(kioskRes.error.message);
  const kiosk = kioskRes.data as KioskRow;

  // Prefer the caller-supplied userId, then the kiosk's current occupant,
  // then fall back to any active check_in on this kiosk (catches the case
  // where a heartbeat already cleared current_user_id before release arrived).
  let uid = userId?.trim() || kiosk.current_user_id;

  if (!uid) {
    const activeRes = await sb
      .from("check_ins")
      .select("user_id")
      .eq("kiosk_id", kioskId)
      .in("status", ["assigned", "in_session"])
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    uid = (activeRes.data as { user_id: string } | null)?.user_id ?? null;
  }

  if (uid) {
    await markJourneyComplete(sb, { userId: uid, kioskId });
  } else {
    const upd = await sb
      .from("kiosks")
      .update({
        busy: "free",
        current_user_id: null,
        current_nombre: null,
        screen: "attract",
      })
      .eq("id", kioskId)
      .select("*")
      .single();
    if (upd.error) throw new Error(upd.error.message);
    return mapKiosk(upd.data as KioskRow);
  }

  const refetch = await sb.from("kiosks").select("*").eq("id", kioskId).single();
  if (refetch.error) throw new Error(refetch.error.message);
  return mapKiosk(refetch.data as KioskRow);
}

export async function sbHeartbeatKiosk(args: {
  kioskId: string;
  screen?: string | null;
  userId?: string | null;
}): Promise<Kiosk> {
  const sb = getSupabaseAdmin();
  const patch: Partial<KioskRow> = {
    last_heartbeat_at: new Date().toISOString(),
  };
  if (args.screen !== undefined) patch.screen = args.screen;
  // Heartbeat reports presence/screen only. Never clear moderator assign
  // (userId null) — use /release when the session ends.
  if (args.userId) {
    // Only re-occupy if the check_in is still active (not done/cancelled).
    // This prevents heartbeats from re-occupying a kiosk after it was released.
    const activeCheck = await sb
      .from("check_ins")
      .select("id, nombre, status")
      .eq("user_id", args.userId)
      .in("status", ["pending", "assigned", "in_session"])
      .limit(1)
      .maybeSingle();

    if (activeCheck.data) {
      patch.current_user_id = args.userId;
      patch.busy = "busy";
      if (activeCheck.data.status === "assigned") {
        await sb
          .from("check_ins")
          .update({ status: "in_session" })
          .eq("id", activeCheck.data.id);
      }
      if (activeCheck.data.nombre) patch.current_nombre = activeCheck.data.nombre as string;
    }
    // If no active check_in found, the session was released — ignore userId from heartbeat.
  }

  const upd = await sb
    .from("kiosks")
    .update(patch)
    .eq("id", args.kioskId)
    .select("*")
    .single();
  if (upd.error) throw new Error(upd.error.message);
  return mapKiosk(upd.data as KioskRow);
}

export async function sbGetKioskSession(kioskId: string): Promise<{
  kioskId: string;
  userId: string;
  nombre: string;
  packageStatus: PackageStatus;
  assignedAt: string | null;
  deliveryId: string | null;
} | null> {
  const sb = getSupabaseAdmin();
  const kioskRes = await sb.from("kiosks").select("*").eq("id", kioskId).single();
  if (kioskRes.error) throw new Error(kioskRes.error.message);
  const kiosk = kioskRes.data as KioskRow;

  let entryRes = await sb
    .from("check_ins")
    .select("*")
    .eq("kiosk_id", kioskId)
    .in("status", ["assigned", "in_session"])
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (entryRes.error) throw new Error(entryRes.error.message);
  let entry = entryRes.data as CheckInRow | null;

  const userId = entry?.user_id ?? kiosk.current_user_id;
  if (!userId) return null;

  if (!entry && kiosk.current_user_id) {
    entryRes = await sb
      .from("check_ins")
      .select("*")
      .eq("user_id", kiosk.current_user_id)
      .in("status", ["assigned", "in_session"])
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (entryRes.error) throw new Error(entryRes.error.message);
    entry = entryRes.data as CheckInRow | null;
  }

  const pkgRes = await sb
    .from("attendee_packages")
    .select("package_status")
    .eq("user_id", userId)
    .maybeSingle();
  if (pkgRes.error) throw new Error(pkgRes.error.message);

  const delRes = await sb
    .from("deliveries")
    .select("id")
    .eq("kiosk_id", kioskId)
    .eq("user_id", userId)
    .order("at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (delRes.error) throw new Error(delRes.error.message);

  return {
    kioskId: kiosk.id,
    userId,
    nombre: kiosk.current_nombre || entry?.nombre || userId,
    packageStatus:
      (pkgRes.data?.package_status as PackageStatus) ??
      entry?.package_status ??
      "missing",
    assignedAt: entry?.assigned_at ?? kiosk.last_delivery_at,
    deliveryId: (delRes.data?.id as string) ?? null,
  };
}

export async function sbSyncAttendeePackages(): Promise<{
  count: number;
  userIds: string[];
  removed: string[];
}> {
  // Packages are created/updated live via the webhook — no local roster to sync.
  const sb = getSupabaseAdmin();
  const existing = await sb.from("attendee_packages").select("user_id");
  if (existing.error) throw new Error(existing.error.message);
  const userIds = ((existing.data ?? []) as { user_id: string }[]).map(
    (r) => r.user_id
  );
  return { count: userIds.length, userIds, removed: [] };
}

export async function sbSeedDemoCheckIns(): Promise<QueueEntry[]> {
  // Demo seeding from local roster has been removed — data comes from real sources.
  return [];
}

export async function sbResetStore(): Promise<void> {
  const sb = getSupabaseAdmin();
  await sb.from("deliveries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await sb.from("check_ins").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await sb
    .from("kiosks")
    .update({
      busy: "free",
      current_user_id: null,
      current_nombre: null,
      screen: "attract",
      last_delivery_at: null,
    })
    .neq("id", "");
}

/** Assign (or clear) the LiveKit agent name for a kiosk. */
export async function sbSetKioskAgent(
  kioskId: string,
  agentId: string | null
): Promise<Kiosk> {
  const sb = getSupabaseAdmin();
  const upd = await sb
    .from("kiosks")
    .update({ agent_id: agentId })
    .eq("id", kioskId)
    .select("*")
    .single();
  if (upd.error) throw new Error(upd.error.message);
  return mapKiosk(upd.data as KioskRow);
}
