import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, RefreshCw, Filter, X, Clock, Globe2,
  Zap, Droplets, Flame, Wind, Mountain, Activity,
  Waves, AlertTriangle, Radio, ChevronDown, ChevronUp,
  ExternalLink, Search, TrendingUp,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useIntelligenceFeed, type IntelligenceFeedEvent } from "@/hooks/useLiveIntelligence";
import { DISASTER_TYPE_CONFIG } from "@/data/mapData";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const SEV_CONFIG = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.28)", label: "Critical" },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.28)", label: "High" },
  moderate: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.28)", label: "Moderate" },
  low:      { color: "#34d399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.28)", label: "Low" },
};

const SOURCE_CONFIG: Record<string, { color: string; label: string }> = {
  "USGS":           { color: "#818cf8", label: "USGS" },
  "GDACS":          { color: "#f97316", label: "GDACS" },
  "NASA EONET":     { color: "#22d3ee", label: "NASA EONET" },
  "NOAA":           { color: "#60a5fa", label: "NOAA" },
  "Earth Guardian": { color: "#a78bfa", label: "Platform" },
};

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  earthquake: Zap,
  flood: Droplets,
  wildfire: Flame,
  cyclone: Wind,
  storm: Activity,
  volcano: Mountain,
  tsunami: Waves,
  landslide: Mountain,
  drought: TrendingUp,
  other: AlertTriangle,
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 60_000) return "Just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function SourceBadge({ source }: { source: string }) {
  const cfg = SOURCE_CONFIG[source] ?? { color: "#64748b", label: source };
  return (
    <span
      className="rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
      style={{ color: cfg.color, borderColor: `${cfg.color}35`, backgroundColor: `${cfg.color}12` }}
    >
      {cfg.label}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = SEV_CONFIG[severity as keyof typeof SEV_CONFIG] ?? SEV_CONFIG.moderate;
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider flex-shrink-0"
      style={{ color: cfg.color, borderColor: cfg.border, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

function EventCard({ event, index }: { event: IntelligenceFeedEvent; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEV_CONFIG[event.severity] ?? SEV_CONFIG.moderate;
  const cfg = DISASTER_TYPE_CONFIG[event.type];
  const Icon = TYPE_ICON[event.type] ?? AlertTriangle;
  const typeColor = cfg?.color ?? "#64748b";

  return (
    <motion.div
      variants={fadeUp}
      className="group rounded-2xl border border-white/6 bg-white/[0.03] backdrop-blur-xl overflow-hidden transition-colors duration-150 hover:border-white/10 hover:bg-white/[0.05]"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.15)" }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl mt-0.5"
            style={{ background: `${typeColor}18`, border: `1px solid ${typeColor}28` }}
          >
            <Icon className="h-4 w-4" style={{ color: typeColor }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-2 justify-between">
              <p className="text-sm font-semibold text-white leading-snug truncate max-w-xs">
                {event.detail ? <span className="mr-1 text-slate-400 font-medium">{event.detail}</span> : null}
                {event.name}
              </p>
              <SeverityBadge severity={event.severity} />
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
              <SourceBadge source={event.source} />
              {event.country && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <Globe2 className="h-3 w-3" />
                    {event.country}
                  </span>
                </>
              )}
              {event.location && event.location !== event.country && (
                <>
                  <span>·</span>
                  <span className="truncate max-w-[180px]">{event.location}</span>
                </>
              )}
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                {formatTime(event.time)}
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-300 leading-relaxed line-clamp-2">{event.aiSummary}</p>

            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2"
              >
                {event.lat !== null && event.lng !== null && (
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="font-mono text-slate-400">
                      {event.lat.toFixed(3)}°, {event.lng.toFixed(3)}°
                    </span>
                  </div>
                )}
                {event.url && (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View source data
                  </a>
                )}
              </motion.div>
            )}

            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {expanded ? "Less" : "Details"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, ${typeColor}40, transparent 60%)` }} />
    </motion.div>
  );
}

function SourceDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      <div className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-red-400"}`} />
      <span className={ok ? "text-slate-400" : "text-red-400"}>{label}</span>
    </div>
  );
}

const ALL_SOURCES = ["All", "USGS", "GDACS", "NASA EONET", "NOAA", "Earth Guardian"];
const ALL_SEVERITIES = ["all", "critical", "high", "moderate", "low"];
const ALL_TYPES = ["all", ...Object.keys(DISASTER_TYPE_CONFIG)];

export default function IntelligenceFeedPage() {
  const qc = useQueryClient();
  const { data, isLoading, dataUpdatedAt } = useIntelligenceFeed();
  const [spinning, setSpinning] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [filterSource, setFilterSource] = useState("All");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterCountry, setFilterCountry] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"time" | "severity">("time");

  const handleRefresh = () => {
    setSpinning(true);
    qc.invalidateQueries({ queryKey: ["intelligence-feed"] });
    setTimeout(() => setSpinning(false), 1200);
  };

  const sevOrder: Record<string, number> = { critical: 0, high: 1, moderate: 2, low: 3 };

  const countries = useMemo(() => {
    if (!data?.events) return [];
    const set = new Set<string>();
    data.events.forEach(e => { if (e.country) set.add(e.country); });
    return Array.from(set).sort();
  }, [data?.events]);

  const filtered = useMemo(() => {
    if (!data?.events) return [];
    let evs = data.events;

    if (filterSource !== "All") evs = evs.filter(e => e.source === filterSource);
    if (filterSeverity !== "all") evs = evs.filter(e => e.severity === filterSeverity);
    if (filterType !== "all") evs = evs.filter(e => e.type === filterType);
    if (filterCountry) evs = evs.filter(e => e.country === filterCountry);
    if (searchQ.trim()) {
      const q = searchQ.trim().toLowerCase();
      evs = evs.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.country.toLowerCase().includes(q) ||
        e.aiSummary.toLowerCase().includes(q)
      );
    }

    if (sortBy === "severity") {
      evs = [...evs].sort((a, b) => (sevOrder[a.severity] ?? 4) - (sevOrder[b.severity] ?? 4));
    }
    return evs;
  }, [data?.events, filterSource, filterSeverity, filterType, filterCountry, searchQ, sortBy]);

  const activeFilterCount = [
    filterSource !== "All",
    filterSeverity !== "all",
    filterType !== "all",
    !!filterCountry,
    !!searchQ.trim(),
  ].filter(Boolean).length;

  const sources = data?.sources;

  const typeCounts = useMemo(() => {
    if (!data?.events) return {} as Record<string, number>;
    return data.events.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [data?.events]);

  const severityCounts = useMemo(() => {
    const base = { critical: 0, high: 0, moderate: 0, low: 0 };
    data?.events.forEach(e => {
      if (e.severity in base) base[e.severity as keyof typeof base]++;
    });
    return base;
  }, [data?.events]);

  return (
    <div className="relative min-h-screen bg-[#06121F] pb-20 pt-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_5%,rgba(26,115,232,0.07)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(167,139,250,0.06)_0%,transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
          className="mb-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-violet-500/20 border border-white/10">
                  <Layers className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                    Unified Intelligence Feed
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                    All sources · USGS · GDACS · NASA EONET · NOAA · Platform
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {sources && (
                <div className="hidden sm:flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                  <SourceDot ok={sources.usgs} label="USGS" />
                  <SourceDot ok={sources.gdacs} label="GDACS" />
                  <SourceDot ok={sources.eonet} label="EONET" />
                  <SourceDot ok={sources.noaa} label="NOAA" />
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                <Clock className="h-3.5 w-3.5" />
                {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
              </div>
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={handleRefresh}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${spinning ? "animate-spin text-cyan-400" : ""}`} />
                Refresh
              </motion.button>
            </div>
          </div>

          {/* Severity summary row */}
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(severityCounts).map(([sev, count]) => {
              const cfg = SEV_CONFIG[sev as keyof typeof SEV_CONFIG];
              return (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(filterSeverity === sev ? "all" : sev)}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all"
                  style={{
                    borderColor: filterSeverity === sev ? cfg.color : cfg.border,
                    backgroundColor: filterSeverity === sev ? cfg.bg : "transparent",
                    color: cfg.color,
                  }}
                >
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                  {count} {cfg.label}
                </button>
              );
            })}
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-bold text-slate-400">
              {data?.total ?? 0} total events
            </div>
          </div>
        </motion.div>

        {/* Search + Filters bar */}
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search events, locations…"
              className="w-full rounded-xl border border-white/8 bg-white/[0.04] pl-8 pr-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 transition-all"
            />
            {searchQ && (
              <button onClick={() => setSearchQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
              showFilters || activeFilterCount > 0
                ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-400"
                : "border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[9px] font-bold text-[#06121F]">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-white/[0.04] p-0.5">
            {(["time", "severity"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                  sortBy === s ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
                }`}
              >
                {s === "time" ? "Newest" : "Severity"}
              </button>
            ))}
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={() => { setFilterSource("All"); setFilterSeverity("all"); setFilterType("all"); setFilterCountry(""); setSearchQ(""); }}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors"
            >
              <X className="h-3 w-3" /> Clear all
            </button>
          )}
        </div>

        {/* Expanded filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 backdrop-blur-xl">
                <div className="grid gap-4 sm:grid-cols-4">
                  {/* Source */}
                  <div>
                    <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-500">Data Source</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_SOURCES.map(s => (
                        <button
                          key={s}
                          onClick={() => setFilterSource(s)}
                          className={`rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-all ${
                            filterSource === s
                              ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-400"
                              : "border-white/8 text-slate-400 hover:border-white/15 hover:text-white"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Severity */}
                  <div>
                    <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-500">Severity</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_SEVERITIES.map(s => {
                        const cfg = s !== "all" ? SEV_CONFIG[s as keyof typeof SEV_CONFIG] : null;
                        return (
                          <button
                            key={s}
                            onClick={() => setFilterSeverity(s)}
                            className={`rounded-lg border px-2.5 py-1 text-[10px] font-medium capitalize transition-all ${
                              filterSeverity === s
                                ? "border-current"
                                : "border-white/8 text-slate-400 hover:border-white/15 hover:text-white"
                            }`}
                            style={filterSeverity === s && cfg ? { color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border } : {}}
                          >
                            {s === "all" ? "All" : s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Type */}
                  <div>
                    <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-500">Disaster Type</p>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {ALL_TYPES.map(t => {
                        const cfg = t !== "all" ? DISASTER_TYPE_CONFIG[t] : null;
                        return (
                          <button
                            key={t}
                            onClick={() => setFilterType(t)}
                            className={`rounded-lg border px-2.5 py-1 text-[10px] font-medium capitalize transition-all ${
                              filterType === t
                                ? "border-white/20 bg-white/10 text-white"
                                : "border-white/8 text-slate-400 hover:border-white/15 hover:text-white"
                            }`}
                          >
                            {cfg ? `${cfg.emoji} ${cfg.label}` : "All Types"}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-500">Country</p>
                    <select
                      value={filterCountry}
                      onChange={e => setFilterCountry(e.target.value)}
                      className="w-full rounded-xl border border-white/8 bg-[#06121F] px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/40 transition-all"
                    >
                      <option value="">All Countries</option>
                      {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Type breakdown mini-bar */}
        {!isLoading && data && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            {Object.entries(typeCounts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([type, count]) => {
                const cfg = DISASTER_TYPE_CONFIG[type];
                const pct = Math.round((count / data.total) * 100);
                return (
                  <button
                    key={type}
                    onClick={() => setFilterType(filterType === type ? "all" : type)}
                    className="flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[10px] font-medium transition-all hover:bg-white/[0.04]"
                    style={{
                      borderColor: filterType === type ? (cfg?.color ?? "#64748b") : "rgba(255,255,255,0.08)",
                      backgroundColor: filterType === type ? `${cfg?.color ?? "#64748b"}15` : "transparent",
                    }}
                  >
                    <span>{cfg?.emoji ?? "⚠️"}</span>
                    <span className="text-white">{count}</span>
                    <span className="text-slate-500">{cfg?.label ?? type}</span>
                    <span className="text-slate-600">{pct}%</span>
                  </button>
                );
              })}
          </div>
        )}

        {/* Event list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/6 bg-white/[0.03]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
              <Layers className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-sm font-semibold text-white">No events match your filters</p>
            <p className="mt-1 text-xs text-slate-500">Try adjusting or clearing the active filters</p>
            <button
              onClick={() => { setFilterSource("All"); setFilterSeverity("all"); setFilterType("all"); setFilterCountry(""); setSearchQ(""); }}
              className="mt-4 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white hover:bg-white/10 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-[10px] text-slate-600">
              Showing {filtered.length} of {data?.total ?? 0} events
            </p>
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {filtered.map((ev, i) => (
                <EventCard key={ev.id} event={ev} index={i} />
              ))}
            </motion.div>
          </>
        )}

      </div>
    </div>
  );
}
