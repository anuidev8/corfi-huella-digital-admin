"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ModeratorState, QueueEntry } from "@/lib/types";
import {
  getBrowserSupabase,
  isBrowserSupabaseConfigured,
} from "@/lib/supabaseBrowser";
import {
  fetchModeratorStateFromSupabase,
  mapKioskRow,
  type KioskRow,
} from "@/lib/moderatorStateClient";

/** Coalesce queue/delivery Realtime bursts into one refresh. */
const REFRESH_DEBOUNCE_MS = 800;
/** Only when Realtime is unavailable in the browser. */
const POLL_FALLBACK_MS = 60_000;

async function fetchState(): Promise<ModeratorState> {
  const res = await fetch("/api/state", { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar el estado");
  return res.json() as Promise<ModeratorState>;
}

function timeAgo(iso: string) {
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

function StatusPill({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "bad" | "muted" | "info";
  children: React.ReactNode;
}) {
  const map = {
    ok: "bg-emerald-100 text-emerald-900",
    warn: "bg-amber-100 text-amber-950",
    bad: "bg-rose-100 text-rose-900",
    muted: "bg-stone-200 text-stone-700",
    info: "bg-sky-100 text-sky-950",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${map[tone]}`}
    >
      {children}
    </span>
  );
}

export function ModeratorBoard() {
  const [state, setState] = useState<ModeratorState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [realtimeOk, setRealtimeOk] = useState<boolean | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const realtimeOkRef = useRef<boolean | null>(null);
  realtimeOkRef.current = realtimeOk;

  const loadState = useCallback(async () => {
    const sb = getBrowserSupabase();
    if (sb) {
      return fetchModeratorStateFromSupabase(sb);
    }
    return fetchState();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await loadState();
      setState(next);
      setError(null);
    } catch (e) {
    setError(e instanceof Error ? e.message : "Error al cargar");
    }
  }, [loadState]);

  const patchKioskFromRealtime = useCallback((row: KioskRow) => {
    const mapped = mapKioskRow(row);
    setState((prev) => {
      if (!prev) return prev;
      const kiosks = prev.kiosks.map((k) =>
        k.id === mapped.id ? mapped : k
      );
      return { ...prev, kiosks, updatedAt: new Date().toISOString() };
    });
  }, []);

  const scheduleRefresh = useCallback(
    (delayMs = REFRESH_DEBOUNCE_MS) => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null;
        void refresh();
      }, delayMs);
    },
    [refresh]
  );

  useEffect(() => {
    void refresh();

    const sb = getBrowserSupabase();
    if (!sb) {
      setRealtimeOk(false);
      const id = window.setInterval(() => void refresh(), POLL_FALLBACK_MS);
      return () => window.clearInterval(id);
    }

    const channel = sb
      .channel("moderator-board")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "check_ins" },
        () => {
          if (realtimeOkRef.current === false) return;
          scheduleRefresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deliveries" },
        () => {
          if (realtimeOkRef.current === false) return;
          scheduleRefresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendee_packages" },
        () => {
          if (realtimeOkRef.current === false) return;
          scheduleRefresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kiosks" },
        (payload) => {
          if (realtimeOkRef.current === false) return;
          const row = payload.new as KioskRow | null;
          if (row?.id) patchKioskFromRealtime(row);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          realtimeOkRef.current = true;
          setRealtimeOk(true);
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          realtimeOkRef.current = false;
          setRealtimeOk(false);
        }
      });

    return () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
      void sb.removeChannel(channel);
    };
  }, [refresh, scheduleRefresh, patchKioskFromRealtime]);

  useEffect(() => {
    if (realtimeOk !== false) return;
    const id = window.setInterval(() => void refresh(), POLL_FALLBACK_MS);
    return () => window.clearInterval(id);
  }, [realtimeOk, refresh]);

  const pending = useMemo(
    () => state?.queue.filter((q) => q.status === "pending") ?? [],
    [state]
  );
  const assigned = useMemo(
    () =>
      state?.queue.filter(
        (q) => q.status === "assigned" || q.status === "in_session"
      ) ?? [],
    [state]
  );
  const completed = useMemo(() => {
    const fromQueue =
      state?.queue.filter((q) => q.status === "done") ?? [];
    const doneIds = new Set(fromQueue.map((q) => q.userId));
    const fromPackages: QueueEntry[] = [];

    if (state?.packages) {
      for (const pkg of Object.values(state.packages)) {
        if (!pkg.journeyCompletedAt || doneIds.has(pkg.userId)) continue;
        fromPackages.push({
          id: `pkg-${pkg.userId}`,
          userId: pkg.userId,
          nombre: [pkg.firstName, pkg.lastName].filter(Boolean).join(" "),
          cargo: pkg.role,
          company: pkg.company,
          email: pkg.email,
          eventId: "corfi-2026",
          status: "done",
          packageStatus: pkg.packageStatus,
          kioskId: null,
          checkedInAt: pkg.journeyCompletedAt,
          assignedAt: null,
          completedAt: pkg.journeyCompletedAt,
        });
      }
    }

    return [...fromQueue, ...fromPackages].sort(
      (a, b) =>
        Date.parse(b.completedAt ?? b.checkedInAt) -
        Date.parse(a.completedAt ?? a.checkedInAt)
    );
  }, [state]);

  async function runAction(
    key: string,
    fn: () => Promise<Response>,
    okMessage?: string
  ) {
    setBusyKey(key);
    setNotice(null);
    try {
      const res = await fn();
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        count?: number;
        action?: string;
        removed?: string[];
        packages?: { count: number; removed?: string[] };
        checkIns?: number;
      };
      if (!res.ok) throw new Error(data.error || "Solicitud fallida");
      const defaultNotice =
        data.action === "sync-all" && data.packages?.count != null
          ?       `Sincronizados ${data.packages.count} paquetes` +
            (data.packages.removed?.length
              ? `, eliminados ${data.packages.removed.length} obsoletos`
              : "") +
            (data.checkIns != null ? ` · ${data.checkIns} en cola` : "")
          : data.action === "sync-packages" && data.count != null
            ? `Sincronizados ${data.count} paquetes de asistentes` +
              (data.removed?.length ? ` (eliminados ${data.removed.length} obsoletos)` : "")
            : "OK";
      setNotice(okMessage || data.message || defaultNotice);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Acción fallida");
    } finally {
      setBusyKey(null);
    }
  }

  function assign(entry: QueueEntry, kioskId: string) {
    void runAction(
      `assign-${entry.id}-${kioskId}`,
      () =>
        fetch("/api/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queueId: entry.id, kioskId }),
        }),
      `Enviado a ${kioskId}`
    );
  }

  const freeOnline =
    state?.kiosks.filter((k) => k.status === "online" && k.busy === "free") ??
    [];

  const roster = useMemo(() => {
    if (!state?.packages) return [];
    return Object.values(state.packages)
      .map((pkg) => ({
        userId: pkg.userId,
        nombre: [pkg.firstName, pkg.lastName].filter(Boolean).join(" "),
        company: pkg.company,
        packageStatus: pkg.packageStatus,
      }))
      .sort((a, b) => a.userId.localeCompare(b.userId));
  }, [state]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-300 pb-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-stone-500 uppercase">
            Huella Digital · Evento
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-900">
            Moderador
          </h1>
          <p className="mt-1 max-w-xl text-sm text-stone-600">
            Los check-ins de Corfilink llegan a la cola. Asigna un kiosco libre
            para enviar el paquete listo a ese dispositivo
            {state?.backend ? (
              <>
                {" "}
                · backend <code className="text-xs">{state.backend}</code>
                {state.backend === "supabase" ? (
                  <>
                    {" "}
                    ·{" "}
                    {realtimeOk === true ? (
                      <span className="text-emerald-700">realtime</span>
                    ) : realtimeOk === false ? (
                      <span className="text-amber-700">
                        sondeo de respaldo
                        {!isBrowserSupabaseConfigured()
                          ? " (define NEXT_PUBLIC_SUPABASE_* y reinicia)"
                          : null}
                      </span>
                    ) : (
                      <span className="text-stone-500">conectando…</span>
                    )}
                  </>
                ) : null}
              </>
            ) : null}
            .
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busyKey !== null}
            onClick={() =>
              void runAction("sync-all", () =>
                fetch("/api/demo", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "sync-all" }),
                })
              )
            }
            className="rounded border border-emerald-500 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-100 disabled:opacity-50"
          >
            Sincronizar lista + cola
          </button>
          <button
            type="button"
            disabled={busyKey !== null}
            onClick={() =>
              void runAction("seed", () =>
                fetch("/api/demo", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "seed" }),
                })
              )
            }
            className="rounded border border-stone-400 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
          >
            Simular Corfilink
          </button>
          <button
            type="button"
            disabled={busyKey !== null}
            onClick={() =>
              void runAction("reset", () =>
                fetch("/api/demo", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "reset" }),
                })
              )
            }
            className="rounded border border-stone-300 bg-stone-100 px-3 py-2 text-sm text-stone-700 hover:bg-stone-200 disabled:opacity-50"
          >
            Reiniciar
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800"
          >
            Actualizar
          </button>
        </div>
      </header>

      {(error || notice) && (
        <div className="flex flex-wrap gap-2">
          {error && (
            <p className="rounded bg-rose-100 px-3 py-2 text-sm text-rose-900">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded bg-emerald-100 px-3 py-2 text-sm text-emerald-950">
              {notice}
            </p>
          )}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="En espera" value={String(pending.length)} />
        <StatCard label="En sesión" value={String(assigned.length)} />
        <StatCard label="Registrados" value={String(completed.length)} />
        <StatCard
          label="Kioscos libres"
          value={String(freeOnline.length)}
          hint={`${state?.kiosks.filter((k) => k.status === "online").length ?? 0} en línea`}
        />
      </section>

      <div className="grid flex-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-stone-300 bg-white">
          <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
            <h2 className="text-sm font-semibold tracking-wide text-stone-800 uppercase">
              Cola
            </h2>
            <span className="text-xs text-stone-500">
              Actualizado hace {state ? timeAgo(state.updatedAt) : "—"}
            </span>
          </div>

          {pending.length === 0 && assigned.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-stone-500">
              Aún no hay check-ins. Usa &quot;Simular Corfilink&quot; o envía un POST a{" "}
              <code className="rounded bg-stone-100 px-1 text-xs">
                /api/webhooks/corfilink
              </code>
              .
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {[...pending, ...assigned].map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-stone-900">
                        {entry.nombre}
                      </p>
                      <StatusPill
                        tone={
                          entry.status === "pending"
                            ? "warn"
                            : entry.status === "assigned"
                              ? "info"
                              : entry.status === "done"
                                ? "ok"
                                : "ok"
                        }
                      >
                      {entry.status === "done" ? "registrado" : entry.status === "pending" ? "pendiente" : entry.status === "assigned" ? "asignado" : entry.status === "in_session" ? "en sesión" : entry.status}
                      </StatusPill>
                      <StatusPill
                        tone={
                          entry.packageStatus === "ready" ? "ok" : "bad"
                        }
                      >
                      package {entry.packageStatus === "ready" ? "listo" : entry.packageStatus === "missing" ? "faltante" : entry.packageStatus}
                      </StatusPill>
                    </div>
                    <p className="mt-1 truncate text-sm text-stone-600">
                      {entry.cargo}
                      {entry.company !== "—" ? ` · ${entry.company}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-400">
                      {entry.userId} · check-in hace {timeAgo(entry.checkedInAt)}{" "}
                      {entry.kioskId ? ` · → ${entry.kioskId}` : ""}
                    </p>
                  </div>

                  {entry.status === "pending" && (
                    <div className="flex flex-wrap gap-2">
                      {freeOnline.length === 0 ? (
                        <span className="text-xs text-stone-500">
                          Sin kioscos libres en línea
                        </span>
                      ) : (
                        freeOnline.map((k) => (
                          <button
                            key={k.id}
                            type="button"
                            disabled={busyKey !== null}
                            title={
                              entry.packageStatus === "missing"
                                ? `Enviar paquete provisional a ${k.label} (análisis faltante)`
                                : `Enviar a ${k.label}`
                            }
                            onClick={() => assign(entry, k.id)}
                            className="rounded bg-teal-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            → {k.label}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {completed.length > 0 ? (
          <section className="rounded-lg border border-stone-300 bg-white lg:col-span-2">
            <div className="border-b border-stone-200 px-4 py-3">
              <h2 className="text-sm font-semibold tracking-wide text-stone-800 uppercase">
                Registrados
              </h2>
            </div>
            <ul className="divide-y divide-stone-100">
              {completed.slice(0, 12).map((entry) => (
                <li key={entry.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-stone-900">{entry.nombre}</p>
                    <StatusPill tone="ok">registrado</StatusPill>
                  </div>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {entry.userId}
                    {entry.completedAt
                      ? ` · completado hace ${timeAgo(entry.completedAt)}`
                      : ""}
                    {entry.kioskId ? ` · ${entry.kioskId}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="flex flex-col gap-6">
        <section className="rounded-lg border border-stone-300 bg-white">
            <div className="border-b border-stone-200 px-4 py-3">
              <h2 className="text-sm font-semibold tracking-wide text-stone-800 uppercase">
                Dispositivos
              </h2>
            </div>
            <ul className="divide-y divide-stone-100">
              {(state?.kiosks ?? []).map((k) => (
                <li
                  key={k.id}
                  className="flex items-start justify-between gap-3 px-4 py-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-stone-900">{k.label}</p>
                      <StatusPill
                        tone={k.status === "online" ? "ok" : "bad"}
                      >
                        {k.status === "online" ? "en línea" : k.status === "offline" ? "desconectado" : k.status}
                      </StatusPill>
                      <StatusPill
                        tone={k.busy === "free" ? "muted" : "info"}
                      >
                        {k.busy === "free" ? "libre" : k.busy === "busy" ? "ocupado" : k.busy}
                      </StatusPill>
                    </div>
                    <p className="mt-1 text-sm text-stone-600">
                      {k.currentNombre
                        ? `${k.currentNombre}`
                        : "Sin sesión"}
                      {k.screen ? ` · pantalla: ${k.screen}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-400">
                      latido{" "}
                      {k.lastHeartbeatAt
                        ? `hace ${timeAgo(k.lastHeartbeatAt)}`
                        : "nunca"}
                      {k.lastDeliveryAt
                        ? ` · última entrega hace ${timeAgo(k.lastDeliveryAt)}`
                        : ""}
                    </p>

                  </div>
                  {k.busy === "busy" && (
                    <button
                      type="button"
                      disabled={busyKey !== null}
                      onClick={() =>
                        void runAction(`release-${k.id}`, () =>
                          fetch("/api/release", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ kioskId: k.id }),
                          })
                        )
                      }
                      className="shrink-0 rounded border border-stone-400 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                    >
                      Liberar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-stone-300 bg-white">
            <div className="border-b border-stone-200 px-4 py-3">
              <h2 className="text-sm font-semibold tracking-wide text-stone-800 uppercase">
                Registro de entregas
              </h2>
            </div>
            {(state?.deliveries.length ?? 0) === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-stone-500">
                Las asignaciones aparecerán aquí cuando un paquete sea enviado a un
                dispositivo.
              </p>
            ) : (
              <ul className="max-h-56 divide-y divide-stone-100 overflow-auto">
                {state!.deliveries.map((d) => (
                  <li key={d.id} className="px-4 py-3 text-sm">
                    <p className="font-medium text-stone-900">
                      {d.nombre} → {d.kioskLabel}
                    </p>
                    <p className="text-xs text-stone-500">
                      {d.userId} · hace {timeAgo(d.at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <section className="rounded-lg border border-stone-300 bg-white">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <h2 className="text-sm font-semibold tracking-wide text-stone-800 uppercase">
            Lista de la app
          </h2>
          <span className="text-xs text-stone-500">
              {roster.length} paquetes · Supabase attendee_packages
          </span>
        </div>
        {roster.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-stone-500">
              Aún no hay paquetes. Haz clic en &quot;Sincronizar lista + cola&quot; para cargar desde{" "}
              <code className="rounded bg-stone-100 px-1">data/roster.json</code>{" "}
              en Supabase.
            </p>
        ) : (
          <ul className="grid gap-px bg-stone-100 sm:grid-cols-2 lg:grid-cols-4">
            {roster.map((person) => (
              <li key={person.userId} className="bg-white px-4 py-3">
                <p className="font-medium text-stone-900">{person.nombre}</p>
                <p className="mt-0.5 font-mono text-xs text-stone-500">
                  {person.userId}
                </p>
                <p className="mt-1 truncate text-xs text-stone-600">
                  {person.company}
                </p>
                <div className="mt-2">
                  <StatusPill
                    tone={person.packageStatus === "ready" ? "ok" : "bad"}
                  >
                    paquete {person.packageStatus === "ready" ? "listo" : person.packageStatus === "missing" ? "faltante" : person.packageStatus}
                  </StatusPill>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}


function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-stone-300 bg-white px-4 py-3">
      <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-stone-900">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}
