import { motion } from "framer-motion";
import { TrendingUp, Minus, Flame, Globe2, Target, Users } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useGetDisasters } from "@workspace/api-client-react";
import { kpiCards } from "@/data/dashboardData";

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  flame:  Flame,
  globe:  Globe2,
  target: Target,
  users:  Users,
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min   = Math.min(...data);
  const max   = Math.max(...data);
  const range = max - min || 1;
  const W = 72, H = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  }).join(" ");
  const last = pts.split(" ").pop()!;
  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
      <circle
        cx={parseFloat(last.split(",")[0])}
        cy={parseFloat(last.split(",")[1])}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}

function KpiSkeleton() {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-5 animate-pulse">
      <div className="h-3 w-24 rounded bg-white/10" />
      <div className="mt-3 h-8 w-20 rounded bg-white/10" />
      <div className="mt-3 h-2.5 w-32 rounded bg-white/8" />
    </div>
  );
}

export function OverviewCards({ loading }: { loading: boolean }) {
  /* Pull live disaster count from API (USGS + sample) */
  const { data: disasters = [], isLoading: disLoading } = useGetDisasters();

  if (loading || disLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map(i => <KpiSkeleton key={i} />)}
      </div>
    );
  }

  /* Patch the "Active Disasters" card with a live count */
  const liveCount = disasters.length;
  const cards = kpiCards.map(c =>
    c.id === "disasters"
      ? {
          ...c,
          value:   liveCount,
          change:  `${liveCount} events worldwide`,
          sparkline: [...c.sparkline.slice(1), liveCount],
        }
      : c
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, i) => {
        const Icon      = iconMap[card.icon] ?? Globe2;
        const TrendIcon  = card.trend === "up" ? TrendingUp : Minus;
        const trendColor = card.trend === "up" ? "text-emerald-400" : "text-slate-400";

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur-xl cursor-default"
            style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}
          >
            {/* Glow on hover */}
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: `radial-gradient(ellipse at 50% 0%, ${card.glowColor} 0%, transparent 70%)` }}
            />
            {/* Top accent line */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${card.accentColor}60, transparent)` }}
            />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-white">
                  <AnimatedCounter
                    value={card.value}
                    suffix={card.suffix ?? ""}
                    decimals={card.decimals ?? 0}
                    duration={1.6}
                  />
                </p>
                <div className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${trendColor}`}>
                  <TrendIcon className="h-3 w-3" />
                  <span>{card.change}</span>
                </div>
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: `${card.accentColor}18`, border: `1px solid ${card.accentColor}30` }}
              >
                <Icon className="h-5 w-5" style={{ color: card.accentColor }} />
              </div>
            </div>

            <div className="mt-4 flex items-end justify-between">
              <Sparkline data={card.sparkline} color={card.accentColor} />
              <span className="text-[10px] text-slate-500">
                {card.id === "disasters" ? "Live from API" : "10-day trend"}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
