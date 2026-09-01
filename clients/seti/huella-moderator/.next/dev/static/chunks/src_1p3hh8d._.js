(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/ModeratorBoard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ModeratorBoard",
    ()=>ModeratorBoard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/types.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabaseBrowser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabaseBrowser.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$moderatorStateClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/moderatorStateClient.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
/** Coalesce queue/delivery Realtime bursts into one refresh. */ const REFRESH_DEBOUNCE_MS = 800;
/** Only when Realtime is unavailable in the browser. */ const POLL_FALLBACK_MS = 60_000;
async function fetchState() {
    const res = await fetch("/api/state", {
        cache: "no-store"
    });
    if (!res.ok) throw new Error("Error al cargar el estado");
    return res.json();
}
function timeAgo(iso) {
    const ms = Date.now() - Date.parse(iso);
    if (!Number.isFinite(ms) || ms < 0) return "—";
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h`;
}
function StatusPill({ tone, children }) {
    const map = {
        ok: "bg-emerald-100 text-emerald-900",
        warn: "bg-amber-100 text-amber-950",
        bad: "bg-rose-100 text-rose-900",
        muted: "bg-stone-200 text-stone-700",
        info: "bg-sky-100 text-sky-950"
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: `inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${map[tone]}`,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/ModeratorBoard.tsx",
        lineNumber: 52,
        columnNumber: 5
    }, this);
}
_c = StatusPill;
function ModeratorBoard() {
    _s();
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [busyKey, setBusyKey] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [notice, setNotice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [realtimeOk, setRealtimeOk] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const refreshTimerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const realtimeOkRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    realtimeOkRef.current = realtimeOk;
    const loadState = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ModeratorBoard.useCallback[loadState]": async ()=>{
            const sb = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabaseBrowser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBrowserSupabase"])();
            if (sb) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$moderatorStateClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchModeratorStateFromSupabase"])(sb);
            }
            return fetchState();
        }
    }["ModeratorBoard.useCallback[loadState]"], []);
    const refresh = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ModeratorBoard.useCallback[refresh]": async ()=>{
            try {
                const next = await loadState();
                setState(next);
                setError(null);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Error al cargar");
            }
        }
    }["ModeratorBoard.useCallback[refresh]"], [
        loadState
    ]);
    const patchKioskFromRealtime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ModeratorBoard.useCallback[patchKioskFromRealtime]": (row)=>{
            const mapped = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$moderatorStateClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mapKioskRow"])(row);
            setState({
                "ModeratorBoard.useCallback[patchKioskFromRealtime]": (prev)=>{
                    if (!prev) return prev;
                    const kiosks = prev.kiosks.map({
                        "ModeratorBoard.useCallback[patchKioskFromRealtime].kiosks": (k)=>k.id === mapped.id ? mapped : k
                    }["ModeratorBoard.useCallback[patchKioskFromRealtime].kiosks"]);
                    return {
                        ...prev,
                        kiosks,
                        updatedAt: new Date().toISOString()
                    };
                }
            }["ModeratorBoard.useCallback[patchKioskFromRealtime]"]);
        }
    }["ModeratorBoard.useCallback[patchKioskFromRealtime]"], []);
    const scheduleRefresh = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ModeratorBoard.useCallback[scheduleRefresh]": (delayMs = REFRESH_DEBOUNCE_MS)=>{
            if (refreshTimerRef.current) {
                window.clearTimeout(refreshTimerRef.current);
            }
            refreshTimerRef.current = window.setTimeout({
                "ModeratorBoard.useCallback[scheduleRefresh]": ()=>{
                    refreshTimerRef.current = null;
                    void refresh();
                }
            }["ModeratorBoard.useCallback[scheduleRefresh]"], delayMs);
        }
    }["ModeratorBoard.useCallback[scheduleRefresh]"], [
        refresh
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ModeratorBoard.useEffect": ()=>{
            void refresh();
            const sb = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabaseBrowser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBrowserSupabase"])();
            if (!sb) {
                setRealtimeOk(false);
                const id = window.setInterval({
                    "ModeratorBoard.useEffect.id": ()=>void refresh()
                }["ModeratorBoard.useEffect.id"], POLL_FALLBACK_MS);
                return ({
                    "ModeratorBoard.useEffect": ()=>window.clearInterval(id)
                })["ModeratorBoard.useEffect"];
            }
            const channel = sb.channel("moderator-board").on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "check_ins"
            }, {
                "ModeratorBoard.useEffect.channel": ()=>{
                    if (realtimeOkRef.current === false) return;
                    scheduleRefresh();
                }
            }["ModeratorBoard.useEffect.channel"]).on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "deliveries"
            }, {
                "ModeratorBoard.useEffect.channel": ()=>{
                    if (realtimeOkRef.current === false) return;
                    scheduleRefresh();
                }
            }["ModeratorBoard.useEffect.channel"]).on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "attendee_packages"
            }, {
                "ModeratorBoard.useEffect.channel": ()=>{
                    if (realtimeOkRef.current === false) return;
                    scheduleRefresh();
                }
            }["ModeratorBoard.useEffect.channel"]).on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "kiosks"
            }, {
                "ModeratorBoard.useEffect.channel": (payload)=>{
                    if (realtimeOkRef.current === false) return;
                    const row = payload.new;
                    if (row?.id) patchKioskFromRealtime(row);
                }
            }["ModeratorBoard.useEffect.channel"]).subscribe({
                "ModeratorBoard.useEffect.channel": (status)=>{
                    if (status === "SUBSCRIBED") {
                        realtimeOkRef.current = true;
                        setRealtimeOk(true);
                    }
                    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                        realtimeOkRef.current = false;
                        setRealtimeOk(false);
                    }
                }
            }["ModeratorBoard.useEffect.channel"]);
            return ({
                "ModeratorBoard.useEffect": ()=>{
                    if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
                    void sb.removeChannel(channel);
                }
            })["ModeratorBoard.useEffect"];
        }
    }["ModeratorBoard.useEffect"], [
        refresh,
        scheduleRefresh,
        patchKioskFromRealtime
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ModeratorBoard.useEffect": ()=>{
            if (realtimeOk !== false) return;
            const id = window.setInterval({
                "ModeratorBoard.useEffect.id": ()=>void refresh()
            }["ModeratorBoard.useEffect.id"], POLL_FALLBACK_MS);
            return ({
                "ModeratorBoard.useEffect": ()=>window.clearInterval(id)
            })["ModeratorBoard.useEffect"];
        }
    }["ModeratorBoard.useEffect"], [
        realtimeOk,
        refresh
    ]);
    const pending = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ModeratorBoard.useMemo[pending]": ()=>state?.queue.filter({
                "ModeratorBoard.useMemo[pending]": (q)=>q.status === "pending"
            }["ModeratorBoard.useMemo[pending]"]) ?? []
    }["ModeratorBoard.useMemo[pending]"], [
        state
    ]);
    const assigned = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ModeratorBoard.useMemo[assigned]": ()=>state?.queue.filter({
                "ModeratorBoard.useMemo[assigned]": (q)=>q.status === "assigned" || q.status === "in_session"
            }["ModeratorBoard.useMemo[assigned]"]) ?? []
    }["ModeratorBoard.useMemo[assigned]"], [
        state
    ]);
    const completed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ModeratorBoard.useMemo[completed]": ()=>{
            const fromQueue = state?.queue.filter({
                "ModeratorBoard.useMemo[completed]": (q)=>q.status === "done"
            }["ModeratorBoard.useMemo[completed]"]) ?? [];
            const doneIds = new Set(fromQueue.map({
                "ModeratorBoard.useMemo[completed]": (q)=>q.userId
            }["ModeratorBoard.useMemo[completed]"]));
            const fromPackages = [];
            if (state?.packages) {
                for (const pkg of Object.values(state.packages)){
                    if (!pkg.journeyCompletedAt || doneIds.has(pkg.userId)) continue;
                    fromPackages.push({
                        id: `pkg-${pkg.userId}`,
                        userId: pkg.userId,
                        nombre: [
                            pkg.firstName,
                            pkg.lastName
                        ].filter(Boolean).join(" "),
                        cargo: pkg.role,
                        company: pkg.company,
                        email: pkg.email,
                        eventId: "corfi-2026",
                        status: "done",
                        packageStatus: pkg.packageStatus,
                        kioskId: null,
                        checkedInAt: pkg.journeyCompletedAt,
                        assignedAt: null,
                        completedAt: pkg.journeyCompletedAt
                    });
                }
            }
            return [
                ...fromQueue,
                ...fromPackages
            ].sort({
                "ModeratorBoard.useMemo[completed]": (a, b)=>Date.parse(b.completedAt ?? b.checkedInAt) - Date.parse(a.completedAt ?? a.checkedInAt)
            }["ModeratorBoard.useMemo[completed]"]);
        }
    }["ModeratorBoard.useMemo[completed]"], [
        state
    ]);
    async function runAction(key, fn, okMessage) {
        setBusyKey(key);
        setNotice(null);
        try {
            const res = await fn();
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Solicitud fallida");
            const defaultNotice = data.action === "sync-all" && data.packages?.count != null ? `Sincronizados ${data.packages.count} paquetes` + (data.packages.removed?.length ? `, eliminados ${data.packages.removed.length} obsoletos` : "") + (data.checkIns != null ? ` · ${data.checkIns} en cola` : "") : data.action === "sync-packages" && data.count != null ? `Sincronizados ${data.count} paquetes de asistentes` + (data.removed?.length ? ` (eliminados ${data.removed.length} obsoletos)` : "") : "OK";
            setNotice(okMessage || data.message || defaultNotice);
            await refresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Acción fallida");
        } finally{
            setBusyKey(null);
        }
    }
    function assign(entry, kioskId) {
        void runAction(`assign-${entry.id}-${kioskId}`, ()=>fetch("/api/assign", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    queueId: entry.id,
                    kioskId
                })
            }), `Enviado a ${kioskId}`);
    }
    const freeOnline = state?.kiosks.filter((k)=>k.status === "online" && k.busy === "free") ?? [];
    const roster = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ModeratorBoard.useMemo[roster]": ()=>{
            if (!state?.packages) return [];
            return Object.values(state.packages).map({
                "ModeratorBoard.useMemo[roster]": (pkg)=>({
                        userId: pkg.userId,
                        nombre: [
                            pkg.firstName,
                            pkg.lastName
                        ].filter(Boolean).join(" "),
                        company: pkg.company,
                        packageStatus: pkg.packageStatus
                    })
            }["ModeratorBoard.useMemo[roster]"]).sort({
                "ModeratorBoard.useMemo[roster]": (a, b)=>a.userId.localeCompare(b.userId)
            }["ModeratorBoard.useMemo[roster]"]);
        }
    }["ModeratorBoard.useMemo[roster]"], [
        state
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "flex flex-wrap items-end justify-between gap-4 border-b border-stone-300 pb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs font-semibold tracking-[0.2em] text-stone-500 uppercase",
                                children: "Huella Digital · Evento"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                lineNumber: 297,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "mt-1 text-3xl font-semibold tracking-tight text-stone-900",
                                children: "Moderador"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                lineNumber: 300,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 max-w-xl text-sm text-stone-600",
                                children: [
                                    "Los check-ins de Corfilink llegan a la cola. Asigna un kiosco libre para enviar el paquete listo a ese dispositivo",
                                    state?.backend ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            " ",
                                            "· backend ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                                className: "text-xs",
                                                children: state.backend
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                lineNumber: 309,
                                                columnNumber: 27
                                            }, this),
                                            state.backend === "supabase" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                children: [
                                                    " ",
                                                    "·",
                                                    " ",
                                                    realtimeOk === true ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-emerald-700",
                                                        children: "realtime"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                        lineNumber: 315,
                                                        columnNumber: 23
                                                    }, this) : realtimeOk === false ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-amber-700",
                                                        children: [
                                                            "sondeo de respaldo",
                                                            !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabaseBrowser$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isBrowserSupabaseConfigured"])() ? " (define NEXT_PUBLIC_SUPABASE_* y reinicia)" : null
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                        lineNumber: 317,
                                                        columnNumber: 23
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-stone-500",
                                                        children: "conectando…"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                        lineNumber: 324,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                lineNumber: 311,
                                                columnNumber: 19
                                            }, this) : null
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                        lineNumber: 307,
                                        columnNumber: 15
                                    }, this) : null,
                                    "."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                lineNumber: 303,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                        lineNumber: 296,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                disabled: busyKey !== null,
                                onClick: ()=>void runAction("sync-all", ()=>fetch("/api/demo", {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json"
                                            },
                                            body: JSON.stringify({
                                                action: "sync-all"
                                            })
                                        })),
                                className: "rounded border border-emerald-500 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-100 disabled:opacity-50",
                                children: "Sincronizar lista + cola"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                lineNumber: 334,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                disabled: busyKey !== null,
                                onClick: ()=>void runAction("seed", ()=>fetch("/api/demo", {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json"
                                            },
                                            body: JSON.stringify({
                                                action: "seed"
                                            })
                                        })),
                                className: "rounded border border-stone-400 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50",
                                children: "Simular Corfilink"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                lineNumber: 350,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                disabled: busyKey !== null,
                                onClick: ()=>void runAction("reset", ()=>fetch("/api/demo", {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json"
                                            },
                                            body: JSON.stringify({
                                                action: "reset"
                                            })
                                        })),
                                className: "rounded border border-stone-300 bg-stone-100 px-3 py-2 text-sm text-stone-700 hover:bg-stone-200 disabled:opacity-50",
                                children: "Reiniciar"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                lineNumber: 366,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>void refresh(),
                                className: "rounded bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800",
                                children: "Actualizar"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                lineNumber: 382,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                        lineNumber: 333,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ModeratorBoard.tsx",
                lineNumber: 295,
                columnNumber: 7
            }, this),
            (error || notice) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap gap-2",
                children: [
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "rounded bg-rose-100 px-3 py-2 text-sm text-rose-900",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                        lineNumber: 395,
                        columnNumber: 13
                    }, this),
                    notice && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "rounded bg-emerald-100 px-3 py-2 text-sm text-emerald-950",
                        children: notice
                    }, void 0, false, {
                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                        lineNumber: 400,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ModeratorBoard.tsx",
                lineNumber: 393,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                        label: "En espera",
                        value: String(pending.length)
                    }, void 0, false, {
                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                        lineNumber: 408,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                        label: "En sesión",
                        value: String(assigned.length)
                    }, void 0, false, {
                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                        lineNumber: 409,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                        label: "Registrados",
                        value: String(completed.length)
                    }, void 0, false, {
                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                        lineNumber: 410,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                        label: "Kioscos libres",
                        value: String(freeOnline.length),
                        hint: `${state?.kiosks.filter((k)=>k.status === "online").length ?? 0} en línea`
                    }, void 0, false, {
                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                        lineNumber: 411,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ModeratorBoard.tsx",
                lineNumber: 407,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid flex-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "rounded-lg border border-stone-300 bg-white",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between border-b border-stone-200 px-4 py-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-sm font-semibold tracking-wide text-stone-800 uppercase",
                                        children: "Cola"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                        lineNumber: 421,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-stone-500",
                                        children: [
                                            "Actualizado hace ",
                                            state ? timeAgo(state.updatedAt) : "—"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                        lineNumber: 424,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                lineNumber: 420,
                                columnNumber: 11
                            }, this),
                            pending.length === 0 && assigned.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "px-4 py-10 text-center text-sm text-stone-500",
                                children: [
                                    'Aún no hay check-ins. Usa "Simular Corfilink" o envía un POST a',
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                        className: "rounded bg-stone-100 px-1 text-xs",
                                        children: "/api/webhooks/corfilink"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                        lineNumber: 432,
                                        columnNumber: 15
                                    }, this),
                                    "."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                lineNumber: 430,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "divide-y divide-stone-100",
                                children: [
                                    ...pending,
                                    ...assigned
                                ].map((entry)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        className: "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "min-w-0",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex flex-wrap items-center gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "truncate font-medium text-stone-900",
                                                                children: entry.nombre
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                                lineNumber: 446,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                                                                tone: entry.status === "pending" ? "warn" : entry.status === "assigned" ? "info" : entry.status === "done" ? "ok" : "ok",
                                                                children: entry.status === "done" ? "registrado" : entry.status === "pending" ? "pendiente" : entry.status === "assigned" ? "asignado" : entry.status === "in_session" ? "en sesión" : entry.status
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                                lineNumber: 449,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                                                                tone: entry.packageStatus === "ready" ? "ok" : "bad",
                                                                children: [
                                                                    "package ",
                                                                    entry.packageStatus === "ready" ? "listo" : entry.packageStatus === "missing" ? "faltante" : entry.packageStatus
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                                lineNumber: 462,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                        lineNumber: 445,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "mt-1 truncate text-sm text-stone-600",
                                                        children: [
                                                            entry.cargo,
                                                            entry.company !== "—" ? ` · ${entry.company}` : ""
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                        lineNumber: 470,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "mt-0.5 text-xs text-stone-400",
                                                        children: [
                                                            entry.userId,
                                                            " · check-in hace ",
                                                            timeAgo(entry.checkedInAt),
                                                            " ",
                                                            entry.kioskId ? ` · → ${entry.kioskId}` : ""
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                        lineNumber: 474,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                lineNumber: 444,
                                                columnNumber: 19
                                            }, this),
                                            entry.status === "pending" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-wrap gap-2",
                                                children: freeOnline.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-xs text-stone-500",
                                                    children: "Sin kioscos libres en línea"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                    lineNumber: 483,
                                                    columnNumber: 25
                                                }, this) : freeOnline.map((k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        disabled: busyKey !== null,
                                                        title: entry.packageStatus === "missing" ? `Enviar paquete provisional a ${k.label} (análisis faltante)` : `Enviar a ${k.label}`,
                                                        onClick: ()=>assign(entry, k.id),
                                                        className: "rounded bg-teal-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40",
                                                        children: [
                                                            "→ ",
                                                            k.label
                                                        ]
                                                    }, k.id, true, {
                                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                        lineNumber: 488,
                                                        columnNumber: 27
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                lineNumber: 481,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, entry.id, true, {
                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                        lineNumber: 440,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                lineNumber: 438,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                        lineNumber: 419,
                        columnNumber: 9
                    }, this),
                    completed.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "rounded-lg border border-stone-300 bg-white lg:col-span-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "border-b border-stone-200 px-4 py-3",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-sm font-semibold tracking-wide text-stone-800 uppercase",
                                    children: "Registrados"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ModeratorBoard.tsx",
                                    lineNumber: 515,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                lineNumber: 514,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "divide-y divide-stone-100",
                                children: completed.slice(0, 12).map((entry)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        className: "px-4 py-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-wrap items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "font-medium text-stone-900",
                                                        children: entry.nombre
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                        lineNumber: 523,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                                                        tone: "ok",
                                                        children: "registrado"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                        lineNumber: 524,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                lineNumber: 522,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-0.5 text-xs text-stone-500",
                                                children: [
                                                    entry.userId,
                                                    entry.completedAt ? ` · completado hace ${timeAgo(entry.completedAt)}` : "",
                                                    entry.kioskId ? ` · ${entry.kioskId}` : ""
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                lineNumber: 526,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, entry.id, true, {
                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                        lineNumber: 521,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                lineNumber: 519,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                        lineNumber: 513,
                        columnNumber: 11
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "rounded-lg border border-stone-300 bg-white",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "border-b border-stone-200 px-4 py-3",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-sm font-semibold tracking-wide text-stone-800 uppercase",
                                            children: "Dispositivos"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/ModeratorBoard.tsx",
                                            lineNumber: 542,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                        lineNumber: 541,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "divide-y divide-stone-100",
                                        children: (state?.kiosks ?? []).map((k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                className: "flex items-start justify-between gap-3 px-4 py-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex flex-wrap items-center gap-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "font-medium text-stone-900",
                                                                        children: k.label
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                                        lineNumber: 554,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                                                                        tone: k.status === "online" ? "ok" : "bad",
                                                                        children: k.status === "online" ? "en línea" : k.status === "offline" ? "desconectado" : k.status
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                                        lineNumber: 555,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                                                                        tone: k.busy === "free" ? "muted" : "info",
                                                                        children: k.busy === "free" ? "libre" : k.busy === "busy" ? "ocupado" : k.busy
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                                        lineNumber: 560,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                                lineNumber: 553,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "mt-1 text-sm text-stone-600",
                                                                children: [
                                                                    k.currentNombre ? `${k.currentNombre}` : "Sin sesión",
                                                                    k.screen ? ` · pantalla: ${k.screen}` : ""
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                                lineNumber: 566,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "mt-0.5 text-xs text-stone-400",
                                                                children: [
                                                                    "latido",
                                                                    " ",
                                                                    k.lastHeartbeatAt ? `hace ${timeAgo(k.lastHeartbeatAt)}` : "nunca",
                                                                    k.lastDeliveryAt ? ` · última entrega hace ${timeAgo(k.lastDeliveryAt)}` : ""
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                                lineNumber: 572,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                        lineNumber: 552,
                                                        columnNumber: 19
                                                    }, this),
                                                    k.busy === "busy" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        disabled: busyKey !== null,
                                                        onClick: ()=>void runAction(`release-${k.id}`, ()=>fetch("/api/release", {
                                                                    method: "POST",
                                                                    headers: {
                                                                        "Content-Type": "application/json"
                                                                    },
                                                                    body: JSON.stringify({
                                                                        kioskId: k.id
                                                                    })
                                                                })),
                                                        className: "shrink-0 rounded border border-stone-400 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50",
                                                        children: "Liberar"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                        lineNumber: 584,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, k.id, true, {
                                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                lineNumber: 548,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                        lineNumber: 546,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                lineNumber: 540,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "rounded-lg border border-stone-300 bg-white",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "border-b border-stone-200 px-4 py-3",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-sm font-semibold tracking-wide text-stone-800 uppercase",
                                            children: "Registro de entregas"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/ModeratorBoard.tsx",
                                            lineNumber: 608,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                        lineNumber: 607,
                                        columnNumber: 13
                                    }, this),
                                    (state?.deliveries.length ?? 0) === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "px-4 py-8 text-center text-sm text-stone-500",
                                        children: "Las asignaciones aparecerán aquí cuando un paquete sea enviado a un dispositivo."
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                        lineNumber: 613,
                                        columnNumber: 15
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "max-h-56 divide-y divide-stone-100 overflow-auto",
                                        children: state.deliveries.map((d)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                className: "px-4 py-3 text-sm",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "font-medium text-stone-900",
                                                        children: [
                                                            d.nombre,
                                                            " → ",
                                                            d.kioskLabel
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                        lineNumber: 621,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs text-stone-500",
                                                        children: [
                                                            d.userId,
                                                            " · hace ",
                                                            timeAgo(d.at)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                        lineNumber: 624,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, d.id, true, {
                                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                                lineNumber: 620,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                        lineNumber: 618,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                lineNumber: 606,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                        lineNumber: 539,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ModeratorBoard.tsx",
                lineNumber: 418,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "rounded-lg border border-stone-300 bg-white",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between border-b border-stone-200 px-4 py-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-sm font-semibold tracking-wide text-stone-800 uppercase",
                                children: "Lista de la app"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                lineNumber: 637,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-stone-500",
                                children: [
                                    roster.length,
                                    " paquetes · Supabase attendee_packages"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                lineNumber: 640,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                        lineNumber: 636,
                        columnNumber: 9
                    }, this),
                    roster.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "px-4 py-8 text-center text-sm text-stone-500",
                        children: [
                            'Aún no hay paquetes. Haz clic en "Sincronizar lista + cola" para cargar desde',
                            " ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                className: "rounded bg-stone-100 px-1",
                                children: "data/roster.json"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                lineNumber: 647,
                                columnNumber: 15
                            }, this),
                            " ",
                            "en Supabase."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                        lineNumber: 645,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "grid gap-px bg-stone-100 sm:grid-cols-2 lg:grid-cols-4",
                        children: roster.map((person)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                className: "bg-white px-4 py-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "font-medium text-stone-900",
                                        children: person.nombre
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                        lineNumber: 654,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-0.5 font-mono text-xs text-stone-500",
                                        children: person.userId
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                        lineNumber: 655,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1 truncate text-xs text-stone-600",
                                        children: person.company
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                        lineNumber: 658,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                                            tone: person.packageStatus === "ready" ? "ok" : "bad",
                                            children: [
                                                "paquete ",
                                                person.packageStatus === "ready" ? "listo" : person.packageStatus === "missing" ? "faltante" : person.packageStatus
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/ModeratorBoard.tsx",
                                            lineNumber: 662,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                                        lineNumber: 661,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, person.userId, true, {
                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                lineNumber: 653,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                        lineNumber: 651,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ModeratorBoard.tsx",
                lineNumber: 635,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ModeratorBoard.tsx",
        lineNumber: 294,
        columnNumber: 5
    }, this);
}
_s(ModeratorBoard, "pfZv+N/sFsV411xZo8JlhFDjExE=");
_c1 = ModeratorBoard;
function AgentControls({ kioskId, currentAgentId, disabled, onRefresh }) {
    _s1();
    const [selected, setSelected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(currentAgentId ?? "");
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [dispatchNotice, setDispatchNotice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [dispatchError, setDispatchError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AgentControls.useEffect": ()=>{
            setSelected(currentAgentId ?? "");
        }
    }["AgentControls.useEffect"], [
        currentAgentId
    ]);
    async function handleSaveAgent() {
        setBusy(true);
        setDispatchError(null);
        setDispatchNotice(null);
        try {
            const res = await fetch(`/api/kiosks/${kioskId}/agent`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    agentId: selected || null
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Error al guardar agente");
            setDispatchNotice("Agente guardado");
            await onRefresh();
        } catch (e) {
            setDispatchError(e instanceof Error ? e.message : "Error");
        } finally{
            setBusy(false);
        }
    }
    async function handleDispatch() {
        setBusy(true);
        setDispatchError(null);
        setDispatchNotice(null);
        const agentName = selected || currentAgentId || "huella-guide";
        try {
            const res = await fetch(`/api/kiosks/${kioskId}/dispatch-agent`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    agentName
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Error al lanzar agente");
            setDispatchNotice(`Agente lanzado · dispatch ${data.dispatch?.id ?? ""}`);
        } catch (e) {
            setDispatchError(e instanceof Error ? e.message : "Error");
        } finally{
            setBusy(false);
        }
    }
    const isDirty = selected !== (currentAgentId ?? "");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mt-3 flex flex-col gap-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "text-xs font-medium text-stone-500 shrink-0",
                        children: "Agente LiveKit"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                        lineNumber: 748,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: selected,
                        disabled: disabled || busy,
                        onChange: (e)=>{
                            setSelected(e.target.value);
                            setDispatchNotice(null);
                            setDispatchError(null);
                        },
                        className: "rounded border border-stone-300 bg-white px-2 py-1 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "Sin agente"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ModeratorBoard.tsx",
                                lineNumber: 761,
                                columnNumber: 11
                            }, this),
                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["KNOWN_AGENTS"].map((a)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: a.id,
                                    children: a.label
                                }, a.id, false, {
                                    fileName: "[project]/src/components/ModeratorBoard.tsx",
                                    lineNumber: 763,
                                    columnNumber: 13
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                        lineNumber: 751,
                        columnNumber: 9
                    }, this),
                    isDirty && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        disabled: disabled || busy,
                        onClick: ()=>void handleSaveAgent(),
                        className: "rounded border border-teal-600 bg-teal-50 px-2 py-1 text-xs font-medium text-teal-900 hover:bg-teal-100 disabled:opacity-50",
                        children: "Guardar"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                        lineNumber: 769,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        disabled: disabled || busy || !selected && !currentAgentId,
                        title: !selected && !currentAgentId ? "Selecciona un agente primero" : `Lanzar ${selected || currentAgentId} en room-${kioskId}`,
                        onClick: ()=>void handleDispatch(),
                        className: "rounded border border-violet-600 bg-violet-50 px-2 py-1 text-xs font-medium text-violet-900 hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed",
                        children: "▶ Lanzar agente"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ModeratorBoard.tsx",
                        lineNumber: 778,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ModeratorBoard.tsx",
                lineNumber: 747,
                columnNumber: 7
            }, this),
            dispatchNotice && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-emerald-700",
                children: dispatchNotice
            }, void 0, false, {
                fileName: "[project]/src/components/ModeratorBoard.tsx",
                lineNumber: 793,
                columnNumber: 9
            }, this),
            dispatchError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-rose-700",
                children: dispatchError
            }, void 0, false, {
                fileName: "[project]/src/components/ModeratorBoard.tsx",
                lineNumber: 796,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ModeratorBoard.tsx",
        lineNumber: 746,
        columnNumber: 5
    }, this);
}
_s1(AgentControls, "badKwLRGMDVRF+kiSArxpNnI1/8=");
_c2 = AgentControls;
function StatCard({ label, value, hint }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-lg border border-stone-300 bg-white px-4 py-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs font-semibold tracking-wide text-stone-500 uppercase",
                children: label
            }, void 0, false, {
                fileName: "[project]/src/components/ModeratorBoard.tsx",
                lineNumber: 813,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-1 text-3xl font-semibold tabular-nums text-stone-900",
                children: value
            }, void 0, false, {
                fileName: "[project]/src/components/ModeratorBoard.tsx",
                lineNumber: 816,
                columnNumber: 7
            }, this),
            hint ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-1 text-xs text-stone-500",
                children: hint
            }, void 0, false, {
                fileName: "[project]/src/components/ModeratorBoard.tsx",
                lineNumber: 819,
                columnNumber: 15
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ModeratorBoard.tsx",
        lineNumber: 812,
        columnNumber: 5
    }, this);
}
_c3 = StatCard;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "StatusPill");
__turbopack_context__.k.register(_c1, "ModeratorBoard");
__turbopack_context__.k.register(_c2, "AgentControls");
__turbopack_context__.k.register(_c3, "StatCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/moderatorStateClient.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Browser-side moderator state from Supabase (no /api/state polling).
 */ __turbopack_context__.s([
    "fetchModeratorStateFromSupabase",
    ()=>fetchModeratorStateFromSupabase,
    "mapKioskRow",
    ()=>mapKioskRow
]);
const OFFLINE_AFTER_MS = 45_000;
function mapPackage(row) {
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
        journeyCompletedAt: row.journey_completed_at ?? null
    };
}
function mapCheckIn(row) {
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
        completedAt: row.completed_at ?? null
    };
}
function mapKioskRow(row) {
    const last = row.last_heartbeat_at ? Date.parse(row.last_heartbeat_at) : NaN;
    const online = Number.isFinite(last) && Date.now() - last <= OFFLINE_AFTER_MS;
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
        agentId: row.agent_id ?? null
    };
}
function mapDelivery(row) {
    return {
        id: row.id,
        at: row.at,
        userId: row.user_id,
        nombre: row.nombre,
        kioskId: row.kiosk_id,
        kioskLabel: row.kiosk_label
    };
}
async function fetchModeratorStateFromSupabase(sb) {
    const [queueRes, kioskRes, pkgRes, delRes] = await Promise.all([
        sb.from("check_ins").select("*").order("checked_in_at", {
            ascending: false
        }),
        sb.from("kiosks").select("*").order("id", {
            ascending: true
        }),
        sb.from("attendee_packages").select("*"),
        sb.from("deliveries").select("*").order("at", {
            ascending: false
        }).limit(40)
    ]);
    if (queueRes.error) throw new Error(queueRes.error.message);
    if (kioskRes.error) throw new Error(kioskRes.error.message);
    if (pkgRes.error) throw new Error(pkgRes.error.message);
    if (delRes.error) throw new Error(delRes.error.message);
    const packages = {};
    for (const row of pkgRes.data ?? []){
        packages[row.user_id] = mapPackage(row);
    }
    const queue = (queueRes.data ?? []).map(mapCheckIn);
    const kiosks = (kioskRes.data ?? []).map(mapKioskRow);
    for (const kiosk of kiosks){
        if (kiosk.busy === "busy" && kiosk.currentUserId) continue;
        const assigned = queue.find((q)=>q.kioskId === kiosk.id && (q.status === "assigned" || q.status === "in_session"));
        if (!assigned) continue;
        kiosk.busy = "busy";
        kiosk.currentUserId = assigned.userId;
        kiosk.currentNombre = assigned.nombre;
    }
    return {
        queue,
        kiosks,
        packages,
        deliveries: (delRes.data ?? []).map(mapDelivery),
        updatedAt: new Date().toISOString(),
        backend: "supabase"
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/supabaseBrowser.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getBrowserSupabase",
    ()=>getBrowserSupabase,
    "isBrowserSupabaseConfigured",
    ()=>isBrowserSupabaseConfigured
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-client] (ecmascript) <locals>");
;
function isBrowserSupabaseConfigured() {
    return Boolean(("TURBOPACK compile-time value", "https://ftngimfrfkwhdqxsyomc.supabase.co")?.trim() && ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0bmdpbWZyZmt3aGRxeHN5b21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NTY3MDEsImV4cCI6MjEwMzQzMjcwMX0.M8HnEeDc8AJ2IWhTY0kOwDDJwiOS8WimzZkqyEKXNS8")?.trim());
}
let browserClient = null;
function getBrowserSupabase() {
    if (!isBrowserSupabaseConfigured()) return null;
    if (browserClient) return browserClient;
    browserClient = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(("TURBOPACK compile-time value", "https://ftngimfrfkwhdqxsyomc.supabase.co").trim(), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0bmdpbWZyZmt3aGRxeHN5b21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NTY3MDEsImV4cCI6MjEwMzQzMjcwMX0.M8HnEeDc8AJ2IWhTY0kOwDDJwiOS8WimzZkqyEKXNS8").trim());
    return browserClient;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/types.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Shared domain types for moderator queue ↔ kiosk assignment. */ __turbopack_context__.s([
    "KNOWN_AGENTS",
    ()=>KNOWN_AGENTS
]);
const KNOWN_AGENTS = [
    {
        id: "huella-guide",
        label: "Guía Huella (Nova Sonic)"
    }
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_1p3hh8d._.js.map