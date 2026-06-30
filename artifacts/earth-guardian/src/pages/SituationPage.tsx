import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Zap, Droplets, Flame, Wind, Mountain, Waves,
  RefreshCw, Clock, AlertTriangle, ExternalLink, Filter,
} from "lucide-react";
import { useLiveEvents } from "@/hooks/useLiveIntelligence";
import { useQueryClient } from "@tanstack/react-query";

const FILTERS = [
  { id: "all",        label: "All",        icon: Activity,  color: "#94a3b8" },
  { id: "earthquake", label: "Earthquakes", icon: Zap,      color: "#818cf8" },
  { id: "flood",      label: "Floods",      icon: Droplets, color: "#22d3ee" },
  { id: "wildfire",   label: "Wildfires",   icon: Flame,    color: "#fb923c" },
  { id: "cyclone",    label: "Cyclones",    icon: Wind,     color: "#22c55e" },
  { id: "volcano",    label: "Volcanoes",   icon: Mountain, color: "#a78bfa" },
  { id: "tsunami",    label: "Tsunamis",    icon: Waves,    color: "#60a5fa" },
  { id: "storm",      label: "Storms",      icon: Activity, color: "#eab308" },
] as const;

type FilterId = typeof FILTERS[number]["id"];

const SEVERITY_CONFIG = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", dot: "bg-red-500" },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.3)", dot: "bg-orange-500" },
  moderate: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", dot: "bg-amber-500" },
  low:      { color: "#34d399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.3)", dot: "bg-emerald-500" },
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } } };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function EventCard({ ev, delay = 0 }: { ev: any; delay?: number }) {
  const filterCfg = FILTERS.find(f => f.id === ev.type) ?? FILTERS[0];
  const sevCfg    = SEVERITY_CONFIG[ev.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.low;
  const Icon      = filterCfg.icon;

  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl p-4"
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)" }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${filterCfg.color}50, transparent)` }} />
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${filterCfg.color}12 0%, transparent 70%)` }} />

      <div className="relative">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${filterCfg.color}18`, border: `1px solid ${filterCfg.color}30` }}>
            <Icon className="h-4.5 w-4.5" style={{ color: filterCfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight truncate">{ev.name}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{ev.source} · {ev.country || "Global"}</p>
          </div>
          <span
            className="flex-shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase"
            style={{ borderColor: sevCfg.border, backgroundColor: sevCfg.bg, color: sevCfg.color }}
          >
            {ev.severity}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 capitalize">{filterCfg.label}</span>
            {ev.detail && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-[10px] font-semibold text-slate-400">{ev.detail}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-slate-600" />
            <span className="text-[10px] text-slate-500">{timeAgo(ev.time)}</span>
            {ev.url && (
              <a href={ev.url} target="_blank" rel="noopener noreferrer"
                className="text-slate-600 hover:text-cyan-400 transition-colors">
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/6 bg-white/[0.03]" />
      ))}
    </div>
  );
}

export default function SituationPage() {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [countdown, setCountdown]       = useState(30);
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useLiveEvents();

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          refetch();
          return 30;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [refetch]);

  const handleRefresh = useCallback(() => {
    setCountdown(30);
    qc.invalidateQueries({ queryKey: ["live-events"] });
  }, [qc]);

  const filtered = activeFilter === "all"
    ? (data?.events ?? [])
    : (data?.events ?? []).filter(e => e.type === activeFilter);

  const counts: Record<string, number> = {};
  (data?.events ?? []).forEach(e => { counts[e.type] = (counts[e.type] ?? 0) + 1; });

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="relative min-h-screen bg-[#06121F] pb-20 pt-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_8%,rgba(26,115,232,0.09)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_80%,rgba(0,188,212,0.07)_0%,transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
          className="mb-6 flex flex-wrap items-start justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-primary/20 border border-white/10">
                <Activity className="h-5 w-5 text-cyan-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Situation Awareness</h1>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Live
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Real-time global disaster feed · {data?.total ?? 0} active events · Auto-refresh in {countdown}s
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdate && <span className="text-[10px] text-slate-500">Updated {lastUpdate}</span>}
            <motion.button whileTap={{ scale: 0.93 }} onClick={handleRefresh}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh Now
            </motion.button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {FILTERS.map(f => {
            const Icon = f.icon;
            const count = f.id === "all" ? (data?.total ?? 0) : (counts[f.id] ?? 0);
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all"
                style={active
                  ? { borderColor: `${f.color}50`, backgroundColor: `${f.color}15`, color: f.color }
                  : { borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)", color: "#94a3b8" }
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {f.label}
                {count > 0 && (
                  <span className="ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                    style={active
                      ? { backgroundColor: `${f.color}30`, color: f.color }
                      : { backgroundColor: "rgba(255,255,255,0.06)", color: "#64748b" }
                    }>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-500">
            <Filter className="h-3 w-3" />
            {filtered.length} showing
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <Skeleton />
          ) : isError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-red-500/20 bg-red-500/5 p-12 text-center"
            >
              <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
              <p className="font-semibold text-red-300">Unable to load live events</p>
              <button onClick={() => refetch()} className="mt-3 text-sm text-slate-400 underline hover:text-white">Retry</button>
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-white/8 bg-white/[0.03] p-12 text-center"
            >
              <Activity className="h-8 w-8 text-slate-600 mx-auto mb-3" />
              <p className="font-semibold text-slate-400">No {activeFilter === "all" ? "" : activeFilter} events found</p>
              <p className="text-sm text-slate-600 mt-1">Try selecting a different filter or refreshing</p>
            </motion.div>
          ) : (
            <motion.div
              key={`${activeFilter}-${dataUpdatedAt}`}
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((ev, i) => (
                <EventCard key={ev.id} ev={ev} delay={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Refresh indicator bar */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-900/90 backdrop-blur-xl px-4 py-2 shadow-xl">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs text-slate-300">Live feed · Refreshing in</span>
            <span className="text-xs font-bold text-cyan-400 tabular-nums w-6 text-center">{countdown}s</span>
            <div className="h-1 w-20 rounded-full bg-white/8 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-cyan-400"
                style={{ width: `${(countdown / 30) * 100}%` }}
                transition={{ duration: 0.9 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
