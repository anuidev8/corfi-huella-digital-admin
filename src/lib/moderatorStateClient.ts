/**
 * Browser-side moderator state from Supabase (no /api/state polling).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DeliveryLog,
  Kiosk,
  KioskPackage,
  ModeratorState,
  PackageStatus,
  QueueEntry,
  QueueStatus,
} from "@/lib/types";

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

export type KioskRow = {
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

export function mapKioskRow(row: KioskRow): Kiosk {
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

export async function fetchModeratorStateFromSupabase(
  sb: SupabaseClient
): Promise<ModeratorState> {
  const [queueRes, kioskRes, pkgRes, delRes] = await Promise.all([
    sb.from("check_ins").select("*").order("checked_in_at", { ascending: false }),
    sb.from("kiosks").select("*").order("id", { ascending: true }),
    sb.from("attendee_packages").select("*"),
    sb
      .from("deliveries")
      .select("*")
      .order("at", { ascending: false })
      .limit(40),
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
  const kiosks = ((kioskRes.data ?? []) as KioskRow[]).map(mapKioskRow);

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
    backend: "supabase",
  };
}
