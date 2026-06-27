

import { AnimatePresence, motion } from "framer-motion";
import { Activity, Radio } from "lucide-react";
import { useEffect, useState } from "react";

const scans = [
  { location: "Tokyo", risk: "Flood Risk", level: "Medium", color: "text-amber-400" },
  { location: "California", risk: "Wildfire Risk", level: "High", color: "text-orange-400" },
  { location: "Philippines", risk: "Typhoon Risk", level: "High", color: "text-orange-400" },
  { location: "Hyderabad", risk: "Heatwave Risk", level: "Moderate", color: "text-yellow-400" },
  { location: "Vizag", risk: "Cyclone Risk", level: "Low", color: "text-emerald-400" },
];

export function LiveAIAnalysisPanel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % scans.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const current = scans[index];

  return (
    <motion.div
      initial={{ opacity: 0, x: 30, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="absolute -right-2 top-1/4 z-20 w-56 md:-right-6 md:w-64 lg:-right-4"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_8px_32px_rgba(0,188,212,0.15)] backdrop-blur-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cyan/10" />
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan/20 blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Radio className="h-4 w-4 text-cyan-400" />
            </motion.div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-400">
              LIVE AI ANALYSIS
            </span>
            <span className="relative ml-auto flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
          </div>

          <div className="mt-4 min-h-[72px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Activity className="h-3 w-3 animate-pulse text-primary-light" />
                  Scanning {current.location}...
                </div>
                <p className="mt-2 text-sm font-semibold text-white">
                  {current.risk}:{" "}
                  <span className={current.color}>{current.level}</span>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-3 flex gap-1">
            {scans.map((_, i) => (
              <div
                key={i}
                className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${
                  i === index ? "bg-cyan-400" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
