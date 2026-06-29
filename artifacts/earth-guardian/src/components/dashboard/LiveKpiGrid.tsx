import { memo } from "react";
import { motion } from "framer-motion";
import {
  Activity, Zap, Droplets, Wind, Flame, Mountain,
  CloudLightning, Globe2, AlertTriangle, RefreshCw,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useLiveStats } from "@/hooks/useLiveIntelligence";

interface StatCard {
  key: keyof ReturnType<typeof useLiveStats>["data"] extends { stats: infer S } ? S : never;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
  glow: string;
  description: string;
}

const CARDS: Array<{
  statKey: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
  glow: string;
  description: string;
}> = [
  { statKey: "totalActiveEvents",    label: "Active Global Events",  Icon: Activity,        accent: "#ef4444", glow: "rgba(239,68,68,0.18)",    description: "USGS + GDACS + EONET" },
  { statKey: "earthquakesToday",     label: "Earthquakes Today",     Icon: Zap,             accent: "#818cf8", glow: "rgba(129,140,248,0.18)",  description: "USGS — last 24 hours" },
  { statKey: "floods",               label: "Floods",                Icon: Droplets,        accent: "#22d3ee", glow: "rgba(34,211,238,0.18)",   description: "GDACS + EONET feeds" },
  { statKey: "cyclones",             label: "Cyclones",              Icon: Wind,            accent: "#22c55e", glow: "rgba(34,197,94,0.18)",    description: "Tropical systems active" },
  { statKey: "wildfires",            label: "Wildfires",             Icon: Flame,           accent: "#fb923c", glow: "rgba(251,146,60,0.18)",   description: "GDACS + EONET feeds" },
  { statKey: "volcanoes",            label: "Volcanoes",             Icon: Mountain,        accent: "#a78bfa", glow: "rgba(167,139,250,0.18)",  description: "Active eruption events" },
  { statKey: "storms",               label: "Storms",                Icon: CloudLightning,  accent: "#eab308", glow: "rgba(234,179,8,0.18)",    description: "GDACS + NOAA alerts" },
  { statKey: "countriesAffected",    label: "Countries Affected",    Icon: Globe2,          accent: "#60a5fa", glow: "rgba(96,165,250,0.18)",   description: "GDACS coverage" },
  { statKey: "highRiskRegions",      label: "High Risk Regions",     Icon: AlertTriangle,   accent: "#f43f5e", glow: "rgba(244,63,94,0.18)",    description: "GDACS red-level alerts" },
];

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-2.5 w-20 rounded-full bg-white/10" />
          <div className="h-7 w-14 rounded bg-white/10" />
          <div className="h-2 w-28 rounded-full bg-white/8" />
        </div>
        <div className="h-9 w-9 rounded-xl bg-white/8" />
      </div>
    </div>
  );
}

function LiveBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-400">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      Live
    </span>
  ) : (
    <span className="text-[9px] font-bold uppercase tracking-widest text-red-400">Error</span>
  );
}

export const LiveKpiGrid = memo(function LiveKpiGrid() {
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useLiveStats();

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  const sourcesOk = data
    ? Object.values(data.sources).filter(Boolean).length
    : 0;

  return (
    <div>
      {/* Section header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Live Global Intelligence
          </h2>
          {data && <LiveBadge ok={sourcesOk >= 2} />}
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-[10px] text-slate-600">Updated {lastUpdate}</span>
          )}
          {data && (
            <span className="text-[10px] text-slate-500">
              {sourcesOk}/4 sources online
            </span>
          )}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/4 px-2.5 py-1.5 text-[10px] font-medium text-slate-400 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Card grid */}
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-9">
        {CARDS.map((card, i) => {
          if (isLoading) return <CardSkeleton key={card.statKey} />;

          const value = isError || !data
            ? 0
            : (data.stats as Record<string, number>)[card.statKey] ?? 0;
          const Icon = card.Icon;

          return (
            <motion.div
              key={card.statKey}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2, transition: { duration: 0.18 } }}
              className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04] p-4 backdrop-blur-xl cursor-default"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)" }}
            >
              {/* Hover glow */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `radial-gradient(ellipse at 50% 0%, ${card.glow} 0%, transparent 70%)` }}
              />
              {/* Top accent */}
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${card.accent}50, transparent)` }}
              />

              <div className="relative">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 leading-tight">
                    {card.label}
                  </p>
                  <div
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${card.accent}18`, border: `1px solid ${card.accent}28` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: card.accent }} />
                  </div>
                </div>

                <p className="mt-1.5 text-2xl font-bold text-white">
                  {isError ? (
                    <span className="text-base text-slate-500">—</span>
                  ) : (
                    <AnimatedCounter value={value} duration={1.2} />
                  )}
                </p>

                <p className="mt-1 text-[9px] text-slate-600 truncate">{card.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {isError && (
        <p className="mt-2 text-center text-xs text-red-400/70">
          Could not load live data — check API server connectivity.
        </p>
      )}
    </div>
  );
});
