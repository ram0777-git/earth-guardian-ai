import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Wifi, Clock } from "lucide-react";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { InteractiveCharts } from "@/components/dashboard/InteractiveCharts";
import { AIInsightsPanel } from "@/components/dashboard/AIInsightsPanel";
import { RiskScoreCard } from "@/components/dashboard/RiskScoreCard";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { WeatherCard } from "@/components/dashboard/WeatherCard";
import { AIPredictionCard } from "@/components/dashboard/AIPredictionCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActiveDisasters } from "@/components/dashboard/ActiveDisasters";
import { DisasterTimeline } from "@/components/dashboard/DisasterTimeline";

function useClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const now = useClock();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1100);
    return () => clearTimeout(t);
  }, []);

  const handleRefresh = () => {
    setSpinning(true);
    setLoading(true);
    setTimeout(() => { setLoading(false); setSpinning(false); }, 1000);
  };

  return (
    <div className="relative min-h-screen bg-[#06121F] pb-20 pt-24">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_15%_10%,rgba(26,115,232,0.10)_0%,transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_85%_85%,rgba(0,188,212,0.08)_0%,transparent_60%)]" />
        <div
          className="absolute inset-0 opacity-[0.028]"
          style={{
            backgroundImage: "linear-gradient(rgba(0,188,212,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(0,188,212,0.5) 1px,transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse at 50% 0%,black 30%,transparent 80%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-8">

        {/* ── Dashboard Header ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                Mission Control
              </h1>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Live
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Real-time disaster intelligence · Global coverage
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-xs text-slate-400">
              <Wifi className="h-3.5 w-3.5 text-cyan-400" />
              All systems nominal
            </div>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={handleRefresh}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10 hover:border-white/20"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${spinning ? "animate-spin" : ""}`} />
              Refresh
            </motion.button>
          </div>
        </motion.div>

        {/* ── KPI Overview cards ───────────────────────── */}
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <motion.div variants={fadeUp}>
            <OverviewCards loading={loading} />
          </motion.div>

          {/* ── Row 2: Charts + AI Insights ───────────── */}
          <motion.div variants={fadeUp} className="mt-6 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <InteractiveCharts loading={loading} />
            </div>
            <div className="lg:col-span-4">
              <AIInsightsPanel loading={loading} />
            </div>
          </motion.div>

          {/* ── Row 3: Risk + Alerts + Weather ────────── */}
          <motion.div variants={fadeUp} className="mt-6 grid gap-6 lg:grid-cols-3">
            <RiskScoreCard loading={loading} />
            <RecentAlerts loading={loading} />
            <WeatherCard loading={loading} />
          </motion.div>

          {/* ── Row 4: AI Prediction + Quick Actions ──── */}
          <motion.div variants={fadeUp} className="mt-6 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <AIPredictionCard loading={loading} />
            </div>
            <div className="lg:col-span-4">
              <QuickActions />
            </div>
          </motion.div>

          {/* ── Row 5: Active Disasters ───────────────── */}
          <motion.div variants={fadeUp} className="mt-6">
            <ActiveDisasters loading={loading} />
          </motion.div>

          {/* ── Row 6: Timeline ───────────────────────── */}
          <motion.div variants={fadeUp} className="mt-6">
            <DisasterTimeline loading={loading} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
