import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Zap, Droplets, Flame, Wind, Mountain, Waves, Activity,
  Users, Building2, Truck, Package, ShieldAlert, AlertTriangle,
  CheckCircle, Clock, Target, DollarSign, RefreshCw, ChevronDown,
  Ambulance, HeartPulse, Tent, Siren,
} from "lucide-react";

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const } } };

const DISASTER_TYPES = [
  { id: "Earthquake",  icon: Zap,      color: "#818cf8" },
  { id: "Flood",       icon: Droplets, color: "#22d3ee" },
  { id: "Cyclone",     icon: Wind,     color: "#22c55e" },
  { id: "Wildfire",    icon: Flame,    color: "#fb923c" },
  { id: "Volcano",     icon: Mountain, color: "#a78bfa" },
  { id: "Tsunami",     icon: Waves,    color: "#60a5fa" },
  { id: "Landslide",   icon: Activity, color: "#f59e0b" },
  { id: "Heatwave",    icon: Activity, color: "#ef4444" },
];

const MAGNITUDES = ["Minor (M4.0)", "Moderate (M5.5)", "Strong (M6.5)", "Major (M7.0)", "Great (M8.0+)"];

const PRIORITY_CONFIG = {
  immediate: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", label: "Immediate" },
  high:      { color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.3)", label: "High" },
  medium:    { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", label: "Medium" },
  low:       { color: "#34d399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.3)", label: "Low" },
};

interface DecisionResult {
  impact: {
    peopleAffected: number;
    infrastructureDamage: string;
    economicLoss: string;
    evacuationRadius: string;
    severityScore: number;
    confidence: number;
  };
  actions: Array<{
    phase: string;
    priority: "immediate" | "high" | "medium" | "low";
    action: string;
    rationale: string;
    timeframe: string;
  }>;
  resources: {
    ambulances: number;
    hospitals: number;
    rescueTeams: number;
    foodPackages: number;
    waterLiters: number;
    shelterUnits: number;
    personnel: number;
    helicopters: number;
  };
  confidence: number;
  generatedAt: string;
}

function ImpactCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; accent: string }) {
  return (
    <div className="rounded-xl border border-white/6 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg"
          style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}>
          <Icon className="h-3 w-3" style={{ color: accent }} />
        </div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      </div>
      <p className="text-sm font-bold text-white leading-snug">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}

function ResourceRow({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span className="text-sm text-slate-300">{label}</span>
      </div>
      <span className="text-sm font-bold text-white tabular-nums">{value.toLocaleString()}</span>
    </div>
  );
}

function ActionCard({ action, i }: { action: DecisionResult["actions"][0]; i: number }) {
  const cfg = PRIORITY_CONFIG[action.priority] ?? PRIORITY_CONFIG.medium;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.07, duration: 0.4 }}
      className="flex gap-3 rounded-xl border border-white/6 bg-white/[0.025] p-4"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
        style={{ borderColor: cfg.color, color: cfg.color }}>
        {i + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="text-sm font-semibold text-white">{action.action}</p>
          <span className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase"
            style={{ borderColor: cfg.border, backgroundColor: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] text-slate-400">
            {action.timeframe}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{action.rationale}</p>
        <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-wider">{action.phase}</p>
      </div>
    </motion.div>
  );
}

export default function DecisionAssistantPage() {
  const [disasterType, setDisasterType]   = useState("Earthquake");
  const [magnitude,    setMagnitude]      = useState("Strong (M6.5)");
  const [location,     setLocation]       = useState("");
  const [population,   setPopulation]     = useState("");
  const [result,       setResult]         = useState<DecisionResult | null>(null);
  const [loading,      setLoading]        = useState(false);
  const [error,        setError]          = useState<string | null>(null);

  const selectedType = DISASTER_TYPES.find(d => d.id === disasterType) ?? DISASTER_TYPES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res  = await fetch(`${BASE}/api/raksh/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disasterType,
          magnitude,
          location: location.trim(),
          population: population ? parseInt(population) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error ?? `Error ${res.status}`);
      }
      const data = await res.json() as DecisionResult;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate decision plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#06121F] pb-20 pt-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_5%,rgba(26,115,232,0.09)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_35%_at_75%_75%,rgba(168,85,247,0.06)_0%,transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-8">
        <motion.div variants={stagger} initial="hidden" animate="show">

          {/* Header */}
          <motion.div variants={fadeUp} className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/25 to-primary/20 border border-white/10">
                <Brain className="h-5 w-5 text-purple-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Emergency Decision Assistant</h1>
            </div>
            <p className="text-sm text-slate-400 ml-13">
              AI-powered impact prediction · Prioritized government actions · Resource allocation for any disaster scenario
            </p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-5">

            {/* Config panel */}
            <motion.div variants={fadeUp} className="lg:col-span-2">
              <form onSubmit={handleSubmit}
                className="rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl p-6 sticky top-28"
                style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
                <h3 className="font-semibold text-white mb-5">Scenario Parameters</h3>

                {/* Disaster type */}
                <div className="mb-4">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Disaster Type</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {DISASTER_TYPES.map(d => {
                      const Icon = d.icon;
                      const active = disasterType === d.id;
                      return (
                        <button
                          type="button"
                          key={d.id}
                          onClick={() => setDisasterType(d.id)}
                          className="flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-all text-[9px] font-medium"
                          style={active
                            ? { borderColor: `${d.color}50`, backgroundColor: `${d.color}15`, color: d.color }
                            : { borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", color: "#64748b" }
                          }
                        >
                          <Icon className="h-4 w-4" />
                          {d.id}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Magnitude */}
                <div className="mb-4">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Severity / Magnitude</label>
                  <div className="relative">
                    <select
                      value={magnitude}
                      onChange={e => setMagnitude(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                    >
                      {MAGNITUDES.map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-500" />
                  </div>
                </div>

                {/* Location */}
                <div className="mb-4">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Location *</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Istanbul, Turkey"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>

                {/* Population */}
                <div className="mb-6">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Population (optional)</label>
                  <input
                    type="number"
                    value={population}
                    onChange={e => setPopulation(e.target.value)}
                    placeholder="e.g. 15000000"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={loading || !location.trim()}
                  whileTap={{ scale: 0.96 }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600/70 to-primary/60 border border-purple-500/30 py-3 text-sm font-semibold text-white transition-all hover:from-purple-600/80 hover:to-primary/70 disabled:opacity-50"
                >
                  {loading
                    ? <><RefreshCw className="h-4 w-4 animate-spin" />Analyzing…</>
                    : <><Brain className="h-4 w-4" />Generate Decision Plan</>
                  }
                </motion.button>

                {error && (
                  <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300">{error}</p>
                  </div>
                )}
              </form>
            </motion.div>

            {/* Results */}
            <div className="lg:col-span-3 space-y-6">
              <AnimatePresence mode="wait">
                {loading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-white/8 bg-white/[0.04] p-12 text-center backdrop-blur-xl"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="h-14 w-14 rounded-full border-2 border-purple-400/20 border-t-purple-400 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Brain className="h-6 w-6 text-purple-400/60" />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-white">Raksh AI Analyzing Scenario…</p>
                        <p className="text-sm text-slate-400 mt-1">{disasterType} · {magnitude} · {location}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-center">
                        {["Impact Assessment", "Decision Actions", "Resource Planning"].map((s, i) => (
                          <motion.span
                            key={s}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0.5] }}
                            transition={{ delay: i * 0.8, duration: 1.5, repeat: Infinity }}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-slate-400"
                          >
                            {s}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {result && !loading && (
                  <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

                    {/* Header banner */}
                    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 flex items-center justify-between"
                      style={{ boxShadow: "0 2px 16px rgba(168,85,247,0.08)" }}>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-purple-400" />
                        <div>
                          <p className="font-semibold text-white">{disasterType} · {magnitude} · {location}</p>
                          <p className="text-[10px] text-slate-400">AI Decision Plan · {Math.round(result.confidence * 100)}% confidence</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold" style={{ color: result.impact.severityScore >= 80 ? "#ef4444" : result.impact.severityScore >= 60 ? "#f97316" : "#f59e0b" }}>
                          {result.impact.severityScore}/100
                        </p>
                        <p className="text-[10px] text-slate-500">Severity Score</p>
                      </div>
                    </div>

                    {/* Impact prediction */}
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl"
                      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
                      <div className="border-b border-white/6 px-5 py-4 flex items-center gap-2">
                        <Target className="h-4 w-4 text-rose-400" />
                        <h3 className="font-semibold text-white">AI Impact Prediction</h3>
                        <span className="ml-auto text-[10px] text-slate-500">{result.impact.confidence}% confidence</span>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <ImpactCard label="People Affected"        value={result.impact.peopleAffected.toLocaleString()} icon={Users}       accent="#ef4444" />
                        <ImpactCard label="Economic Loss"          value={result.impact.economicLoss}                    icon={DollarSign}  accent="#f97316" />
                        <ImpactCard label="Evacuation Radius"      value={result.impact.evacuationRadius}                icon={Siren}       accent="#eab308" />
                        <ImpactCard label="Infrastructure Damage"  value={result.impact.infrastructureDamage}            icon={Building2}   accent="#60a5fa" />
                        <ImpactCard label="Severity Score"         value={`${result.impact.severityScore}/100`}          icon={ShieldAlert} accent="#a78bfa" />
                        <ImpactCard label="Confidence Level"       value={`${result.impact.confidence}%`}               icon={CheckCircle} accent="#22c55e" />
                      </div>
                    </div>

                    {/* Government actions */}
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl"
                      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
                      <div className="border-b border-white/6 px-5 py-4 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-amber-400" />
                        <h3 className="font-semibold text-white">Prioritized Government Actions</h3>
                        <span className="ml-auto text-[10px] text-slate-500">First 6 hours · {result.actions.length} actions</span>
                      </div>
                      <div className="p-4 space-y-2">
                        {result.actions.map((action, i) => (
                          <ActionCard key={i} action={action} i={i} />
                        ))}
                      </div>
                    </div>

                    {/* Resource allocation */}
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl"
                      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
                      <div className="border-b border-white/6 px-5 py-4 flex items-center gap-2">
                        <Package className="h-4 w-4 text-cyan-400" />
                        <h3 className="font-semibold text-white">AI Resource Allocation</h3>
                      </div>
                      <div className="p-4 divide-y divide-white/5">
                        <ResourceRow icon={Ambulance}   label="Ambulances"       value={result.resources.ambulances}    color="#ef4444" />
                        <ResourceRow icon={HeartPulse}  label="Hospital Beds"    value={result.resources.hospitals}     color="#f87171" />
                        <ResourceRow icon={Users}       label="Rescue Personnel" value={result.resources.rescueTeams}   color="#f97316" />
                        <ResourceRow icon={Package}     label="Food Packages"    value={result.resources.foodPackages}  color="#22c55e" />
                        <ResourceRow icon={Droplets}    label="Water (liters)"   value={result.resources.waterLiters}   color="#22d3ee" />
                        <ResourceRow icon={Tent}        label="Shelter Units"    value={result.resources.shelterUnits}  color="#60a5fa" />
                        <ResourceRow icon={Users}       label="Total Personnel"  value={result.resources.personnel}     color="#a78bfa" />
                        <ResourceRow icon={Activity}    label="Helicopters"      value={result.resources.helicopters}   color="#eab308" />
                      </div>
                    </div>

                  </motion.div>
                )}

                {!result && !loading && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-16 text-center"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 mx-auto mb-4">
                      <Brain className="h-8 w-8 text-purple-400/60" />
                    </div>
                    <p className="text-lg font-semibold text-slate-300">Configure Scenario</p>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                      Select a disaster type, severity, and location. Raksh AI will generate an impact assessment, government action plan, and resource allocation.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {["Impact Prediction", "6-Hour Action Plan", "Resource Allocation", "Confidence Score"].map(tag => (
                        <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">{tag}</span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
