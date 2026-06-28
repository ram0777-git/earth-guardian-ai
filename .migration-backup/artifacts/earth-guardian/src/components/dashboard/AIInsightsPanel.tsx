import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Brain, Satellite, Cpu, Database, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { aiInsights, systemStatus } from "@/data/dashboardData";

const priorityConfig: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.25)"  },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.10)", border: "rgba(249,115,22,0.25)" },
  moderate: { color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.25)" },
  low:      { color: "#34d399", bg: "rgba(52,211,153,0.10)", border: "rgba(52,211,153,0.25)" },
};

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
      <div className="space-y-3 mb-5">
        {[1,2,3,4].map(i => <div key={i} className="h-3 rounded bg-white/8" />)}
      </div>
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/8" />)}
      </div>
    </div>
  );
}

export function AIInsightsPanel({ loading }: { loading: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) return <Skeleton />;

  const ss = systemStatus;

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
            <h3 className="font-semibold text-white">AI Status</h3>
            <p className="text-[10px] text-slate-400">Guardian Intelligence Engine</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Online
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* System status grid */}
        <div className="mb-4 space-y-2.5 rounded-xl border border-white/6 bg-white/[0.02] p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">System Status</p>
          <SystemStatusRow icon={Satellite}  label="Satellites Online"  value={`${ss.satellitesOnline}/${ss.totalSatellites}`} />
          <SystemStatusRow icon={Cpu}        label="AI Models Active"   value={`${ss.aiModelsRunning} running`}     />
          <SystemStatusRow icon={Database}   label="Data Feeds"         value={`${ss.dataFeedsActive} active`}      />
          <SystemStatusRow icon={Zap}        label="Processing Rate"    value={ss.processingRate}                   />
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

        {/* AI Insights */}
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Latest Insights</p>
          <div className="space-y-2.5">
            {aiInsights.map((ins, i) => {
              const pc = priorityConfig[ins.priority] ?? priorityConfig.low;
              const isOpen = expanded === ins.id;

              return (
                <motion.div
                  key={ins.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="overflow-hidden rounded-xl border cursor-pointer"
                  style={{ borderColor: pc.border, backgroundColor: pc.bg }}
                  onClick={() => setExpanded(isOpen ? null : ins.id)}
                >
                  <div className="flex items-start justify-between gap-2 p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                          style={{ color: pc.color, backgroundColor: `${pc.color}20` }}
                        >
                          {ins.priority}
                        </span>
                        <span className="text-[10px] text-slate-400">{ins.region}</span>
                      </div>
                      <p className="text-[11px] font-semibold text-white">{ins.category}</p>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="mt-1.5 text-[11px] leading-relaxed text-slate-300 overflow-hidden"
                          >
                            {ins.text}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[10px] font-bold" style={{ color: pc.color }}>{ins.confidence}%</span>
                      <span className="text-[9px] text-slate-500">{ins.time}</span>
                      {isOpen ? <ChevronUp className="h-3 w-3 text-slate-500" /> : <ChevronDown className="h-3 w-3 text-slate-500" />}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <p className="mt-3 text-center text-[10px] text-slate-600">
          Last sync: {systemStatus.lastSync} · Auto-refresh every 2 min
        </p>
      </div>
    </div>
  );
}
