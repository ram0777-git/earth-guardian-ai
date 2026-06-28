import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, MapPin, Users, DollarSign, Clock, AlertTriangle,
  BarChart2, Shield, ChevronRight, RefreshCw, Download,
  Flame, Waves, Wind, Activity, Mountain, Thermometer,
  Home, Truck, Package, Stethoscope, Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRaksh } from "@/components/raksh/RakshContext";

const DISASTER_TYPES = [
  { id: "earthquake", label: "Earthquake", icon: Activity, color: "amber" },
  { id: "cyclone", label: "Cyclone", icon: Wind, color: "blue" },
  { id: "flood", label: "Flood", icon: Waves, color: "cyan" },
  { id: "wildfire", label: "Wildfire", icon: Flame, color: "orange" },
  { id: "tsunami", label: "Tsunami", icon: Waves, color: "indigo" },
  { id: "volcano", label: "Volcano", icon: Mountain, color: "red" },
  { id: "heatwave", label: "Heatwave", icon: Thermometer, color: "yellow" },
  { id: "landslide", label: "Landslide", icon: Mountain, color: "green" },
];

const MAGNITUDES: Record<string, string[]> = {
  earthquake: ["M4.0-4.9 (Light)", "M5.0-5.9 (Moderate)", "M6.0-6.9 (Strong)", "M7.0-7.9 (Major)", "M8.0+ (Great)"],
  cyclone: ["Category 1", "Category 2", "Category 3", "Category 4", "Category 5"],
  flood: ["Minor Flooding", "Moderate Flooding", "Major Flooding", "Extreme Flooding", "Catastrophic Flooding"],
  wildfire: ["Small (<100 acres)", "Medium (100-1000 acres)", "Large (1000-10K acres)", "Very Large (10K-100K acres)", "Mega Fire (100K+ acres)"],
  tsunami: ["Local (1-3m waves)", "Regional (3-6m waves)", "Basin-wide (6-10m waves)", "Ocean-wide (10m+ waves)", "Mega Tsunami"],
  volcano: ["Minor Eruption", "Moderate Eruption", "Major Eruption", "Plinian Eruption", "Super-eruption"],
  heatwave: ["Mild (35-38°C)", "Moderate (38-42°C)", "Severe (42-47°C)", "Extreme (47-52°C)", "Catastrophic (52°C+)"],
  landslide: ["Small Slide", "Moderate Slide", "Large Slide", "Major Landslide", "Catastrophic Landslide"],
};

const PRESET_SCENARIOS = [
  { disasterType: "earthquake", magnitude: "M8.0+ (Great)", location: "Tokyo, Japan" },
  { disasterType: "cyclone", magnitude: "Category 5", location: "Chennai, India" },
  { disasterType: "flood", magnitude: "Extreme Flooding", location: "Mumbai, India" },
  { disasterType: "tsunami", magnitude: "Basin-wide (6-10m waves)", location: "Indonesia" },
  { disasterType: "wildfire", magnitude: "Mega Fire (100K+ acres)", location: "California, USA" },
  { disasterType: "volcano", magnitude: "Plinian Eruption", location: "Philippines" },
];

const SEVERITY_COLORS: Record<string, string> = {
  low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  moderate: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  high: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  critical: "text-red-400 bg-red-400/10 border-red-400/30",
};

const RESOURCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Medical Teams": Stethoscope,
  "Rescue Personnel": Shield,
  "Food Packages": Package,
  "Shelter Units": Home,
  "Transport": Truck,
  "Communication": Radio,
};

interface SimulationResult {
  title: string;
  overview: string;
  riskScore: number;
  affectedPopulation: number;
  potentialCasualties: { low: number; high: number };
  economicImpact: string;
  displacement: number;
  infrastructure: string;
  timeline: Array<{ hour: number; event: string; severity: string }>;
  resources: Array<{ type: string; quantity: number; unit: string; priority: string }>;
  immediateActions: string[];
  actionPlan48h: string[];
  evacuationZones: string[];
  keyRisks: string[];
  responseAgencies: string[];
}

function getRiskColor(score: number) {
  if (score >= 80) return { bar: "bg-red-500", text: "text-red-400", label: "EXTREME" };
  if (score >= 60) return { bar: "bg-orange-500", text: "text-orange-400", label: "HIGH" };
  if (score >= 40) return { bar: "bg-yellow-500", text: "text-yellow-400", label: "MODERATE" };
  return { bar: "bg-emerald-500", text: "text-emerald-400", label: "LOW" };
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export default function DisasterSimulationPage() {
  const { sendMessage } = useRaksh();
  const [disasterType, setDisasterType] = useState("earthquake");
  const [magnitude, setMagnitude] = useState("");
  const [location, setLocation] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedType = DISASTER_TYPES.find(d => d.id === disasterType);
  const magnitudeOptions = MAGNITUDES[disasterType] ?? [];

  const handleSimulate = async () => {
    if (!location.trim() || !magnitude) return;
    setIsRunning(true);
    setResult(null);
    setError(null);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const resp = await fetch(`${base}/api/raksh/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disasterType, magnitude, location: location.trim() }),
      });
      const data = await resp.json() as { simulation?: SimulationResult; error?: string };
      if (!resp.ok || data.error) throw new Error(data.error ?? "Simulation failed");
      setResult(data.simulation!);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setIsRunning(false);
    }
  };

  const handlePreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setDisasterType(preset.disasterType);
    setMagnitude(preset.magnitude);
    setLocation(preset.location);
  };

  const handleAskRaksh = () => {
    if (!result) return;
    void sendMessage(`Tell me more about the response plan for a ${magnitude} ${disasterType} in ${location}. What are the most critical resource gaps and how can we prepare better?`);
  };

  const handleExport = () => {
    if (!result) return;
    const lines = [
      `# Disaster Simulation Report`,
      `## ${result.title}`,
      ``,
      `### Overview`,
      result.overview,
      ``,
      `### Risk Score: ${result.riskScore}/100 (${getRiskColor(result.riskScore).label})`,
      ``,
      `### Impact Assessment`,
      `- Affected Population: ${formatNumber(result.affectedPopulation)}`,
      `- Potential Casualties: ${formatNumber(result.potentialCasualties.low)} – ${formatNumber(result.potentialCasualties.high)}`,
      `- Displacement: ${formatNumber(result.displacement)}`,
      `- Economic Impact: ${result.economicImpact}`,
      ``,
      `### Timeline`,
      ...result.timeline.map(t => `- Hour ${t.hour}: [${t.severity.toUpperCase()}] ${t.event}`),
      ``,
      `### Immediate Actions`,
      ...result.immediateActions.map((a, i) => `${i + 1}. ${a}`),
      ``,
      `### Resource Requirements`,
      ...result.resources.map(r => `- ${r.type}: ${r.quantity} ${r.unit} (${r.priority})`),
      ``,
      `---`,
      `*Generated by Earth Guardian AI — Raksh Simulation Engine*`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `simulation-${disasterType}-${location.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-screen bg-[#06121F] pb-20 pt-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_10%,rgba(239,68,68,0.06)_0%,transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_80%_85%,rgba(0,188,212,0.06)_0%,transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 border border-red-500/30">
              <Zap className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Disaster Simulation</h1>
              <p className="text-sm text-slate-400">AI-powered what-if scenario modeling</p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Configuration Panel */}
          <div className="lg:col-span-4 space-y-4">
            {/* Disaster type */}
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
              <p className="mb-3 text-sm font-semibold text-white">Disaster Type</p>
              <div className="grid grid-cols-2 gap-2">
                {DISASTER_TYPES.map(type => {
                  const Icon = type.icon;
                  const isSelected = disasterType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => { setDisasterType(type.id); setMagnitude(""); }}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                        isSelected
                          ? "border-red-500/50 bg-red-500/15 text-red-300"
                          : "border-white/8 bg-white/3 text-slate-400 hover:border-white/15 hover:text-slate-200"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Magnitude */}
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
              <p className="mb-3 text-sm font-semibold text-white">Magnitude / Intensity</p>
              <div className="space-y-1.5">
                {magnitudeOptions.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => setMagnitude(m)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm transition-all",
                      magnitude === m
                        ? "border-red-500/50 bg-red-500/15 text-red-300"
                        : "border-white/8 bg-white/3 text-slate-400 hover:border-white/15 hover:text-slate-200"
                    )}
                  >
                    <span>{m}</span>
                    <span className={cn("text-xs font-medium",
                      i === 4 ? "text-red-400" : i === 3 ? "text-orange-400" : i === 2 ? "text-yellow-400" : "text-emerald-400"
                    )}>
                      {i === 4 ? "Extreme" : i === 3 ? "Severe" : i === 2 ? "High" : i === 1 ? "Moderate" : "Low"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
              <p className="mb-3 text-sm font-semibold text-white">Target Location</p>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <MapPin className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="City, region, or country…"
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                  onKeyDown={e => e.key === "Enter" && handleSimulate()}
                />
              </div>
            </div>

            {/* Run button */}
            <button
              onClick={handleSimulate}
              disabled={isRunning || !location.trim() || !magnitude}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-900/30 hover:from-red-500 hover:to-orange-500 disabled:opacity-40 transition-all"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Running Simulation…
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Run Simulation
                </>
              )}
            </button>

            {/* Preset scenarios */}
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
              <p className="mb-3 text-sm font-semibold text-white">Quick Scenarios</p>
              <div className="space-y-1.5">
                {PRESET_SCENARIOS.map(preset => (
                  <button
                    key={`${preset.disasterType}-${preset.location}`}
                    onClick={() => handlePreset(preset)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/8 bg-white/3 px-3 py-2 text-xs text-slate-400 hover:border-white/15 hover:text-slate-200 transition-all"
                  >
                    <span>{preset.magnitude} {preset.disasterType}</span>
                    <span className="text-slate-500">{preset.location}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-8">
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            {isRunning && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-white/8 bg-white/3 p-12 flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-red-400" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">Running AI Simulation</p>
                  <p className="text-sm text-slate-400 mt-1">Analyzing {magnitude} {disasterType} scenario in {location}…</p>
                </div>
                <div className="flex gap-2">
                  {["Modeling impact", "Calculating resources", "Building timeline", "Generating report"].map((step, i) => (
                    <motion.span
                      key={step}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                      className="text-[10px] text-slate-500"
                    >
                      {step}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {!result && !isRunning && !error && (
              <div className="rounded-2xl border border-white/8 bg-white/3 p-12 flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <BarChart2 className="h-8 w-8 text-slate-600" />
                </div>
                <div>
                  <p className="text-white font-semibold">Configure & Run a Simulation</p>
                  <p className="text-sm text-slate-400 mt-1">Select a disaster type, magnitude, and location to model the impact scenario.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {["What if a M8 quake hits Tokyo?", "Category 5 cyclone in Chennai", "Mega flood in Mumbai"].map(eg => (
                    <span key={eg} className="text-xs text-slate-500 border border-white/8 rounded-lg px-2.5 py-1">{eg}</span>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Title + actions */}
                  <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                    <div>
                      <p className="text-xs font-medium text-red-400 uppercase tracking-widest mb-1">Simulation Results</p>
                      <h2 className="text-lg font-bold text-white">{result.title}</h2>
                      <p className="text-sm text-slate-400 mt-1">{result.overview}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={handleExport} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 transition-colors">
                        <Download className="h-3.5 w-3.5" />
                        Export
                      </button>
                      <button onClick={handleAskRaksh} className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-500/20 transition-colors">
                        Ask Raksh AI
                      </button>
                    </div>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { icon: BarChart2, label: "Risk Score", value: `${result.riskScore}/100`, color: getRiskColor(result.riskScore).text, sub: getRiskColor(result.riskScore).label },
                      { icon: Users, label: "Affected", value: formatNumber(result.affectedPopulation), color: "text-orange-400", sub: "people" },
                      { icon: AlertTriangle, label: "Casualties", value: `${formatNumber(result.potentialCasualties.low)}–${formatNumber(result.potentialCasualties.high)}`, color: "text-red-400", sub: "estimated" },
                      { icon: Home, label: "Displaced", value: formatNumber(result.displacement), color: "text-yellow-400", sub: "people" },
                    ].map(kpi => {
                      const Icon = kpi.icon;
                      return (
                        <div key={kpi.label} className="rounded-2xl border border-white/8 bg-white/3 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-4 w-4 text-slate-500" />
                            <span className="text-xs text-slate-500">{kpi.label}</span>
                          </div>
                          <p className={cn("text-xl font-bold", kpi.color)}>{kpi.value}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{kpi.sub}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Risk score bar */}
                  <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-white">Composite Risk Score</p>
                      <span className={cn("text-sm font-bold", getRiskColor(result.riskScore).text)}>
                        {result.riskScore}/100 — {getRiskColor(result.riskScore).label}
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-white/8 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.riskScore}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className={cn("h-full rounded-full", getRiskColor(result.riskScore).bar)}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-slate-600">
                      <span>Low Risk</span><span>Moderate</span><span>High</span><span>Extreme</span>
                    </div>
                  </div>

                  {/* Impact timeline */}
                  <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
                    <p className="mb-4 text-sm font-semibold text-white">Impact Timeline — First 72 Hours</p>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {result.timeline.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-start gap-3"
                        >
                          <div className="flex-shrink-0 w-16 text-right">
                            <span className="text-xs text-slate-500">H+{item.hour}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-0.5",
                              item.severity === "critical" ? "bg-red-500" :
                              item.severity === "high" ? "bg-orange-500" :
                              item.severity === "moderate" ? "bg-yellow-500" : "bg-emerald-500"
                            )} />
                            <p className="text-sm text-slate-300 flex-1">{item.event}</p>
                            <span className={cn("text-[10px] font-medium rounded-md border px-2 py-0.5 flex-shrink-0", SEVERITY_COLORS[item.severity] ?? "text-slate-400 border-white/10 bg-white/5")}>
                              {item.severity}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Resources + Actions */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Resources */}
                    <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
                      <p className="mb-3 text-sm font-semibold text-white">Required Resources</p>
                      <div className="space-y-2">
                        {result.resources.map((r, idx) => {
                          const Icon = RESOURCE_ICONS[r.type] ?? Package;
                          return (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/5">
                                <Icon className="h-3.5 w-3.5 text-slate-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-300 truncate">{r.type}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs font-semibold text-white">{formatNumber(r.quantity)} <span className="font-normal text-slate-500">{r.unit}</span></p>
                                <span className={cn("text-[10px]",
                                  r.priority === "immediate" ? "text-red-400" :
                                  r.priority === "high" ? "text-orange-400" :
                                  r.priority === "medium" ? "text-yellow-400" : "text-emerald-400"
                                )}>
                                  {r.priority}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Immediate Actions */}
                    <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
                      <p className="mb-3 text-sm font-semibold text-white">Immediate Actions</p>
                      <div className="space-y-2">
                        {result.immediateActions.map((action, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20 border border-red-500/30 mt-0.5">
                              <span className="text-[9px] font-bold text-red-400">{idx + 1}</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">{action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 48-hour plan + Key Risks */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
                      <p className="mb-3 text-sm font-semibold text-white">48-Hour Action Plan</p>
                      <div className="space-y-2">
                        {result.actionPlan48h.map((a, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-300">{a}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
                      <p className="mb-3 text-sm font-semibold text-white">Key Risks</p>
                      <div className="space-y-2">
                        {result.keyRisks.map((r, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-300">{r}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 border-t border-white/8 pt-3">
                        <p className="text-xs text-slate-500 mb-1.5">Response Agencies</p>
                        <div className="flex flex-wrap gap-1">
                          {result.responseAgencies.map((a, idx) => (
                            <span key={idx} className="text-[10px] text-slate-400 border border-white/10 rounded-md px-2 py-0.5">{a}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Economic + Infrastructure */}
                  <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-yellow-500" />
                          <p className="text-xs font-semibold text-white">Economic Impact</p>
                        </div>
                        <p className="text-sm text-slate-300">{result.economicImpact}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Home className="h-4 w-4 text-orange-500" />
                          <p className="text-xs font-semibold text-white">Infrastructure Damage</p>
                        </div>
                        <p className="text-sm text-slate-300">{result.infrastructure}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
