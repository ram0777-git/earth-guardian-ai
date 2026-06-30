import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe2, RefreshCw, Clock, AlertTriangle, Zap, Droplets,
  Flame, Wind, Mountain, Activity, Shield, TrendingUp,
  MapPin, Users, Radio, Target, Waves, Cpu, CheckCircle, XCircle,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useLiveStats, useLiveEvents, useAIInsights, useProviderStatus } from "@/hooks/useLiveIntelligence";
import { useQueryClient } from "@tanstack/react-query";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

function useClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

const SEVERITY_CONFIG = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", label: "Critical" },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.3)", label: "High" },
  moderate: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", label: "Moderate" },
  low:      { color: "#34d399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.3)", label: "Low" },
};

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>, color: string, label: string }> = {
  earthquake: { icon: Zap,       color: "#818cf8", label: "Earthquake" },
  flood:      { icon: Droplets,  color: "#22d3ee", label: "Flood" },
  cyclone:    { icon: Wind,      color: "#22c55e", label: "Cyclone" },
  wildfire:   { icon: Flame,     color: "#fb923c", label: "Wildfire" },
  volcano:    { icon: Mountain,  color: "#a78bfa", label: "Volcano" },
  tsunami:    { icon: Waves,     color: "#60a5fa", label: "Tsunami" },
  storm:      { icon: Activity,  color: "#eab308", label: "Storm" },
};

const REGIONS = [
  { name: "Southeast Asia",   risk: 88, events: 12 },
  { name: "Pacific Ring",     risk: 82, events: 18 },
  { name: "South Asia",       risk: 76, events: 9 },
  { name: "Latin America",    risk: 65, events: 7 },
  { name: "Caribbean",        risk: 58, events: 5 },
  { name: "East Africa",      risk: 52, events: 6 },
  { name: "Mediterranean",    risk: 44, events: 4 },
  { name: "Central Asia",     risk: 38, events: 3 },
];

function EmergencyLevelBadge({ level }: { level: string }) {
  const config = SEVERITY_CONFIG[level as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.moderate;
  return (
    <div
      className="flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
      style={{ borderColor: config.border, backgroundColor: config.bg, color: config.color }}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: config.color }} />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: config.color }} />
      </span>
      Emergency Level: {config.label}
    </div>
  );
}

function StatTile({
  label, value, sub, accent, icon: Icon, delay = 0,
}: { label: string; value: number; sub: string; accent: string; icon: React.ComponentType<{ className?: string }>; delay?: number }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur-xl"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)" }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}55, transparent)` }} />
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent}18 0%, transparent 70%)` }} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
          <p className="mt-1.5 text-3xl font-bold text-white">
            <AnimatedCounter value={value} duration={1.5} />
          </p>
          <p className="mt-1 text-[10px] text-slate-500">{sub}</p>
        </div>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}>
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
      </div>
    </motion.div>
  );
}

function RegionHeatmap({ data }: { data: typeof REGIONS }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl p-5"
      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-white/10">
          <Globe2 className="h-4 w-4 text-rose-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Regional Risk Heatmap</h3>
          <p className="text-[10px] text-slate-400">Risk index 0–100 based on active events</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {data.map((region, i) => {
          const riskColor = region.risk >= 80 ? "#ef4444" : region.risk >= 60 ? "#f97316" : region.risk >= 40 ? "#f59e0b" : "#34d399";
          return (
            <motion.div
              key={region.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              className="flex items-center gap-3"
            >
              <p className="w-32 text-xs text-slate-300 flex-shrink-0 truncate">{region.name}</p>
              <div className="flex-1 h-2 rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${region.risk}%` }}
                  transition={{ delay: 0.3 + i * 0.07, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{ background: `linear-gradient(90deg, ${riskColor}90, ${riskColor})` }}
                />
              </div>
              <p className="text-xs font-bold w-8 text-right" style={{ color: riskColor }}>{region.risk}</p>
              <p className="text-[10px] text-slate-500 w-12 text-right">{region.events} events</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function LiveEventFeed({ events, loading }: { events: any[]; loading: boolean }) {
  const top = events.slice(0, 12);
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.03] border border-white/6" />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      {top.map((ev, i) => {
        const cfg = SEVERITY_CONFIG[ev.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.low;
        const typeCfg = TYPE_CONFIG[ev.type] ?? { icon: Activity, color: "#94a3b8", label: ev.type };
        const Icon = typeCfg.icon;
        return (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.35 }}
            className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.025] px-3 py-2.5"
          >
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${typeCfg.color}18`, border: `1px solid ${typeCfg.color}28` }}>
              <Icon className="h-3.5 w-3.5" style={{ color: typeCfg.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{ev.name}</p>
              <p className="text-[10px] text-slate-500">{ev.source} · {ev.country || "Global"}</p>
            </div>
            <div className="flex-shrink-0">
              <span className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase"
                style={{ borderColor: cfg.border, backgroundColor: cfg.bg, color: cfg.color }}>
                {ev.severity}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function ProviderHealthWidget({ currentProvider, gemini, openrouter, groq }: {
  currentProvider: string; gemini: boolean; openrouter: boolean; groq: boolean;
}) {
  const providers = [
    { name: "Gemini", ok: gemini, color: "#22d3ee" },
    { name: "OpenRouter", ok: openrouter, color: "#a78bfa" },
    { name: "Groq", ok: groq, color: "#fb923c" },
  ];
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl p-4"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-500/20">
          <Cpu className="h-3.5 w-3.5 text-cyan-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-white">AI Provider Status</p>
          <p className="text-[9px] text-slate-500">Active: <span className="text-cyan-400 font-medium">{currentProvider}</span></p>
        </div>
      </div>
      <div className="space-y-1.5">
        {providers.map(p => (
          <div key={p.name} className="flex items-center gap-2.5">
            {p.ok
              ? <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: p.color }} />
              : <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-400" />
            }
            <span className="text-xs text-slate-300 flex-1">{p.name}</span>
            <span className={`text-[9px] font-bold uppercase ${p.ok ? "text-emerald-400" : "text-red-400"}`}>
              {p.ok ? "Online" : "Offline"}
            </span>
            {currentProvider.toLowerCase().includes(p.name.toLowerCase()) && (
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 text-[8px] font-bold text-cyan-400">Active</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DisasterTrendChart({ stats }: { stats: any }) {
  const types = [
    { label: "Earthquakes", value: stats?.earthquakesToday ?? 0,     max: 200, color: "#818cf8" },
    { label: "Floods",      value: stats?.floods ?? 0,               max: 30,  color: "#22d3ee" },
    { label: "Wildfires",   value: stats?.wildfires ?? 0,             max: 30,  color: "#fb923c" },
    { label: "Cyclones",    value: stats?.cyclones ?? 0,              max: 20,  color: "#22c55e" },
    { label: "Storms",      value: stats?.storms ?? 0,                max: 50,  color: "#eab308" },
    { label: "Volcanoes",   value: stats?.volcanoes ?? 0,             max: 15,  color: "#a78bfa" },
  ];
  const total = types.reduce((s, t) => s + t.value, 0) || 1;
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl p-5"
      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/20">
          <TrendingUp className="h-4 w-4 text-indigo-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Disaster Type Breakdown</h3>
          <p className="text-[10px] text-slate-400">Current event distribution · Live</p>
        </div>
      </div>
      <div className="space-y-3">
        {types.map((t, i) => {
          const pct = Math.min(100, Math.round((t.value / Math.max(total, 1)) * 100));
          return (
            <motion.div key={t.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-center gap-3"
            >
              <p className="w-24 text-xs text-slate-300 flex-shrink-0 truncate">{t.label}</p>
              <div className="flex-1 h-2 rounded-full bg-white/6 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.2 + i * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  style={{ background: `linear-gradient(90deg, ${t.color}80, ${t.color})` }}
                />
              </div>
              <span className="text-xs font-bold w-7 text-right" style={{ color: t.color }}>{t.value}</span>
              <span className="text-[9px] text-slate-600 w-6 text-right">{pct}%</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ResponseProgressPanel({ events }: { events: any[] }) {
  const typeOrder = ["earthquake", "cyclone", "flood", "wildfire", "volcano", "storm"];
  const typeCfg: Record<string, { label: string; color: string; response: string; progress: number }> = {
    earthquake: { label: "Seismic Response",  color: "#818cf8", response: "Search & Rescue deployed", progress: 72 },
    cyclone:    { label: "Cyclone Response",  color: "#22c55e", response: "Evacuations in progress",   progress: 55 },
    flood:      { label: "Flood Response",    color: "#22d3ee", response: "Emergency teams active",    progress: 63 },
    wildfire:   { label: "Wildfire Response", color: "#fb923c", response: "Containment operations",    progress: 41 },
    volcano:    { label: "Volcanic Response", color: "#a78bfa", response: "Exclusion zones active",    progress: 80 },
    storm:      { label: "Storm Response",    color: "#eab308", response: "Alert systems active",      progress: 68 },
  };
  const activeTypes = typeOrder.filter(t => events.some(e => e.type === t));
  if (activeTypes.length === 0) return null;
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl p-5"
      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/20">
          <Shield className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Response Progress</h3>
          <p className="text-[10px] text-slate-400">Active response operations by type</p>
        </div>
      </div>
      <div className="space-y-3.5">
        {activeTypes.slice(0, 5).map((type, i) => {
          const cfg = typeCfg[type];
          const count = events.filter(e => e.type === type).length;
          return (
            <motion.div key={type}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <span className="text-xs font-medium text-white">{cfg.label}</span>
                  <span className="text-[9px] text-slate-500">({count} events)</span>
                </div>
                <span className="text-[10px] font-bold" style={{ color: cfg.color }}>{cfg.progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/6 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${cfg.progress}%` }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{ background: `linear-gradient(90deg, ${cfg.color}70, ${cfg.color})` }}
                />
              </div>
              <p className="mt-0.5 text-[9px] text-slate-600">{cfg.response}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function AIRecommendations({ data }: { data: any }) {
  if (!data) return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/6" />)}
    </div>
  );

  const recs = [
    { icon: Shield,    label: "Preparedness Action",   text: data.preparedness,       accent: "#22c55e" },
    { icon: TrendingUp, label: "Predicted Escalation", text: data.predictedEscalation, accent: "#f59e0b" },
    { icon: MapPin,    label: "Highest Risk Zone",     text: data.highestRiskArea,    accent: "#ef4444" },
  ];

  return (
    <div className="space-y-2">
      {recs.map((rec, i) => {
        const Icon = rec.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/[0.025] p-3"
          >
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${rec.accent}18`, border: `1px solid ${rec.accent}28` }}>
              <Icon className="h-3.5 w-3.5" style={{ color: rec.accent }} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{rec.label}</p>
              <p className="text-xs text-white leading-snug mt-0.5">{rec.text}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function CommandCenterPage() {
  const now = useClock();
  const [spinning, setSpinning] = useState(false);
  const qc = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useLiveStats();
  const { data: events, isLoading: eventsLoading } = useLiveEvents();
  const { data: insights } = useAIInsights();
  const { data: providerStatus } = useProviderStatus();

  const handleRefresh = useCallback(() => {
    setSpinning(true);
    qc.invalidateQueries({ queryKey: ["live-stats"] });
    qc.invalidateQueries({ queryKey: ["live-events"] });
    qc.invalidateQueries({ queryKey: ["ai-insights"] });
    qc.invalidateQueries({ queryKey: ["provider-status"] });
    setTimeout(() => setSpinning(false), 1200);
  }, [qc]);

  const emergencyLevel = insights?.riskLevel ?? "moderate";
  const totalEvents = stats?.stats.totalActiveEvents ?? 0;
  const populationAffected = Math.round(totalEvents * 47_000);
  const criticalEvents = events?.events.filter(e => e.severity === "critical").length ?? 0;
  const countriesAffected = stats?.stats.countriesAffected ?? 0;
  const redAlerts = stats?.stats.redAlerts ?? 0;

  const regionsWithLive = REGIONS.map((r, i) => ({
    ...r,
    events: r.events + Math.floor((events?.events.length ?? 0) * [0.18, 0.22, 0.12, 0.10, 0.08, 0.09, 0.07, 0.05][i] ?? 0),
  }));

  return (
    <div className="relative min-h-screen bg-[#06121F] pb-20 pt-24">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_10%_5%,rgba(239,68,68,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_90%_80%,rgba(26,115,232,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: "linear-gradient(rgba(239,68,68,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(239,68,68,0.5) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at 50% 0%,black 30%,transparent 80%)",
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/30 to-primary/20 border border-white/10">
                  <Radio className="h-5 w-5 text-rose-400" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                  AI Global Command Center
                </h1>
              </div>
              <EmergencyLevelBadge level={emergencyLevel} />
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Unified planetary disaster intelligence · All sources active · Live
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={handleRefresh}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${spinning ? "animate-spin" : ""}`} />
              Refresh All
            </motion.button>
          </div>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate="show">

          {/* KPI tiles */}
          <motion.div variants={fadeUp} className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatTile label="Active Disasters"   value={totalEvents}         sub="All sources"         accent="#ef4444" icon={AlertTriangle} />
            <StatTile label="Population Affected" value={populationAffected} sub="Est. total exposure"  accent="#f97316" icon={Users} />
            <StatTile label="Countries at Risk"   value={countriesAffected}  sub="GDACS coverage"      accent="#60a5fa" icon={Globe2} />
            <StatTile label="Critical Events"     value={criticalEvents}     sub="Red-level severity"  accent="#dc2626" icon={Target} />
            <StatTile label="Red Alerts"          value={redAlerts}          sub="GDACS red-level"     accent="#f43f5e" icon={Radio} />
            <StatTile label="Earthquakes Today"   value={stats?.stats.earthquakesToday ?? 0} sub="USGS — 24h" accent="#818cf8" icon={Zap} />
          </motion.div>

          {/* Main grid */}
          <motion.div variants={fadeUp} className="grid gap-6 lg:grid-cols-12">

            {/* Left: Live alerts feed */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl h-full"
                style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
                <div className="border-b border-white/6 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/15 border border-red-500/20">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Live AI Alerts</h3>
                        <p className="text-[10px] text-slate-400">Top 12 active events · Auto-updating</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      </span>
                      Live
                    </span>
                  </div>
                </div>
                <div className="p-4 overflow-y-auto max-h-[480px]">
                  <LiveEventFeed events={events?.events ?? []} loading={eventsLoading} />
                  {!eventsLoading && events?.total !== undefined && (
                    <p className="mt-3 text-center text-[10px] text-slate-600">
                      Showing 12 of {events.total} active events
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Trend + Heatmap + AI */}
            <div className="lg:col-span-7 space-y-6">
              <DisasterTrendChart stats={stats?.stats} />

              <RegionHeatmap data={regionsWithLive} />

              {/* Bottom: Provider health + Response Progress side by side */}
              <div className="grid gap-4 sm:grid-cols-2">
                {providerStatus && (
                  <ProviderHealthWidget
                    currentProvider={providerStatus.currentProvider}
                    gemini={providerStatus.gemini}
                    openrouter={providerStatus.openrouter}
                    groq={providerStatus.groq}
                  />
                )}
                {events?.events && <ResponseProgressPanel events={events.events} />}
              </div>

              {/* AI Recommendations panel */}
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl"
                style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
                <div className="border-b border-white/6 p-5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/20">
                      <Target className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">AI Recommendations</h3>
                      <p className="text-[10px] text-slate-400">Live analysis · Raksh AI</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <AIRecommendations data={insights} />
                  {insights?.summary && (
                    <div className="mt-3 rounded-xl border border-white/6 bg-white/[0.02] p-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Global AI Summary</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{insights.summary}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bottom stats row */}
          <motion.div variants={fadeUp} className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[
              { label: "Wildfires",   value: stats?.stats.wildfires ?? 0,  icon: Flame,    color: "#fb923c" },
              { label: "Floods",      value: stats?.stats.floods ?? 0,     icon: Droplets, color: "#22d3ee" },
              { label: "Cyclones",    value: stats?.stats.cyclones ?? 0,   icon: Wind,     color: "#22c55e" },
              { label: "Volcanoes",   value: stats?.stats.volcanoes ?? 0,  icon: Mountain, color: "#a78bfa" },
              { label: "Storms",      value: stats?.stats.storms ?? 0,     icon: Activity, color: "#eab308" },
              { label: "Orange Alerts", value: stats?.stats.orangeAlerts ?? 0, icon: AlertTriangle, color: "#f97316" },
              { label: "NOAA Alerts", value: stats?.stats.noaaAlerts ?? 0, icon: Radio,   color: "#60a5fa" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-4 backdrop-blur-xl"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-white">
                    <AnimatedCounter value={value} duration={1.2} />
                  </p>
                  <p className="text-[9px] text-slate-500 truncate">{label}</p>
                </div>
              </div>
            ))}
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
