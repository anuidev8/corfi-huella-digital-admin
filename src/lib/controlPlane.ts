import { isSupabaseConfigured } from "@/lib/supabase";
import * as memory from "@/lib/store";
import * as sb from "@/lib/supabaseStore";
import type { CorfilinkCheckIn, CorfilinkRawPayload } from "@/lib/types";
import type { AttendeeApiFull } from "@/lib/attendeesApiClient";
import type { ResolveResult } from "@/lib/supabaseStore";

export async function getModeratorState() {
  return isSupabaseConfigured()
    ? sb.sbGetModeratorState()
    : memory.getModeratorState();
}

export async function ingestCorfilinkCheckIn(
  payload: CorfilinkCheckIn,
  apiData?: AttendeeApiFull | null
) {
  return isSupabaseConfigured()
    ? sb.sbIngestCorfilinkCheckIn(payload, apiData)
    : memory.ingestCorfilinkCheckIn(payload);
}

/**
 * Resolve a raw totem payload to a known attendee_id before ingesting.
 * Falls back to a name-only match when Supabase is not configured.
 */
export async function resolveAttendeeIdentity(
  raw: CorfilinkRawPayload
): Promise<ResolveResult> {
  if (isSupabaseConfigured()) {
    return sb.sbResolveAttendeeIdentity(raw);
  }
  // In-memory fallback: try to match by userId in packages, then by name
  const store = memory.getModeratorState();
  const uid = raw.uidManilla.trim();
  const nombreRaw = raw.asistente.nombreCompleto.trim().toLowerCase();
  const empresa = raw.asistente.empresa?.trim() || "—";

  // Step 3-equivalent: direct_id match in packages
  if (store.packages[uid]) {
    const pkg = store.packages[uid];
    return {
      attendeeId: uid,
      nombre: [pkg.firstName, pkg.lastName].filter(Boolean).join(" ") || nombreRaw,
      company: pkg.company || empresa,
      resolvedBy: "direct_id",
    };
  }

  // Step 2-equivalent: name match in packages
  const nameMatch = Object.values(store.packages).find((pkg) => {
    const full = `${pkg.firstName} ${pkg.lastName}`.trim().toLowerCase();
    return full === nombreRaw;
  });
  if (nameMatch) {
    return {
      attendeeId: nameMatch.userId,
      nombre: [nameMatch.firstName, nameMatch.lastName].filter(Boolean).join(" "),
      company: nameMatch.company || empresa,
      resolvedBy: "name",
    };
  }

  return {
    attendeeId: uid || `unmatched_${Date.now()}`,
    nombre: raw.asistente.nombreCompleto.trim(),
    company: empresa,
    resolvedBy: "unmatched",
  };
}

export async function assignToKiosk(args: { queueId: string; kioskId: string }) {
  return isSupabaseConfigured()
    ? sb.sbAssignToKiosk(args)
    : memory.assignToKiosk(args);
}

export async function releaseKiosk(kioskId: string, userId?: string | null) {
  return isSupabaseConfigured()
    ? sb.sbReleaseKiosk(kioskId, userId)
    : memory.releaseKiosk(kioskId, userId);
}

export async function heartbeatKiosk(args: {
  kioskId: string;
  screen?: string | null;
  userId?: string | null;
}) {
  return isSupabaseConfigured()
    ? sb.sbHeartbeatKiosk(args)
    : memory.heartbeatKiosk(args);
}

export async function getKioskSession(kioskId: string) {
  return isSupabaseConfigured()
    ? sb.sbGetKioskSession(kioskId)
    : memory.getKioskSession(kioskId);
}

export async function seedDemoCheckIns() {
  return isSupabaseConfigured()
    ? sb.sbSeedDemoCheckIns()
    : memory.seedDemoCheckIns();
}

export async function resetStore() {
  if (isSupabaseConfigured()) {
    await sb.sbResetStore();
    return;
  }
  memory.resetStore();
}

export async function syncAttendeePackages() {
  return isSupabaseConfigured()
    ? sb.sbSyncAttendeePackages()
    : memory.syncAttendeePackages();
}

export async function setKioskAgent(kioskId: string, agentId: string | null) {
  return isSupabaseConfigured()
    ? sb.sbSetKioskAgent(kioskId, agentId)
    : memory.setKioskAgent(kioskId, agentId);
}

export { isSupabaseConfigured };
