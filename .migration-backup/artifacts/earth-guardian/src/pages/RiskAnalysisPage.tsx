import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip,
} from "recharts";
import {
  Search, MapPin, Zap, Shield, AlertTriangle, ChevronRight,
  Cpu, Globe, TrendingUp, RotateCcw, CheckCircle, Info,
} from "lucide-react";
import {
  analyzeLocation, RISK_CATEGORY_CONFIG, SEV_COLOR, scoreToLevel,
  type RiskAnalysisResult, type RiskScores,
} from "@/data/riskData";

/* ── Animations ──────────────────────────────────────── */
const fadeUp  = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

/* ── Scan steps ──────────────────────────────────────── */
const SCAN_STEPS = [
  "Locating geographic coordinates…",
  "Cross-referencing historical disaster records…",
  "Running seismic & atmospheric models…",
  "Computing climate risk vectors…",
  "Generating AI risk assessment…",
  "Building safety recommendations…",
];

const EXAMPLE_CITIES = ["Tokyo", "Miami", "Dhaka", "Los Angeles", "Istanbul", "Jakarta", "Sydney", "Nepal"];

/* ── Typewriter hook ─────────────────────────────────── */
function useTypewriter(text: string, speed = 18, enabled = true) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!enabled) { setDisplayed(text); return; }
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, ++i)); }
      else clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, enabled]);
  return displayed;
}

/* ── Risk Gauge (SVG semicircle) ─────────────────────── */
function RiskGauge({
  score, label, emoji, color, delay = 0,
}: { score: number; label: string; emoji: string; color: string; delay?: number }) {
  const R    = 52;
  const CX   = 68, CY = 68;
  const circ = Math.PI * R;           // ≈ 163.4
  const dashoffset = circ * (1 - score / 100);
  const level    = scoreToLevel(score);
  const levelClr = SEV_COLOR[level];

  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col items-center rounded-2xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur-xl"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)" }}
    >
      <div className="relative">
        <svg width="136" height="80" viewBox="0 0 136 80" style={{ overflow: "visible" }}>
          {/* Glow */}
          <defs>
            <filter id={`glow-${label}`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Track */}
          <path d={`M ${CX-R} ${CY} A ${R} ${R} 0 0 1 ${CX+R} ${CY}`}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="11" strokeLinecap="round" />
          {/* Fill */}
          <motion.path
            d={`M ${CX-R} ${CY} A ${R} ${R} 0 0 1 ${CX+R} ${CY}`}
            fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
            filter={`url(#glow-${label})`}
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: dashoffset }}
            transition={{ duration: 1.5, delay: delay + 0.15, ease: [0.22, 1, 0.36, 1] as const }}
          />
        </svg>
        {/* Score overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <motion.span
            className="text-2xl font-black text-white leading-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.8 }}
          >{score}</motion.span>
          <span className="text-[10px] text-white/30 leading-none mt-0.5">/ 100</span>
        </div>
      </div>

      <div className="mt-2 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-base leading-none">{emoji}</span>
          <span className="text-xs font-bold text-white">{label}</span>
        </div>
        <motion.div
          className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{ color: levelClr, backgroundColor: `${levelClr}18` }}
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 1 }}
        >
          {level} risk
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Overall Score Ring ──────────────────────────────── */
function OverallScoreRing({ score, level }: { score: number; level: string }) {
  const R    = 68;
  const circ = 2 * Math.PI * R;
  const clr  = SEV_COLOR[level] ?? "#f59e0b";
  const offset = circ * (1 - score / 100);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 180 180" style={{ overflow: "visible" }}>
        <defs>
          <filter id="overall-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="13" />
        <motion.circle cx="90" cy="90" r={R} fill="none" stroke={clr} strokeWidth="13"
          strokeLinecap="round" filter="url(#overall-glow)"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          style={{ transformOrigin: "90px 90px", rotate: "-90deg" }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] as const }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span className="text-5xl font-black text-white" style={{ color: clr }}
          initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
        >{score}</motion.span>
        <span className="text-xs text-white/35 font-medium mt-0.5">out of 100</span>
      </div>
    </div>
  );
}

/* ── Radar Chart ─────────────────────────────────────── */
function RiskRadar({ risks }: { risks: RiskScores }) {
  const data = (Object.entries(RISK_CATEGORY_CONFIG) as [keyof RiskScores, (typeof RISK_CATEGORY_CONFIG)[keyof RiskScores]][])
    .map(([key, cfg]) => ({ subject: cfg.emoji + " " + cfg.label, value: risks[key], fullMark: 100 }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" gridType="polygon" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: 600 }}
        />
        <Radar name="Risk" dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.13} strokeWidth={2}
          dot={{ fill: "#22d3ee", r: 3, fillOpacity: 0.9 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/* ── Bar Chart ───────────────────────────────────────── */
function RiskBarChart({ risks }: { risks: RiskScores }) {
  const data = (Object.entries(RISK_CATEGORY_CONFIG) as [keyof RiskScores, (typeof RISK_CATEGORY_CONFIG)[keyof RiskScores]][])
    .map(([key, cfg]) => ({
      name:  cfg.emoji,
      value: risks[key],
      color: cfg.color,
      label: cfg.label,
    }));

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} barCategoryGap="28%" margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
        <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 13 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{ background: "rgba(6,18,31,0.96)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", fontSize: 12 }}
          formatter={(v: number, _: string, p: any) => [`${v}/100`, p.payload.label]}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Main Page ───────────────────────────────────────── */
type Phase = "idle" | "scanning" | "done";

export default function RiskAnalysisPage() {
  const [phase,    setPhase]    = useState<Phase>("idle");
  const [query,    setQuery]    = useState("");
  const [result,   setResult]   = useState<RiskAnalysisResult | null>(null);
  const [scanStep, setScanStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Scanning sequence */
  useEffect(() => {
    if (phase !== "scanning") return;
    setScanStep(0);
    let step = 0;
    const iv = setInterval(() => {
      step++;
      setScanStep(step);
      if (step >= SCAN_STEPS.length - 1) clearInterval(iv);
    }, 340);
    const done = setTimeout(() => {
      clearInterval(iv);
      const r = analyzeLocation(query);
      setResult(r);
      setPhase("done");
    }, 2400);
    return () => { clearInterval(iv); clearTimeout(done); };
  }, [phase, query]);

  const handleSearch = (q = query) => {
    if (!q.trim()) return;
    setQuery(q.trim());
    setPhase("scanning");
  };

  const handleReset = () => {
    setPhase("idle");
    setResult(null);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="relative min-h-screen bg-[#06121F] pb-24 pt-24">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_10%,rgba(26,115,232,0.10)_0%,transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_80%_80%,rgba(0,188,212,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_35%_at_50%_50%,rgba(139,92,246,0.04)_0%,transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.024]"
          style={{
            backgroundImage: "linear-gradient(rgba(0,188,212,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(0,188,212,0.5) 1px,transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse at 50% 0%,black 30%,transparent 80%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-8">
        <AnimatePresence mode="wait">

          {/* ── IDLE: Search view ──────────────────────── */}
          {phase === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center">
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8 text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-4 py-1.5">
                  <Cpu className="h-3.5 w-3.5 text-violet-400" />
                  <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Powered by Earth Guardian AI</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                  AI Risk <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Analysis</span>
                </h1>
                <p className="mt-4 max-w-xl mx-auto text-base text-slate-400 leading-relaxed">
                  Search any city or country to get an instant AI-generated disaster risk assessment — earthquake, flood, cyclone, wildfire, heatwave, and landslide.
                </p>
              </motion.div>

              {/* Search bar */}
              <motion.form
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.55 }}
                onSubmit={e => { e.preventDefault(); handleSearch(); }}
                className="w-full max-w-2xl"
              >
                <div className="relative flex items-center rounded-2xl border border-white/12 bg-white/[0.05] backdrop-blur-xl"
                  style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
                  <Search className="ml-5 h-5 w-5 flex-shrink-0 text-slate-400" />
                  <input
                    ref={inputRef}
                    autoFocus
                    type="text"
                    placeholder="Enter a city or country…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="flex-1 bg-transparent px-4 py-5 text-base text-white placeholder:text-slate-500 outline-none"
                  />
                  <button type="submit" disabled={!query.trim()}
                    className="mr-2 flex-shrink-0 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-30"
                  >
                    Analyze
                  </button>
                </div>
              </motion.form>

              {/* Example cities */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-slate-500">Try:</span>
                {EXAMPLE_CITIES.map(city => (
                  <motion.button key={city} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => handleSearch(city)}
                    className="rounded-full border border-white/8 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:border-cyan-400/30 hover:text-white hover:bg-white/8 transition-all"
                  >
                    {city}
                  </motion.button>
                ))}
              </motion.div>

              {/* Stats row */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                className="mt-16 grid grid-cols-3 gap-6 w-full max-w-xl"
              >
                {[
                  { value: "120+", label: "Cities & Countries", icon: Globe },
                  { value: "7",    label: "Disaster Types",     icon: Shield },
                  { value: "97%",  label: "Data Accuracy",      icon: TrendingUp },
                ].map(({ value, label, icon: Icon }) => (
                  <div key={label} className="flex flex-col items-center gap-2 rounded-2xl border border-white/6 bg-white/[0.03] p-5 text-center">
                    <Icon className="h-5 w-5 text-cyan-400" />
                    <span className="text-2xl font-black text-white">{value}</span>
                    <span className="text-[11px] text-slate-400">{label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* ── SCANNING ──────────────────────────────── */}
          {phase === "scanning" && (
            <motion.div key="scanning" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-full max-w-lg rounded-3xl border border-white/8 bg-white/[0.03] p-10 text-center backdrop-blur-xl"
                style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)" }}
              >
                {/* Animated AI icon */}
                <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full border border-indigo-400/30 animate-spin" style={{ animationDuration: "3s" }} />
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-400/30">
                    <Cpu className="h-8 w-8 text-cyan-400 animate-pulse" />
                  </div>
                </div>

                <h2 className="text-xl font-bold text-white">Analyzing <span className="text-cyan-400">"{query}"</span></h2>
                <p className="mt-1 text-sm text-slate-400">Earth Guardian AI is processing…</p>

                {/* Progress bar */}
                <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.3, ease: "linear" }}
                  />
                </div>

                {/* Step list */}
                <div className="mt-6 space-y-2 text-left">
                  {SCAN_STEPS.map((step, i) => (
                    <motion.div key={i} className={`flex items-center gap-3 text-sm transition-all duration-300 ${i <= scanStep ? "opacity-100" : "opacity-0"}`}>
                      <div className={`h-4 w-4 flex-shrink-0 rounded-full flex items-center justify-center ${i < scanStep ? "bg-emerald-400/20" : i === scanStep ? "bg-cyan-400/20" : "bg-white/6"}`}>
                        {i < scanStep
                          ? <CheckCircle className="h-3 w-3 text-emerald-400" />
                          : <div className={`h-1.5 w-1.5 rounded-full ${i === scanStep ? "bg-cyan-400 animate-pulse" : "bg-white/20"}`} />
                        }
                      </div>
                      <span className={i < scanStep ? "text-emerald-400" : i === scanStep ? "text-cyan-400" : "text-slate-400"}>{step}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── RESULTS ───────────────────────────────── */}
          {phase === "done" && result && (
            <ResultsDashboard result={result} query={query} onReset={handleReset} />
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Results Dashboard ───────────────────────────────── */
function ResultsDashboard({ result, query, onReset }: { result: RiskAnalysisResult; query: string; onReset: () => void }) {
  const { risks, overall, level, confidence, location, country, explanation, recommendations } = result;
  const levelClr = SEV_COLOR[level] ?? "#f59e0b";

  const typewriterText = explanation.replace(/\*\*(.*?)\*\*/g, "$1");
  const displayed = useTypewriter(typewriterText, 18);

  const radarKey = useMemo(() => `radar-${location}`, [location]);

  return (
    <motion.div key="results" variants={stagger} initial="hidden" animate="show" className="space-y-6">

      {/* ── Header row ──── */}
      <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <MapPin className="h-4 w-4 text-cyan-400" />
            <h2 className="text-2xl font-black text-white">{location}</h2>
            {country !== "Unknown" && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-xs text-slate-400">{country}</span>
            )}
            <div className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
              style={{ color: levelClr, backgroundColor: `${levelClr}18`, border: `1px solid ${levelClr}30` }}>
              {level} risk
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-400">AI analysis · Confidence <span className="font-bold text-white">{confidence}%</span> · Updated just now</p>
        </div>
        <div className="flex gap-2">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onReset}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white hover:bg-white/8 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" /> New Search
          </motion.button>
        </div>
      </motion.div>

      {/* ── Overall + Radar ──── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Overall score card */}
        <motion.div variants={fadeUp}
          className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] p-6 backdrop-blur-xl lg:col-span-1"
          style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)" }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Overall AI Risk Score</p>
          <OverallScoreRing score={overall} level={level} />
          <div className="mt-5 text-center">
            <p className="text-xs text-slate-500">Confidence</p>
            <div className="mt-1 flex items-center gap-1.5 justify-center">
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/8">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                  initial={{ width: 0 }} animate={{ width: `${confidence}%` }} transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <span className="text-xs font-bold text-white">{confidence}%</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-5 grid w-full grid-cols-3 gap-2">
            {[
              { label: "Critical", count: Object.values(risks).filter(v => v >= 70).length, color: "#ef4444" },
              { label: "High",     count: Object.values(risks).filter(v => v >= 50 && v < 70).length, color: "#f97316" },
              { label: "Low",      count: Object.values(risks).filter(v => v < 28).length, color: "#34d399" },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center rounded-xl border border-white/6 bg-white/[0.03] py-2.5">
                <span className="text-lg font-black" style={{ color: s.color }}>{s.count}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Radar + bar chart */}
        <motion.div variants={fadeUp}
          className="rounded-2xl border border-white/8 bg-white/[0.04] p-6 backdrop-blur-xl lg:col-span-2"
          style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)" }}
        >
          <h3 className="mb-1 text-sm font-semibold text-white">Risk Profile Comparison</h3>
          <p className="text-xs text-slate-500 mb-4">Radar map of all 6 risk categories</p>
          <div className="grid grid-cols-2 gap-4 items-center">
            <div key={radarKey}>
              <RiskRadar risks={risks} />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Category breakdown</p>
              <RiskBarChart risks={risks} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── 6 Gauge Cards ──── */}
      <motion.div variants={stagger} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {(Object.entries(RISK_CATEGORY_CONFIG) as [keyof RiskScores, (typeof RISK_CATEGORY_CONFIG)[keyof RiskScores]][])
          .map(([key, cfg], i) => (
            <RiskGauge
              key={key}
              score={risks[key]}
              label={cfg.label}
              emoji={cfg.emoji}
              color={cfg.color}
              delay={i * 0.06}
            />
          ))
        }
      </motion.div>

      {/* ── AI Explanation + Recommendations ──── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* AI Explanation */}
        <motion.div variants={fadeUp}
          className="rounded-2xl border border-white/8 bg-white/[0.04] p-6 backdrop-blur-xl lg:col-span-3"
          style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-400/25">
              <Cpu className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Risk Explanation</h3>
              <p className="text-[10px] text-slate-500">Earth Guardian AI · Natural language analysis</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] font-bold text-emerald-400">Live</span>
            </div>
          </div>

          <div className="rounded-xl border border-indigo-400/10 bg-indigo-400/5 p-4">
            <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
              {displayed}
              <span className="animate-pulse text-cyan-400">▌</span>
            </p>
          </div>

          {/* Confidence bar */}
          <div className="mt-4 flex items-center gap-3">
            <Info className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
            <p className="text-[11px] text-slate-500">Based on USGS, NOAA, historical disaster, and climate model datasets. Analysis accuracy: {confidence}%.</p>
          </div>
        </motion.div>

        {/* Safety Recommendations */}
        <motion.div variants={fadeUp}
          className="rounded-2xl border border-white/8 bg-white/[0.04] p-6 backdrop-blur-xl lg:col-span-2"
          style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-400/25">
              <Shield className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Safety Recommendations</h3>
              <p className="text-[10px] text-slate-500">{recommendations.length} priority actions</p>
            </div>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {recommendations.map((rec, i) => {
              const pColor = { critical: "#ef4444", high: "#f97316", moderate: "#f59e0b" }[rec.priority];
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="flex gap-3 rounded-xl border border-white/6 bg-white/[0.03] p-3"
                >
                  <span className="text-xl leading-none mt-0.5">{rec.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: pColor }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: pColor }}>{rec.priority}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{rec.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Disclaimer ──── */}
      <motion.div variants={fadeUp}
        className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3"
      >
        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-400 mt-0.5" />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          This analysis is generated by Earth Guardian AI for educational and preparedness purposes only. 
          It is not a substitute for official government emergency management guidance. 
          Always follow local authority instructions during disaster events.
        </p>
      </motion.div>

    </motion.div>
  );
}
