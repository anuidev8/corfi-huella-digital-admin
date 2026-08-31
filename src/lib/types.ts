/** Shared domain types for moderator queue ↔ kiosk assignment. */

export type QueueStatus =
  | "pending"
  | "assigned"
  | "in_session"
  | "done"
  | "cancelled";

export type PackageStatus = "ready" | "missing";

export type KioskStatus = "online" | "offline";
export type KioskBusy = "free" | "busy";

/** Thin Corfilink check-in (band / totem). */
export type CorfilinkCheckIn = {
  userId: string;
  nombre: string;
  cargo?: string;
  company?: string;
  email?: string;
  eventId?: string;
  timestamp?: string;
};

/**
 * Raw payload emitted by physical Corfilink totem devices.
 * Distinct from the legacy CorfilinkCheckIn used internally.
 */
export type CorfilinkRawPayload = {
  uidManilla: string;
  readerId?: string;
  timestamp?: string;
  asistente: {
    nombreCompleto: string;
    empresa?: string;
    cargo?: string;
    email?: string;
  };
};

/**
 * How the attendee was resolved from the raw totem payload.
 * "wristband" = matched by NFC UID, "name" = fallback name match,
 * "direct_id" = uidManilla was already a known attendee_id,
 * "unmatched" = no match found, stub created for moderator review.
 */
export type ResolvedBy = "wristband" | "name" | "direct_id" | "unmatched";

/** Precomputed kiosk journey payload (aligned with huella-digital Attendee). */
export type KioskPackage = {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
  company: string;
  sector: string;
  email: string;
  overallScore: number;
  headline: string;
  packageStatus: PackageStatus;
  journeyCompletedAt?: string | null;
};

export type QueueEntry = {
  id: string;
  userId: string;
  nombre: string;
  cargo: string;
  company: string;
  email: string;
  eventId: string;
  status: QueueStatus;
  packageStatus: PackageStatus;
  kioskId: string | null;
  checkedInAt: string;
  assignedAt: string | null;
  completedAt?: string | null;
};

export type Kiosk = {
  id: string;
  label: string;
  status: KioskStatus;
  busy: KioskBusy;
  currentUserId: string | null;
  currentNombre: string | null;
  screen: string | null;
  lastHeartbeatAt: string | null;
  /** Last package pushed to this device (demo delivery log). */
  lastDeliveryAt: string | null;
};

export type DeliveryLog = {
  id: string;
  at: string;
  userId: string;
  nombre: string;
  kioskId: string;
  kioskLabel: string;
};

export type ModeratorState = {
  queue: QueueEntry[];
  kiosks: Kiosk[];
  packages: Record<string, KioskPackage>;
  deliveries: DeliveryLog[];
  updatedAt: string;
  backend?: "supabase" | "memory";
};
