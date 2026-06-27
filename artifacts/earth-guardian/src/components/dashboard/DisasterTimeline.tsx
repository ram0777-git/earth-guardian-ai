import { motion } from "framer-motion";
import { timelineEvents } from "@/data/sampleData";
import { Activity, Clock, Waves, Flame, Wind, Zap, Droplets } from "lucide-react";

const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  flood: Droplets, wildfire: Flame, earthquake: Zap,
  tsunami: Waves, hurricane: Wind, drought: Activity,
};

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active:     { label: "Active",     color: "#ef4444", bg: "rgba(239,68,68,0.15)",  dot: "bg-red-500"     },
  monitoring: { label: "Monitoring", color: "#f59e0b", bg: "rgba(245,158,11,0.15)", dot: "bg-amber-500"   },
  resolved:   { label: "Resolved",   color: "#34d399", bg: "rgba(52,211,153,0.15)", dot: "bg-emerald-500" },
};

const typeColor: Record<string, string> = {
  flood: "#22d3ee", wildfire: "#fb923c", earthquake: "#818cf8",
  tsunami: "#60a5fa", hurricane: "#a78bfa", drought: "#facc15",
};

function Skeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/6 bg-white/[0.03] p-5">
      <div className="h-4 w-40 rounded bg-white/10 mb-6" />
      <div className="space-y-5">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex gap-4 pl-6">
            <div className="flex-1 h-20 rounded-xl bg-white/8" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DisasterTimeline({ loading }: { loading: boolean }) {
  if (loading) return <Skeleton />;

  return (
    <div
      className="rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl p-5"
      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <h3 className="font-semibold text-white">Disaster Timeline</h3>
        </div>
        <div className="flex gap-3 text-[10px] text-slate-500">
          {Object.entries(statusConfig).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1">
              <div className={`h-1.5 w-1.5 rounded-full ${v.dot}`} />
              {v.label}
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[13px] top-2 bottom-2 w-px bg-gradient-to-b from-cyan/40 via-primary/30 to-transparent" />

        <div className="space-y-4">
          {timelineEvents.map((ev, i) => {
            const Icon = typeIcon[ev.type] ?? Activity;
            const sc = statusConfig[ev.status] ?? statusConfig.monitoring;
            const tc = typeColor[ev.type] ?? "#60a5fa";

            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className="group relative flex gap-4 pl-8"
              >
                {/* Status dot */}
                <div className={`absolute left-[7px] top-3 h-3.5 w-3.5 rounded-full border-2 border-[#06121F] shadow-lg ${sc.dot}`} />

                <div className="flex-1 rounded-xl border border-white/6 bg-white/[0.03] p-4 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/10 cursor-default">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${tc}15`, border: `1px solid ${tc}30` }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: tc }} />
                      </div>
                      <h4 className="text-sm font-semibold text-white">{ev.title}</h4>
                    </div>
                    <span
                      className="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: sc.color, backgroundColor: sc.bg, border: `1px solid ${sc.color}35` }}
                    >
                      {sc.label}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">{ev.description}</p>
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock className="h-3 w-3" />
                    {ev.time}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
