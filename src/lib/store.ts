import {
  loadDemoCheckInSamples,
  loadKioskPackages,
} from "@/lib/attendeePackageSeed";
import type {
  CorfilinkCheckIn,
  DeliveryLog,
  Kiosk,
  KioskPackage,
  ModeratorState,
  QueueEntry,
} from "@/lib/types";

const EVENT_ID = "corfi-2026";
const OFFLINE_AFTER_MS = 45_000;

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function seedPackages(): Record<string, KioskPackage> {
  try {
    return loadKioskPackages();
  } catch {
    return {};
  }
}

const seedKiosks: Kiosk[] = [
  {
    id: "kiosk-01",
    label: "Kiosk 01",
    status: "online",
    busy: "free",
    currentUserId: null,
    currentNombre: null,
    screen: "attract",
    lastHeartbeatAt: nowIso(),
    lastDeliveryAt: null,
  },
  {
    id: "kiosk-02",
    label: "Kiosk 02",
    status: "online",
    busy: "free",
    currentUserId: null,
    currentNombre: null,
    screen: "attract",
    lastHeartbeatAt: nowIso(),
    lastDeliveryAt: null,
  },
  {
    id: "kiosk-03",
    label: "Kiosk 03",
    status: "offline",
    busy: "free",
    currentUserId: null,
    currentNombre: null,
    screen: null,
    lastHeartbeatAt: null,
    lastDeliveryAt: null,
  },
];

type Store = {
  queue: QueueEntry[];
  kiosks: Kiosk[];
  packages: Record<string, KioskPackage>;
  deliveries: DeliveryLog[];
};

declare global {
  // eslint-disable-next-line no-var
  var __huellaModeratorStore: Store | undefined;
}

function getStore(): Store {
  if (!globalThis.__huellaModeratorStore) {
    globalThis.__huellaModeratorStore = {
      queue: [],
      kiosks: structuredClone(seedKiosks),
      packages: structuredClone(seedPackages()),
      deliveries: [],
    };
  }
  return globalThis.__huellaModeratorStore;
}

function refreshKioskPresence(store: Store) {
  const cutoff = Date.now() - OFFLINE_AFTER_MS;
  for (const k of store.kiosks) {
    if (!k.lastHeartbeatAt) {
      k.status = "offline";
      continue;
    }
    const t = Date.parse(k.lastHeartbeatAt);
    k.status = Number.isFinite(t) && t >= cutoff ? "online" : "offline";
  }
}

function splitNombre(nombre: string): { firstName: string; lastName: string } {
  const parts = nombre.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1] ?? "",
  };
}

export function getModeratorState(): ModeratorState {
  const store = getStore();
  refreshKioskPresence(store);
  const queue = [...store.queue].sort((a, b) =>
    a.checkedInAt < b.checkedInAt ? 1 : -1
  );
  const kiosks = store.kiosks.map((k) => ({ ...k }));
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
    packages: { ...store.packages },
    deliveries: [...store.deliveries].slice(0, 40),
    updatedAt: nowIso(),
  };
}

/** What a kiosk polls — join key is userId → Supabase attendee_packages. */
export function getKioskSession(kioskId: string): {
  kioskId: string;
  userId: string;
  nombre: string;
  packageStatus: KioskPackage["packageStatus"];
  assignedAt: string | null;
  deliveryId: string | null;
} | null {
  const store = getStore();
  const kiosk = store.kiosks.find((k) => k.id === kioskId);
  if (!kiosk) return null;

  let entry = store.queue.find(
    (q) =>
      q.kioskId === kioskId &&
      (q.status === "assigned" || q.status === "in_session")
  );
  if (!entry && kiosk.currentUserId && kiosk.busy === "busy") {
    entry = store.queue.find(
      (q) =>
        q.userId === kiosk.currentUserId &&
        (q.status === "assigned" || q.status === "in_session")
    );
  }
  const userId = entry?.userId ?? kiosk.currentUserId;
  if (!userId) return null;

  const pkg = store.packages[userId];
  const lastDelivery = store.deliveries.find(
    (d) => d.kioskId === kioskId && d.userId === userId
  );

  return {
    kioskId: kiosk.id,
    userId,
    nombre: kiosk.currentNombre || entry?.nombre || userId,
    packageStatus: pkg?.packageStatus ?? entry?.packageStatus ?? "missing",
    assignedAt: entry?.assignedAt ?? kiosk.lastDeliveryAt,
    deliveryId: lastDelivery?.id ?? null,
  };
}

export function ingestCorfilinkCheckIn(payload: CorfilinkCheckIn): {
  entry: QueueEntry;
  created: boolean;
} {
  const store = getStore();
  const userId = payload.userId.trim();
  if (!userId) throw new Error("userId is required");

  const nombre = payload.nombre?.trim() || userId;
  const existing = store.queue.find(
    (q) =>
      q.userId === userId &&
      (q.status === "pending" || q.status === "assigned" || q.status === "in_session")
  );
  if (existing) {
    return { entry: { ...existing }, created: false };
  }

  const pkg = store.packages[userId];
  const { firstName, lastName } = splitNombre(nombre);

  if (!pkg) {
    store.packages[userId] = {
      userId,
      firstName,
      lastName,
      role: payload.cargo?.trim() || "—",
      company: payload.company?.trim() || "—",
      sector: "—",
      email: payload.email?.trim() || "",
      overallScore: 0,
      headline: "Paquete de análisis pendiente",
      packageStatus: "missing",
    };
  }

  const entry: QueueEntry = {
    id: uid("q"),
    userId,
    nombre,
    cargo: payload.cargo?.trim() || pkg?.role || "—",
    company: payload.company?.trim() || pkg?.company || "—",
    email: payload.email?.trim() || pkg?.email || "",
    eventId: payload.eventId?.trim() || EVENT_ID,
    status: "pending",
    packageStatus: store.packages[userId]?.packageStatus ?? "missing",
    kioskId: null,
    checkedInAt: payload.timestamp || nowIso(),
    assignedAt: null,
  };

  store.queue.unshift(entry);
  return { entry: { ...entry }, created: true };
}

export function assignToKiosk(args: {
  queueId: string;
  kioskId: string;
}): {
  entry: QueueEntry;
  kiosk: Kiosk;
  delivery: DeliveryLog;
  kioskPackage: KioskPackage;
} {
  const store = getStore();
  const entry = store.queue.find((q) => q.id === args.queueId);
  if (!entry) throw new Error("Queue entry not found");
  if (entry.status !== "pending" && entry.status !== "assigned") {
    throw new Error(`Cannot assign from status ${entry.status}`);
  }

  const kiosk = store.kiosks.find((k) => k.id === args.kioskId);
  if (!kiosk) throw new Error("Kiosk not found");
  if (kiosk.status !== "online") throw new Error("Kiosk is offline");
  if (kiosk.busy === "busy" && kiosk.currentUserId !== entry.userId) {
    throw new Error("Kiosk is busy");
  }

  // Release previous assignment if reassigning
  if (entry.kioskId && entry.kioskId !== kiosk.id) {
    const prev = store.kiosks.find((k) => k.id === entry.kioskId);
    if (prev && prev.currentUserId === entry.userId) {
      prev.busy = "free";
      prev.currentUserId = null;
      prev.currentNombre = null;
      prev.screen = "attract";
    }
  }

  const kioskPackage = store.packages[entry.userId];
  if (!kioskPackage) throw new Error("No package for user");

  entry.status = "assigned";
  entry.kioskId = kiosk.id;
  entry.assignedAt = nowIso();
  entry.packageStatus = kioskPackage.packageStatus;

  kiosk.busy = "busy";
  kiosk.currentUserId = entry.userId;
  kiosk.currentNombre = entry.nombre;
  kiosk.screen = "welcome";
  kiosk.lastDeliveryAt = nowIso();
  // Demo: treat assign as proof of delivery channel
  kiosk.lastHeartbeatAt = nowIso();
  kiosk.status = "online";

  const delivery: DeliveryLog = {
    id: uid("d"),
    at: nowIso(),
    userId: entry.userId,
    nombre: entry.nombre,
    kioskId: kiosk.id,
    kioskLabel: kiosk.label,
  };
  store.deliveries.unshift(delivery);

  return {
    entry: { ...entry },
    kiosk: { ...kiosk },
    delivery: { ...delivery },
    kioskPackage: { ...kioskPackage },
  };
}

export function releaseKiosk(kioskId: string, userId?: string | null): Kiosk {
  const store = getStore();
  const kiosk = store.kiosks.find((k) => k.id === kioskId);
  if (!kiosk) throw new Error("Kiosk not found");

  const uid = userId?.trim() || kiosk.currentUserId;
  const now = nowIso();
  if (uid) {
    const pkg = store.packages[uid];
    if (pkg) pkg.journeyCompletedAt = now;
    const entry = store.queue.find(
      (q) =>
        q.userId === uid &&
        (q.status === "assigned" || q.status === "in_session")
    );
    if (entry) {
      entry.status = "done";
      entry.kioskId = kiosk.id;
      entry.completedAt = now;
    }
  }

  kiosk.busy = "free";
  kiosk.currentUserId = null;
  kiosk.currentNombre = null;
  kiosk.screen = "attract";
  return { ...kiosk };
}

export function heartbeatKiosk(args: {
  kioskId: string;
  screen?: string | null;
  userId?: string | null;
}): Kiosk {
  const store = getStore();
  const kiosk = store.kiosks.find((k) => k.id === args.kioskId);
  if (!kiosk) throw new Error("Kiosk not found");

  kiosk.lastHeartbeatAt = nowIso();
  kiosk.status = "online";
  if (args.screen !== undefined) kiosk.screen = args.screen;
  // Never clear moderator assign from heartbeat — use releaseKiosk for that.
  if (args.userId) {
    kiosk.currentUserId = args.userId;
    kiosk.busy = "busy";
    const entry = store.queue.find(
      (q) =>
        q.userId === args.userId &&
        (q.status === "assigned" || q.status === "in_session")
    );
    if (entry) {
      entry.status = "in_session";
      if (entry.nombre) kiosk.currentNombre = entry.nombre;
    }
  }
  return { ...kiosk };
}

export function seedDemoCheckIns(): QueueEntry[] {
  return loadDemoCheckInSamples().map((s) => ingestCorfilinkCheckIn(s).entry);
}

export function syncAttendeePackages(): { count: number; userIds: string[] } {
  const store = getStore();
  store.packages = seedPackages();
  const userIds = Object.keys(store.packages);
  return { count: userIds.length, userIds };
}

export function resetStore() {
  globalThis.__huellaModeratorStore = {
    queue: [],
    kiosks: structuredClone(seedKiosks),
    packages: structuredClone(seedPackages()),
    deliveries: [],
  };
}
