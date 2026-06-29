import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Brain, Satellite, Cpu, Database, Zap,
  MapPin, TrendingUp, ShieldAlert, FileText, Shield,
  RefreshCw, AlertTriangle,
} from "lucide-react";
import { useAIInsights } from "@/hooks/useLiveIntelligence";
import { systemStatus } from "@/data/dashboardData";

const RISK_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.25)"  },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.10)", border: "rgba(249,115,22,0.25)" },
  moderate: { color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)" },
  low:      { color: "#34d399", bg: "rgba(52,211,153,0.10)", border: "rgba(52,211,153,0.25)" },
};

interface InsightRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: string;
}
function InsightRow({ icon: Icon, label, value, accent }: InsightRowProps) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-white/6 bg-white/[0.025] p-3">
      <div
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ background: accent ? `${accent}18` : "rgba(255,255,255,0.06)", border: `1px solid ${accent ? accent + "28" : "rgba(255,255,255,0.08)"}` }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: accent ?? "#94a3b8" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 mb-0.5">{label}</p>
        <p className="text-xs font-semibold text-white leading-snug">{value}</p>
      </div>
    </div>
  );
}

function SystemStatusRow({ icon: Icon, label, value, online = true }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  online?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
        {label}
      </div>
      <div className="flex items-center gap-1.5">
        {online && <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />}
        <span className="text-xs font-semibold text-white">{value}</span>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/6 bg-white/[0.03] p-5">
      <div className="h-4 w-28 rounded bg-white/10 mb-4" />
      <div className="space-y-3 mb-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-3 rounded bg-white/8" />)}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-14 rounded-xl bg-white/8" />)}
      </div>
    </div>
  );
}

export function AIInsightsPanel({ loading }: { loading: boolean }) {
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useAIInsights();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const ss = systemStatus;

  if (loading || isLoading) return <Skeleton />;

  const riskLevel = data?.riskLevel ?? "moderate";
  const rc = RISK_COLORS[riskLevel] ?? RISK_COLORS.moderate;

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div
      className="h-full rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl"
      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}
    >
      {/* Header */}
      <div className="border-b border-white/6 p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-cyan/20 border border-white/10">
            <Brain className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Insights</h3>
            <p className="text-[10px] text-slate-400">
              {isError ? "Raksh AI — offline" : "Raksh AI — live analysis"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/4 px-2 py-1 text-[9px] text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-2.5 w-2.5 ${isFetching ? "animate-spin" : ""}`} />
            </button>
            <div
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold"
              style={{ borderColor: rc.border, backgroundColor: rc.bg, color: rc.color }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75`} style={{ backgroundColor: rc.color }} />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: rc.color }} />
              </span>
              {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* System status */}
        <div className="space-y-2 rounded-xl border border-white/6 bg-white/[0.02] p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">System Status</p>
          <SystemStatusRow icon={Satellite} label="Satellites Online"  value={`${ss.satellitesOnline}/${ss.totalSatellites}`} />
          <SystemStatusRow icon={Cpu}       label="AI Models Active"   value={`${ss.aiModelsRunning} running`} />
          <SystemStatusRow icon={Database}  label="Data Feeds"         value={data ? `${Object.values(data.sources).filter(Boolean).length}/4 active` : `${ss.dataFeedsActive} active`} />
          <SystemStatusRow icon={Zap}       label="Processing Rate"    value={ss.processingRate} />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">System Uptime</span>
            <div className="flex items-center gap-2">
              <div className="h-1 w-16 overflow-hidden rounded-full bg-white/8">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${ss.uptime}%` }} />
              </div>
              <span className="text-xs font-semibold text-emerald-400">{ss.uptime}%</span>
            </div>
          </div>
        </div>

        {/* AI-generated insights */}
        {isError ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mx-auto mb-2" />
            <p className="text-xs text-red-400">AI insights unavailable</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-[10px] text-slate-400 underline hover:text-white"
            >
              Retry
            </button>
          </div>
        ) : data ? (
          <motion.div
            key={data.generatedAt}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-2"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Live AI Analysis</p>

            <InsightRow
              icon={MapPin}
              label="Highest Risk Area"
              value={data.highestRiskArea}
              accent="#ef4444"
            />
            <InsightRow
              icon={TrendingUp}
              label="Most Active Disaster"
              value={data.mostActiveDisaster}
              accent="#f97316"
            />
            <InsightRow
              icon={ShieldAlert}
              label="Predicted Escalation"
              value={data.predictedEscalation}
              accent="#eab308"
            />

            {/* Summary - collapsible */}
            <div
              className="rounded-xl border border-white/6 bg-white/[0.025] p-3 cursor-pointer"
              onClick={() => setSummaryOpen(p => !p)}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-3 w-3 text-cyan-400" />
                <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">AI Summary</p>
                <span className="ml-auto text-[9px] text-slate-600">{summaryOpen ? "▲" : "▼"}</span>
              </div>
              <AnimatePresence initial={false}>
                <motion.p
                  key={summaryOpen ? "open" : "closed"}
                  initial={{ height: summaryOpen ? 0 : "auto", opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-[11px] leading-relaxed text-slate-300 overflow-hidden"
                  style={{ display: "-webkit-box", WebkitLineClamp: summaryOpen ? 999 : 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                >
                  {data.summary}
                </motion.p>
              </AnimatePresence>
            </div>

            <InsightRow
              icon={Shield}
              label="Recommended Preparedness"
              value={data.preparedness}
              accent="#22c55e"
            />

            <p className="text-center text-[10px] text-slate-600">
              {lastUpdate ? `Generated ${lastUpdate}` : "Generating…"} · auto-refresh every 5 min
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-14 rounded-xl bg-white/6" />)}
          </div>
        )}
      </div>
    </div>
  );
}
