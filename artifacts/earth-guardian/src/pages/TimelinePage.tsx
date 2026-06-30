import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Zap, Droplets, Flame, Wind, Mountain, Waves,
  Activity, RefreshCw, AlertTriangle, ExternalLink, Filter,
} from "lucide-react";
import { useLiveEvents } from "@/hooks/useLiveIntelligence";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp  = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const } } };

const TYPE_MAP: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  earthquake: { icon: Zap,       color: "#818cf8", label: "Earthquake" },
  flood:      { icon: Droplets,  color: "#22d3ee", label: "Flood" },
  wildfire:   { icon: Flame,     color: "#fb923c", label: "Wildfire" },
  cyclone:    { icon: Wind,      color: "#22c55e", label: "Cyclone" },
  volcano:    { icon: Mountain,  color: "#a78bfa", label: "Volcano" },
  tsunami:    { icon: Waves,     color: "#60a5fa", label: "Tsunami" },
  storm:      { icon: Activity,  color: "#eab308", label: "Storm" },
  other:      { icon: Activity,  color: "#94a3b8", label: "Other" },
};

const SEV_CONFIG = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.3)" },
  moderate: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  low:      { color: "#34d399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.3)" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function groupByDay(events: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  events.forEach(ev => {
    const d = new Date(ev.time);
    const key = isNaN(d.getTime())
      ? "Unknown"
      : d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(ev);
  });
  return groups;
}

function TimelineEntry({ ev, i, isLast }: { ev: any; i: number; isLast: boolean }) {
  const typeCfg = TYPE_MAP[ev.type] ?? TYPE_MAP.other;
  const sevCfg  = SEV_CONFIG[ev.severity as keyof typeof SEV_CONFIG] ?? SEV_CONFIG.low;
  const Icon    = typeCfg.icon;

  return (
    <motion.div
      variants={fadeUp}
      className="relative flex gap-4 pl-6"
    >
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[18px] top-8 bottom-0 w-px" style={{ background: `linear-gradient(to bottom, ${typeCfg.color}40, transparent)` }} />
      )}

      {/* Icon node */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: i * 0.04, duration: 0.3 }}
        className="absolute left-0 top-1.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border"
        style={{ background: `${typeCfg.color}15`, borderColor: `${typeCfg.color}40` }}
      >
        <Icon className="h-4 w-4" style={{ color: typeCfg.color }} />
      </motion.div>

      {/* Card */}
      <motion.div
        whileHover={{ x: 2, transition: { duration: 0.15 } }}
        className="flex-1 ml-3 mb-4 rounded-xl border border-white/8 bg-white/[0.04] backdrop-blur-xl p-4"
        style={{
          boxShadow: "0 2px 16px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
          borderLeftColor: `${typeCfg.color}40`,
          borderLeftWidth: "2px",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{ev.name}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {typeCfg.label} · {ev.source}
              {ev.country ? ` · ${ev.country}` : ""}
              {ev.detail ? ` · ${ev.detail}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase"
              style={{ borderColor: sevCfg.border, backgroundColor: sevCfg.bg, color: sevCfg.color }}
            >
              {ev.severity}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="h-3 w-3" />
              {timeAgo(ev.time)}
            </div>
            {ev.url && (
              <a href={ev.url} target="_blank" rel="noopener noreferrer"
                className="text-slate-600 hover:text-cyan-400 transition-colors">
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const SEV_FILTERS = ["all", "critical", "high", "moderate", "low"] as const;

export default function TimelinePage() {
  const [sevFilter, setSevFilter] = useState<typeof SEV_FILTERS[number]>("all");
  const { data, isLoading, isError, refetch, isFetching } = useLiveEvents();

  const allEvents = (data?.events ?? [])
    .filter(e => sevFilter === "all" || e.severity === sevFilter)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const grouped = groupByDay(allEvents);
  const days    = Object.keys(grouped);

  const sevCounts: Record<string, number> = {};
  (data?.events ?? []).forEach(e => { sevCounts[e.severity] = (sevCounts[e.severity] ?? 0) + 1; });

  return (
    <div className="relative min-h-screen bg-[#06121F] pb-20 pt-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(26,115,232,0.09)_0%,transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 md:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
          className="mb-8 flex flex-wrap items-start justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-cyan/15 border border-white/10">
                <Clock className="h-5 w-5 text-cyan-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Interactive Timeline</h1>
            </div>
            <p className="text-sm text-slate-400">Animated disaster progression · {data?.total ?? 0} events · Chronological order</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </motion.button>
        </motion.div>

        {/* Severity filter */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mb-8 flex flex-wrap items-center gap-2"
        >
          <Filter className="h-3.5 w-3.5 text-slate-600" />
          {SEV_FILTERS.map(f => {
            const active = sevFilter === f;
            const cfg = f !== "all" ? SEV_CONFIG[f as keyof typeof SEV_CONFIG] : { color: "#94a3b8", bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.15)" };
            const count = f === "all" ? (data?.total ?? 0) : (sevCounts[f] ?? 0);
            return (
              <button
                key={f}
                onClick={() => setSevFilter(f)}
                className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium capitalize transition-all"
                style={active
                  ? { borderColor: cfg.border, backgroundColor: cfg.bg, color: cfg.color }
                  : { borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", color: "#64748b" }
                }
              >
                {f === "critical" && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                {f === "high"     && <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />}
                {f === "moderate" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                {f === "low"      && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                {f}
                <span className="rounded-full px-1.5 text-[9px]"
                  style={active ? { backgroundColor: `${cfg.color}25`, color: cfg.color } : { color: "#475569" }}>
                  {count}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* Timeline */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="space-y-4 pl-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="relative">
                  <div className="absolute left-[-18px] top-1.5 h-9 w-9 animate-pulse rounded-full bg-white/8" />
                  <div className="ml-3 h-20 animate-pulse rounded-xl bg-white/[0.03] border border-white/6" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-12 text-center">
              <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
              <p className="font-semibold text-red-300">Unable to load timeline</p>
              <button onClick={() => refetch()} className="mt-3 text-sm text-slate-400 underline hover:text-white">Retry</button>
            </div>
          ) : days.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-12 text-center">
              <Clock className="h-8 w-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-semibold">No events match this filter</p>
            </div>
          ) : (
            <motion.div key={`${sevFilter}-${data?.fetchedAt}`} variants={stagger} initial="hidden" animate="show">
              {days.map(day => (
                <div key={day} className="mb-8">
                  <motion.div
                    variants={fadeUp}
                    className="mb-4 flex items-center gap-3"
                  >
                    <div className="h-px flex-1 bg-white/8" />
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      {day}
                    </span>
                    <div className="h-px flex-1 bg-white/8" />
                  </motion.div>
                  <div>
                    {grouped[day].map((ev, i) => (
                      <TimelineEntry
                        key={ev.id}
                        ev={ev}
                        i={i}
                        isLast={i === grouped[day].length - 1}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <motion.p
                variants={fadeUp}
                className="text-center text-[10px] text-slate-600 py-4"
              >
                {allEvents.length} events · Data from USGS, GDACS, NASA EONET
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
