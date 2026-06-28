import { motion } from "framer-motion";
import { useGetDisasters } from "@workspace/api-client-react";
import { Droplets, Flame, Zap, Wind, Waves, AlertTriangle, MapPin, Users, Clock } from "lucide-react";

const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  flood: Droplets, wildfire: Flame, earthquake: Zap,
  hurricane: Wind, tsunami: Waves, landslide: AlertTriangle,
};

const typeColor: Record<string, string> = {
  flood: "#22d3ee", wildfire: "#fb923c", earthquake: "#818cf8",
  hurricane: "#60a5fa", tsunami: "#a78bfa", landslide: "#facc15",
};

const severityConfig: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "Critical", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  high:     { label: "High",     color: "#f97316", bg: "rgba(249,115,22,0.15)" },
  moderate: { label: "Moderate", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  low:      { label: "Low",      color: "#34d399", bg: "rgba(52,211,153,0.15)" },
};

function Skeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/6 bg-white/[0.03] p-5">
      <div className="h-4 w-40 rounded bg-white/10 mb-4" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-36 rounded-xl bg-white/8" />)}
      </div>
    </div>
  );
}

export function ActiveDisasters({ loading }: { loading: boolean }) {
  const { data: disasters = [], isLoading } = useGetDisasters();

  if (loading || isLoading) return <Skeleton />;

  return (
    <div
      className="rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl p-5"
      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">Active Disasters</h3>
          <p className="mt-0.5 text-xs text-slate-400">Real-time global event monitoring</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-1.5 text-xs font-bold text-red-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
          </span>
          {disasters.length} Active
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {disasters.map((d: any, i: number) => {
          const Icon = typeIcon[d.type] ?? AlertTriangle;
          const tc   = typeColor[d.type] ?? "#60a5fa";
          const sc   = severityConfig[d.severity] ?? severityConfig.low;

          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="group relative overflow-hidden rounded-xl border border-white/8 bg-white/[0.03] p-4 transition-all duration-300 hover:bg-white/[0.07] hover:border-white/12 cursor-default"
            >
              {/* Top accent */}
              <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl" style={{ background: `linear-gradient(90deg, transparent, ${tc}, transparent)` }} />

              {/* Icon + severity */}
              <div className="flex items-start justify-between mb-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${tc}15`, border: `1px solid ${tc}30` }}
                >
                  <span style={{ color: tc }}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                </div>
                <span
                  className="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: sc.color, backgroundColor: sc.bg }}
                >
                  {sc.label}
                </span>
              </div>

              {/* Title + location */}
              <h4 className="text-sm font-semibold text-white leading-tight">{d.name}</h4>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{d.lat.toFixed(2)}, {d.lng.toFixed(2)}</span>
              </div>

              {/* Description */}
              <div className="mt-2 text-[10px] text-slate-400 line-clamp-2">{d.description}</div>

              {/* Timestamp */}
              <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                <Clock className="h-3 w-3" />
                {d.timestamp ? new Date(d.timestamp).toLocaleString() : 'N/A'}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
