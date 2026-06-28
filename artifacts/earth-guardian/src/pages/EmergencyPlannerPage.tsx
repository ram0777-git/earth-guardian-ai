import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, Brain, Package, Phone, CheckCircle2, Circle,
  Shield, AlertTriangle, MapPin, Heart, Wrench, FileText, Home,
  Info, Plus, Minus, Cpu, RotateCcw, Droplets, Radio, Pill,
  Utensils, Printer, Download, ChevronRight, Star, Zap, Clock,
  ExternalLink, CheckCircle, Users,
} from "lucide-react";
import { analyzeLocation, RISK_CATEGORY_CONFIG, type RiskAnalysisResult } from "@/data/riskData";
import { emergencySteps } from "@/data/sampleData";

/* ── Animation presets ─────────────────────────────────── */
const fadeUp  = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

/* ── Tab config ────────────────────────────────────────── */
const TABS = [
  { id: "checklist",  label: "Checklist",    icon: ClipboardCheck },
  { id: "ai-planner", label: "AI Planner",   icon: Brain },
  { id: "kit",        label: "Survival Kit", icon: Package },
  { id: "resources",  label: "Resources",    icon: Phone },
] as const;
type TabId = typeof TABS[number]["id"];

/* ── Kit categories ────────────────────────────────────── */
interface KitItem { icon: React.ElementType; name: string; unit: string; perPerson: number; category: string }
const KIT_ITEMS: KitItem[] = [
  { icon: Droplets,  name: "Drinking water",       unit: "gallons",  perPerson: 1,    category: "Water" },
  { icon: Droplets,  name: "Water purification tabs", unit: "packs", perPerson: 1,    category: "Water" },
  { icon: Utensils,  name: "Emergency food rations", unit: "servings", perPerson: 3, category: "Food" },
  { icon: Utensils,  name: "Energy bars",           unit: "bars",     perPerson: 2,  category: "Food" },
  { icon: Pill,      name: "First-aid kit",          unit: "kits",    perPerson: 0.5, category: "Medical" },
  { icon: Pill,      name: "Prescription medication", unit: "days",   perPerson: 7,   category: "Medical" },
  { icon: Pill,      name: "N95 masks",              unit: "masks",   perPerson: 3,   category: "Medical" },
  { icon: FileText,  name: "Photo ID copies",        unit: "sets",    perPerson: 1,   category: "Documents" },
  { icon: FileText,  name: "Insurance documents",    unit: "copies",  perPerson: 0.5, category: "Documents" },
  { icon: Wrench,    name: "Multi-tool",             unit: "tools",   perPerson: 0.25, category: "Tools" },
  { icon: Radio,     name: "Emergency radio (hand-crank)", unit: "radios", perPerson: 0.25, category: "Tools" },
  { icon: Zap,       name: "Flashlight + batteries", unit: "sets",   perPerson: 0.5, category: "Tools" },
  { icon: Home,      name: "Emergency blankets",     unit: "blankets", perPerson: 1,  category: "Tools" },
  { icon: Zap,       name: "Phone charger + cable",  unit: "sets",    perPerson: 0.5, category: "Tools" },
];

const KIT_CATEGORIES = ["Water", "Food", "Medical", "Documents", "Tools"] as const;
const CATEGORY_COLOR: Record<string, string> = {
  Water: "#22d3ee", Food: "#f97316", Medical: "#f87171", Documents: "#a78bfa", Tools: "#facc15",
};

/* ── Emergency contacts ────────────────────────────────── */
const EMERGENCY_CONTACTS = [
  { name: "FEMA Helpline",           number: "1-800-621-3362", emoji: "🏛️", desc: "Federal disaster assistance" },
  { name: "American Red Cross",      number: "1-800-RED-CROSS", emoji: "🏥", desc: "Emergency shelter & relief" },
  { name: "National Crisis Hotline", number: "988",            emoji: "💬", desc: "Mental health crisis support" },
  { name: "Poison Control Center",   number: "1-800-222-1222", emoji: "☠️", desc: "Chemical & poison emergencies" },
  { name: "Coast Guard (Maritime)",  number: "VHF Channel 16", emoji: "⚓", desc: "Marine emergency rescue" },
  { name: "Emergency Services",      number: "911",            emoji: "🚨", desc: "Police, Fire, Ambulance" },
  { name: "NWS Weather Alerts",      number: "1-800-275-8777", emoji: "🌀", desc: "National weather forecasts" },
  { name: "Crisis Text Line",        number: "Text HOME to 741741", emoji: "📱", desc: "Text-based crisis support" },
];

const SHELTERS = [
  { name: "City Community Center",   address: "123 Main St",   type: "General", capacity: 500, distance: "0.8 mi" },
  { name: "Riverside High School",   address: "450 River Rd",  type: "Pet-friendly", capacity: 300, distance: "1.4 mi" },
  { name: "St. Mary's Church Hall",  address: "78 Oak Ave",    type: "Medical", capacity: 150, distance: "2.1 mi" },
  { name: "National Guard Armory",   address: "901 Guard Blvd",type: "General", capacity: 800, distance: "3.2 mi" },
];

/* ── AI plan builder ───────────────────────────────────── */
function buildPlan(result: RiskAnalysisResult): string[] {
  const sorted = (Object.entries(result.risks) as [string, number][]).sort(([, a], [, b]) => b - a);
  const top = sorted[0][0];
  const threatLabel = RISK_CATEGORY_CONFIG[top as keyof typeof RISK_CATEGORY_CONFIG]?.label ?? top;

  return [
    `🗺️ Locate your two nearest evacuation routes from ${result.location} and save them offline in your maps app. Practice driving each route during daytime.`,
    `🎒 Build a ${result.level === "critical" ? "14" : result.level === "high" ? "7" : "3"}-day emergency kit. Your primary hazard is ${threatLabel} (score: ${result.risks[top as keyof typeof result.risks]}/100) — prioritize gear specific to this threat.`,
    `📞 Designate an out-of-area contact as your family's communication hub. Create a group message thread and share everyone's home/work addresses and meeting points.`,
    `🏠 Identify two safe zones in every room of your home (away from windows, under sturdy tables). ${top === "earthquake" ? "Practice Drop-Cover-Hold drills." : top === "wildfire" ? "Create a 30m defensible space around your property." : top === "flood" ? "Know your flood zone designation and elevation." : "Know your shelter-in-place vs. evacuation triggers."}`,
    `📲 Register for Earth Guardian AI alerts plus your local county emergency notification system. Set phone to receive Wireless Emergency Alerts (WEA).`,
    `💊 Maintain a 30-day supply of critical medications and store copies of all prescriptions in a waterproof container. Note the nearest 24-hour pharmacy.`,
    `🤝 Connect with your immediate neighbors to establish a mutual aid network. Share contact info and discuss who might need extra help during an emergency.`,
  ];
}

/* ── Main Page ─────────────────────────────────────────── */
export default function EmergencyPlannerPage() {
  const [activeTab, setActiveTab] = useState<TabId>("checklist");
  const [steps, setSteps] = useState(emergencySteps);

  const completedCount = steps.filter(s => s.completed).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  const toggleStep = (id: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const handlePrint = () => window.print();

  return (
    <div className="relative min-h-screen bg-[#06121F] pb-24 pt-24">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_10%_20%,rgba(16,185,129,0.07)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_90%_80%,rgba(26,115,232,0.08)_0%,transparent_60%)]" />
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: "linear-gradient(rgba(0,188,212,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(0,188,212,0.5) 1px,transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse at 50% 0%,black 30%,transparent 80%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-8">
        {/* ── Page header ──────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Emergency Response AI</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
              Emergency <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Planner</span>
            </h1>
            <p className="mt-3 max-w-xl text-base text-slate-400 leading-relaxed">
              AI-powered disaster preparedness — personalized plans, survival kits, and emergency resources for your location.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Progress badge */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-center backdrop-blur-xl">
              <div className="text-2xl font-black text-white">{progress}%</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Preparedness</div>
            </div>

            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/8 transition-all"
            >
              <Printer className="h-4 w-4" /> Print Plan
            </motion.button>
          </div>
        </motion.div>

        {/* ── Tab navigation ───────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
          className="mb-6 flex rounded-2xl border border-white/8 bg-white/[0.03] p-1.5 backdrop-blur-xl"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}
        >
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  active ? "text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {active && (
                  <motion.div layoutId="tab-bg"
                    className="absolute inset-0 rounded-xl border border-white/10 bg-white/[0.07]"
                    transition={{ type: "spring", stiffness: 380, damping: 35 }}
                  />
                )}
                <Icon className={`relative z-10 h-4 w-4 ${active ? "text-emerald-400" : ""}`} />
                <span className="relative z-10 hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* ── Tab content ──────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === "checklist" && <ChecklistTab key="checklist" steps={steps} toggleStep={toggleStep} progress={progress} completedCount={completedCount} />}
          {activeTab === "ai-planner" && <AIPlannerTab key="ai-planner" />}
          {activeTab === "kit" && <SurvivalKitTab key="kit" />}
          {activeTab === "resources" && <ResourcesTab key="resources" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 1 — Checklist
══════════════════════════════════════════════════════════ */
const PRIORITY_CONFIG = {
  essential:    { color: "#ef4444", label: "Essential",    bg: "bg-red-400/10    border-red-400/25    text-red-400" },
  recommended:  { color: "#f97316", label: "Recommended",  bg: "bg-orange-400/10 border-orange-400/25 text-orange-400" },
  optional:     { color: "#34d399", label: "Optional",     bg: "bg-emerald-400/10 border-emerald-400/25 text-emerald-400" },
};

function ChecklistTab({
  steps, toggleStep, progress, completedCount,
}: {
  steps: typeof emergencySteps;
  toggleStep: (id: string) => void;
  progress: number;
  completedCount: number;
}) {
  return (
    <motion.div key="checklist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      variants={stagger} className="grid gap-5 lg:grid-cols-3"
    >
      {/* Progress card */}
      <motion.div variants={fadeUp}
        className="rounded-2xl border border-white/8 bg-white/[0.04] p-6 backdrop-blur-xl lg:col-span-1"
        style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 border border-emerald-400/25">
            <ClipboardCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Your Progress</h3>
            <p className="text-xs text-slate-500">{completedCount} of {steps.length} completed</p>
          </div>
        </div>

        {/* Score ring */}
        <div className="flex justify-center mb-5">
          <div className="relative">
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ overflow: "visible" }}>
              <defs>
                <filter id="prog-glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
              <motion.circle cx="60" cy="60" r="48" fill="none" stroke="#10b981" strokeWidth="10"
                strokeLinecap="round" filter="url(#prog-glow)"
                strokeDasharray={2 * Math.PI * 48}
                initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - progress / 100) }}
                style={{ transformOrigin: "60px 60px", rotate: "-90deg" }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] as const }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span className="text-3xl font-black text-white"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                {progress}%
              </motion.span>
              <span className="text-[10px] text-slate-500 mt-0.5">ready</span>
            </div>
          </div>
        </div>

        {/* Priority breakdown */}
        <div className="space-y-2.5">
          {(["essential", "recommended", "optional"] as const).map(p => {
            const total = steps.filter(s => s.priority === p).length;
            const done  = steps.filter(s => s.priority === p && s.completed).length;
            const cfg   = PRIORITY_CONFIG[p];
            return (
              <div key={p} className="flex items-center gap-3">
                <div className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.bg}`}>
                  {cfg.label}
                </div>
                <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <motion.div className="h-full rounded-full"
                    style={{ backgroundColor: cfg.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(done / total) * 100}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
                <span className="text-xs font-semibold text-white">{done}/{total}</span>
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="mt-5 rounded-xl border border-amber-400/15 bg-amber-400/5 p-3">
          <div className="flex items-start gap-2">
            <Star className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Complete all <strong className="text-amber-400">Essential</strong> items first — they cover the most critical survival needs.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Checklist */}
      <motion.div variants={fadeUp}
        className="rounded-2xl border border-white/8 bg-white/[0.04] p-6 backdrop-blur-xl lg:col-span-2"
        style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)" }}
      >
        <h3 className="font-bold text-white mb-1">Emergency Preparedness Checklist</h3>
        <p className="text-xs text-slate-500 mb-5">Complete these steps to maximize your family's disaster readiness</p>

        <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
          {steps.map((step, i) => {
            const cfg = PRIORITY_CONFIG[step.priority];
            return (
              <motion.button
                key={step.id}
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ x: 3 }} whileTap={{ scale: 0.99 }}
                onClick={() => toggleStep(step.id)}
                className={`w-full flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200 ${
                  step.completed
                    ? "border-emerald-400/20 bg-emerald-400/5"
                    : "border-white/6 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/12"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {step.completed
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    : <Circle className="h-5 w-5 text-slate-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-sm ${step.completed ? "line-through text-slate-500" : "text-white"}`}>
                      {step.title}
                    </span>
                    <div className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cfg.bg}`}>
                      {cfg.label}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{step.description}</p>
                </div>
                <ChevronRight className={`h-4 w-4 flex-shrink-0 mt-0.5 transition-colors ${step.completed ? "text-emerald-400/50" : "text-slate-600"}`} />
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 2 — AI Planner
══════════════════════════════════════════════════════════ */
const PLAN_STEPS = [
  "Locating geographic risk data…",
  "Analyzing primary disaster threats…",
  "Computing evacuation priorities…",
  "Generating personalized survival plan…",
  "Finalizing safety recommendations…",
];

function AIPlannerTab() {
  const [query, setQuery]         = useState("");
  const [phase, setPhase]         = useState<"idle" | "scanning" | "done">("idle");
  const [scanStep, setScanStep]   = useState(0);
  const [result, setResult]       = useState<RiskAnalysisResult | null>(null);
  const [plan, setPlan]           = useState<string[]>([]);
  const [checkedItems, setChecked] = useState<Set<number>>(new Set());

  const handleGenerate = useCallback((q = query) => {
    if (!q.trim()) return;
    setPhase("scanning");
    setScanStep(0);
    setChecked(new Set());

    let step = 0;
    const iv = setInterval(() => {
      step++;
      setScanStep(step);
      if (step >= PLAN_STEPS.length - 1) clearInterval(iv);
    }, 380);

    setTimeout(() => {
      clearInterval(iv);
      const r = analyzeLocation(q.trim());
      setResult(r);
      setPlan(buildPlan(r));
      setPhase("done");
    }, 2200);
  }, [query]);

  const handleReset = () => { setPhase("idle"); setResult(null); setQuery(""); };

  const toggleCheck = (i: number) => setChecked(prev => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className="w-full max-w-2xl rounded-3xl border border-white/8 bg-white/[0.04] p-10 text-center backdrop-blur-xl"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/25">
                <Brain className="h-10 w-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-black text-white">AI Emergency Planner</h2>
              <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                Enter your city or country and our AI will generate a personalized, location-specific emergency survival plan.
              </p>

              <form className="mt-8" onSubmit={e => { e.preventDefault(); handleGenerate(); }}>
                <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 backdrop-blur-xl">
                  <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Enter your city or country…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none text-sm"
                  />
                  <button type="submit" disabled={!query.trim()}
                    className="flex-shrink-0 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-30"
                  >
                    Generate Plan
                  </button>
                </div>
              </form>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-slate-500">Examples:</span>
                {["Tokyo", "Miami", "London", "Mumbai", "Jakarta", "Istanbul"].map(c => (
                  <button key={c} onClick={() => { setQuery(c); handleGenerate(c); }}
                    className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs text-slate-300 hover:border-emerald-400/30 hover:text-white transition-all">
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {phase === "scanning" && (
          <motion.div key="scanning" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className="w-full max-w-lg rounded-3xl border border-white/8 bg-white/[0.04] p-10 text-center backdrop-blur-xl"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
              <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-400/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-cyan-400/30 animate-spin" style={{ animationDuration: "3s" }} />
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30">
                  <Cpu className="h-8 w-8 text-emerald-400 animate-pulse" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white">Generating plan for <span className="text-emerald-400">"{query}"</span></h2>
              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/8">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                  initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2.1, ease: "linear" }}
                />
              </div>
              <div className="mt-5 space-y-2 text-left">
                {PLAN_STEPS.map((step, i) => (
                  <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-300 ${i <= scanStep ? "opacity-100" : "opacity-0"}`}>
                    <div className={`h-4 w-4 flex-shrink-0 rounded-full flex items-center justify-center ${i < scanStep ? "bg-emerald-400/20" : "bg-cyan-400/20"}`}>
                      {i < scanStep
                        ? <CheckCircle className="h-3 w-3 text-emerald-400" />
                        : <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      }
                    </div>
                    <span className={i < scanStep ? "text-emerald-400" : "text-cyan-400"}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {phase === "done" && result && (
          <motion.div key="done" variants={stagger} initial="hidden" animate="show" className="space-y-5">
            {/* Header */}
            <motion.div variants={fadeUp} className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-xl font-black text-white">Emergency Plan — {result.location}</h2>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-400">{result.country}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">AI-generated · Confidence {result.confidence}% · {checkedItems.size}/{plan.length} completed</p>
              </div>
              <div className="flex gap-2">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 hover:text-white transition-all">
                  <Printer className="h-3.5 w-3.5" /> Print
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleReset}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 hover:text-white transition-all">
                  <RotateCcw className="h-3.5 w-3.5" /> New Plan
                </motion.button>
              </div>
            </motion.div>

            {/* Risk summary row */}
            <motion.div variants={fadeUp}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
            >
              {(Object.entries(RISK_CATEGORY_CONFIG) as [keyof typeof RISK_CATEGORY_CONFIG, typeof RISK_CATEGORY_CONFIG[keyof typeof RISK_CATEGORY_CONFIG]][]).map(([key, cfg]) => {
                const score = result.risks[key];
                return (
                  <div key={key} className="rounded-xl border border-white/6 bg-white/[0.03] p-3 text-center">
                    <div className="text-base mb-1">{cfg.emoji}</div>
                    <div className="text-lg font-black" style={{ color: cfg.color }}>{score}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{cfg.label}</div>
                  </div>
                );
              })}
            </motion.div>

            {/* Plan steps */}
            <motion.div variants={fadeUp}
              className="rounded-2xl border border-white/8 bg-white/[0.04] p-6 backdrop-blur-xl"
              style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25)" }}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/15 border border-emerald-400/25">
                  <Brain className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI Survival Plan</h3>
                  <p className="text-[10px] text-slate-500">Personalized for {result.location} · {result.level} overall risk</p>
                </div>
                <div className="ml-auto text-xs font-semibold text-emerald-400">{checkedItems.size}/{plan.length}</div>
              </div>

              <div className="space-y-3">
                {plan.map((step, i) => {
                  const done = checkedItems.has(i);
                  return (
                    <motion.button key={i}
                      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                      whileHover={{ x: 3 }}
                      onClick={() => toggleCheck(i)}
                      className={`w-full flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                        done ? "border-emerald-400/20 bg-emerald-400/5" : "border-white/6 bg-white/[0.02] hover:border-white/12 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 transition-all ${
                          done ? "border-emerald-400 bg-emerald-400/20" : "border-slate-600"
                        }`}>
                          {done && <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />}
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-xl leading-none">{step.split(" ")[0]}</span>
                        <p className={`text-sm leading-relaxed ${done ? "text-slate-500 line-through" : "text-slate-300"}`}>
                          {step.slice(step.indexOf(" ") + 1)}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 3 — Survival Kit
══════════════════════════════════════════════════════════ */
function SurvivalKitTab() {
  const [people, setPeople] = useState(2);
  const [days, setDays]     = useState(3);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggleItem = (name: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const qty = (item: KitItem) => Math.max(1, Math.ceil(item.perPerson * people * (item.category === "Water" || item.category === "Food" ? days : 1)));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
      {/* Controls */}
      <motion.div variants={stagger} initial="hidden" animate="show"
        className="grid gap-4 sm:grid-cols-2"
      >
        {/* People */}
        <motion.div variants={fadeUp} className="rounded-2xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Household Size</h3>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setPeople(p => Math.max(1, p - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white hover:bg-white/10 transition-all">
              <Minus className="h-4 w-4" />
            </button>
            <div className="flex-1 text-center">
              <span className="text-4xl font-black text-white">{people}</span>
              <p className="text-xs text-slate-500 mt-1">{people === 1 ? "person" : "people"}</p>
            </div>
            <button onClick={() => setPeople(p => Math.min(10, p + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white hover:bg-white/10 transition-all">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Days */}
        <motion.div variants={fadeUp} className="rounded-2xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Days of Supply</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[3, 7, 14, 30].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`rounded-xl border py-2.5 text-sm font-bold transition-all ${
                  days === d ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-400" : "border-white/8 text-slate-400 hover:bg-white/[0.05]"
                }`}>
                {d}d
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {days === 3 ? "Minimum recommended for any emergency" : days === 7 ? "Standard disaster preparedness recommendation" : days === 14 ? "Extended emergency coverage" : "Long-term self-sufficiency"}
          </p>
        </motion.div>
      </motion.div>

      {/* Kit items by category */}
      <div className="grid gap-4 lg:grid-cols-2">
        {KIT_CATEGORIES.map(category => {
          const items = KIT_ITEMS.filter(i => i.category === category);
          const doneCount = items.filter(i => checked.has(i.name)).length;
          const color = CATEGORY_COLOR[category];
          return (
            <motion.div key={category} variants={fadeUp} initial="hidden" animate="show"
              className="rounded-2xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur-xl"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  <h3 className="text-sm font-bold text-white">{category}</h3>
                </div>
                <span className="text-xs font-semibold" style={{ color }}>{doneCount}/{items.length}</span>
              </div>

              <div className="space-y-2">
                {items.map(item => {
                  const Icon = item.icon;
                  const done = checked.has(item.name);
                  const amount = qty(item);
                  return (
                    <button key={item.name} onClick={() => toggleItem(item.name)}
                      className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        done ? "border-emerald-400/20 bg-emerald-400/5" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border transition-all ${
                        done ? "border-emerald-400/40 bg-emerald-400/15" : "border-white/10 bg-white/[0.04]"
                      }`}>
                        {done ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Icon className="h-3.5 w-3.5 text-slate-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${done ? "line-through text-slate-500" : "text-white"}`}>{item.name}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-black text-white">{amount}</span>
                        <span className="text-[10px] text-slate-500 ml-1">{item.unit}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary banner */}
      <motion.div variants={fadeUp} initial="hidden" animate="show"
        className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 flex items-start gap-3"
      >
        <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          Quantities calculated for <strong className="text-white">{people} {people === 1 ? "person" : "people"}</strong> × <strong className="text-white">{days} days</strong>.
          Water and food scale with time; tools and documents are fixed per household.
          Store supplies in a cool, dry place and rotate perishables every 6–12 months.
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 4 — Resources
══════════════════════════════════════════════════════════ */
function ResourcesTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      variants={stagger} className="space-y-6"
    >
      {/* Emergency contacts */}
      <motion.div variants={fadeUp} initial="hidden" animate="show"
        className="rounded-2xl border border-white/8 bg-white/[0.04] p-6 backdrop-blur-xl"
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-400/15 border border-red-400/25">
            <Phone className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Emergency Hotlines</h3>
            <p className="text-[10px] text-slate-500">Save these contacts before a disaster strikes</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {EMERGENCY_CONTACTS.map(c => (
            <div key={c.name}
              className="rounded-xl border border-white/6 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition-all"
            >
              <div className="text-2xl mb-2">{c.emoji}</div>
              <h4 className="text-xs font-bold text-white mb-0.5">{c.name}</h4>
              <p className="text-[11px] text-slate-500 mb-2">{c.desc}</p>
              <div className="rounded-lg border border-white/8 bg-white/[0.04] px-2.5 py-1.5 font-mono text-xs font-bold text-cyan-400">
                {c.number}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Shelter finder */}
      <motion.div variants={fadeUp} initial="hidden" animate="show"
        className="rounded-2xl border border-white/8 bg-white/[0.04] p-6 backdrop-blur-xl"
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-400/15 border border-blue-400/25">
            <Home className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Nearby Emergency Shelters</h3>
            <p className="text-[10px] text-slate-500">Sample locations — find real shelters at ready.gov</p>
          </div>
          <a href="https://www.ready.gov/find-shelter" target="_blank" rel="noreferrer"
            className="ml-auto flex items-center gap-1.5 rounded-xl border border-blue-400/25 bg-blue-400/10 px-3 py-1.5 text-[11px] font-semibold text-blue-400 hover:bg-blue-400/15 transition-all">
            <ExternalLink className="h-3 w-3" /> Find Real Shelters
          </a>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {SHELTERS.map(s => (
            <div key={s.name} className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/[0.03] p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10 text-lg">🏠</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white">{s.name}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{s.address}</p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-400">{s.type}</span>
                  <span className="rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-400">Cap: {s.capacity}</span>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-400">{s.distance}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Resource links */}
      <motion.div variants={fadeUp} initial="hidden" animate="show"
        className="rounded-2xl border border-white/8 bg-white/[0.04] p-6 backdrop-blur-xl"
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-400/15 border border-violet-400/25">
            <Info className="h-4 w-4 text-violet-400" />
          </div>
          <h3 className="text-sm font-bold text-white">Official Resources</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Ready.gov",           desc: "Official US emergency preparedness", url: "https://www.ready.gov", emoji: "🏛️" },
            { name: "FEMA",                desc: "Federal Emergency Management Agency",url: "https://www.fema.gov", emoji: "🔷" },
            { name: "Red Cross",           desc: "Disaster relief and blood services",  url: "https://www.redcross.org", emoji: "❤️" },
            { name: "National Weather Service", desc: "US weather alerts and forecasts",url: "https://www.weather.gov", emoji: "🌤️" },
            { name: "USGS Hazards",        desc: "Earthquakes, volcanoes, landslides", url: "https://www.usgs.gov/natural-hazards", emoji: "🌍" },
            { name: "WHO Emergencies",     desc: "Global health emergency resources",  url: "https://www.who.int/emergencies", emoji: "🏥" },
          ].map(r => (
            <a key={r.name} href={r.url} target="_blank" rel="noreferrer"
              className="group flex items-start gap-3 rounded-xl border border-white/6 bg-white/[0.03] p-4 hover:bg-white/[0.06] hover:border-violet-400/20 transition-all"
            >
              <span className="text-xl flex-shrink-0">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white">{r.name}</h4>
                  <ExternalLink className="h-3 w-3 text-slate-600 group-hover:text-violet-400 transition-colors" />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{r.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </motion.div>

      {/* Preparedness tips */}
      <motion.div variants={fadeUp} initial="hidden" animate="show"
        className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-5"
      >
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-white mb-2">💡 Golden Rules of Emergency Preparedness</h4>
            <ul className="space-y-1.5">
              {[
                "Plan before disaster strikes — not during.",
                "Have paper copies of critical information (phones die).",
                "Know your local evacuation routes and shelter locations.",
                "Check on elderly neighbors and people with disabilities.",
                "Update your plan and kit every 6 months.",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="text-emerald-400 font-bold flex-shrink-0">{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
