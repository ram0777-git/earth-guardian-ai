import { motion } from "framer-motion";
import { Bell, MapPin, Clock, ExternalLink } from "lucide-react";
import { useGetAlerts } from "@workspace/api-client-react";

const severityConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: "Critical", color: "#ef4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)"  },
  high:     { label: "High",     color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.3)" },
  moderate: { label: "Moderate", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  low:      { label: "Low",      color: "#34d399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.3)" },
};

function Skeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/6 bg-white/[0.03] p-5">
      <div className="h-4 w-32 rounded bg-white/10 mb-4" />
      <div className="space-y-3">
        {[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded-xl bg-white/8" />)}
      </div>
    </div>
  );
}

export function RecentAlerts({ loading }: { loading: boolean }) {
  const { data: alerts = [], isLoading } = useGetAlerts();

  if (loading || isLoading) return <Skeleton />;

  return (
    <div
      className="rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl"
      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between border-b border-white/6 p-5">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-cyan-400" />
          <h3 className="font-semibold text-white">Recent Alerts</h3>
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
            {alerts.length}
          </span>
        </div>
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
      </div>

      <div className="divide-y divide-white/4">
        {alerts.map((alert: any, i: number) => {
          const sev = severityConfig[alert.severity] ?? severityConfig.low;
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="group flex items-start gap-3 p-4 transition-colors hover:bg-white/[0.03] cursor-pointer"
            >
              {/* Severity indicator */}
              <div className="mt-1 flex-shrink-0">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: sev.color, boxShadow: `0 0 6px ${sev.color}` }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-white leading-snug">{alert.title}</p>
                  <span
                    className="flex-shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: sev.color, backgroundColor: sev.bg, border: `1px solid ${sev.border}` }}
                  >
                    {sev.label}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{alert.location}</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                  <Clock className="h-3 w-3" />
                  {alert.time}
                </div>
              </div>

              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100 mt-1" />
            </motion.div>
          );
        })}
      </div>

      <div className="border-t border-white/6 p-3">
        <button className="w-full rounded-xl py-2 text-xs font-medium text-cyan-400 transition-colors hover:bg-white/4 hover:text-cyan-300">
          View all alerts →
        </button>
      </div>
    </div>
  );
}
