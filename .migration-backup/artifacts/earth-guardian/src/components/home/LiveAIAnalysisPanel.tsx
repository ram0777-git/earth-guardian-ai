import { AnimatePresence, motion } from "framer-motion";
import { Activity, Radio, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useEffect, useState } from "react";

const scans = [
  { location: "Tokyo, Japan",       risk: "Flood Risk",        level: "Medium",   pct: 62,  trend: "up",   color: "text-amber-400",   bar: "bg-amber-400"  },
  { location: "California, USA",    risk: "Wildfire Risk",     level: "Critical", pct: 91,  trend: "up",   color: "text-red-400",     bar: "bg-red-400"    },
  { location: "Philippines",        risk: "Typhoon Risk",      level: "High",     pct: 78,  trend: "up",   color: "text-orange-400",  bar: "bg-orange-400" },
  { location: "Hyderabad, India",   risk: "Heatwave Risk",     level: "Moderate", pct: 55,  trend: "stable",color:"text-yellow-400",  bar: "bg-yellow-400" },
  { location: "Bangladesh",         risk: "Cyclone Risk",      level: "High",     pct: 74,  trend: "up",   color: "text-orange-400",  bar: "bg-orange-400" },
  { location: "Turkey",             risk: "Seismic Activity",  level: "Elevated", pct: 68,  trend: "stable",color:"text-amber-400",   bar: "bg-amber-400"  },
  { location: "Morocco",            risk: "Drought Severity",  level: "Severe",   pct: 83,  trend: "up",   color: "text-red-400",     bar: "bg-red-400"    },
  { location: "Indonesia",          risk: "Volcanic Activity", level: "Watch",    pct: 47,  trend: "down", color: "text-emerald-400", bar: "bg-emerald-400"},
  { location: "Mozambique",         risk: "Flood Risk",        level: "High",     pct: 71,  trend: "up",   color: "text-orange-400",  bar: "bg-orange-400" },
  { location: "Alaska, USA",        risk: "Blizzard Risk",     level: "Moderate", pct: 53,  trend: "stable",color:"text-yellow-400",  bar: "bg-yellow-400" },
  { location: "Chile",              risk: "Tsunami Alert",     level: "Low",      pct: 28,  trend: "down", color: "text-emerald-400", bar: "bg-emerald-400"},
  { location: "Pakistan",           risk: "Flash Flood Risk",  level: "High",     pct: 77,  trend: "up",   color: "text-orange-400",  bar: "bg-orange-400" },
];

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "up")     return <TrendingUp   className="h-3 w-3 text-red-400"     aria-hidden />;
  if (trend === "down")   return <TrendingDown className="h-3 w-3 text-emerald-400" aria-hidden />;
  return                         <Minus        className="h-3 w-3 text-slate-400"   aria-hidden />;
};

export function LiveAIAnalysisPanel() {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % scans.length);
        setIsVisible(true);
      }, 320);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const current = scans[index];
  const nextIdx = (index + 1) % scans.length;
  const next    = scans[nextIdx];

  return (
    <motion.div
      initial={{ opacity: 0, x: 30, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="absolute -right-2 top-[22%] z-20 w-56 md:-right-6 md:w-64 lg:-right-4"
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-2xl"
        style={{ boxShadow: "0 8px 40px rgba(0,188,212,0.18), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)" }}
      >
        {/* Ambient light blobs */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-cyan/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-primary/20 blur-2xl" />

        {/* Header */}
        <div className="relative flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Radio className="h-3.5 w-3.5 text-cyan-400" />
          </motion.div>
          <span className="text-[9px] font-bold tracking-[0.22em] text-cyan-400 uppercase">
            Live AI Analysis
          </span>
          <span className="relative ml-auto flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
        </div>

        {/* Main content */}
        <div className="relative mt-3.5 min-h-[88px]">
          <AnimatePresence mode="wait">
            {isVisible && (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
                exit={{    opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Location + scanning */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Activity className="h-3 w-3 animate-pulse text-primary-light shrink-0" />
                  <span className="truncate">Scanning {current.location}</span>
                </div>

                {/* Risk type + level */}
                <div className="mt-1.5 flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-tight text-white">
                    {current.risk}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <TrendIcon trend={current.trend} />
                    <span className={`text-xs font-bold ${current.color}`}>
                      {current.level}
                    </span>
                  </div>
                </div>

                {/* Risk percentage bar */}
                <div className="mt-2.5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider">Risk Index</span>
                    <span className={`text-[10px] font-bold ${current.color}`}>{current.pct}%</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/8">
                    <motion.div
                      key={`bar-${index}`}
                      className={`h-full rounded-full ${current.bar}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${current.pct}%` }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      style={{ boxShadow: `0 0 6px currentColor` }}
                    />
                  </div>
                </div>

                {/* AI confidence */}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[9px] text-slate-500">AI Confidence</span>
                  <span className="text-[10px] font-semibold text-slate-300">
                    {85 + (index % 10)}%
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="mt-3 flex gap-1">
          {scans.map((_, i) => (
            <motion.div
              key={i}
              className="h-0.5 flex-1 rounded-full"
              animate={{ backgroundColor: i === index ? "#22d3ee" : "rgba(255,255,255,0.08)" }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* Next scan preview */}
        <div className="mt-2.5 flex items-center gap-1.5 rounded-xl border border-white/6 bg-white/3 px-2.5 py-1.5">
          <span className="text-[9px] text-slate-500 shrink-0">Next:</span>
          <span className="truncate text-[9px] text-slate-400">{next.location} · {next.risk}</span>
        </div>
      </div>
    </motion.div>
  );
}
