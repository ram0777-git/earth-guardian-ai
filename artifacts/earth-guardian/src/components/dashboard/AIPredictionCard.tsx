import { motion } from "framer-motion";
import { aiPrediction } from "@/data/sampleData";
import { Brain, Clock, Zap, ChevronRight } from "lucide-react";

function Skeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/6 bg-white/[0.03] p-5">
      <div className="flex gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="h-3 w-24 rounded bg-white/8" />
        </div>
      </div>
      <div className="h-24 rounded-xl bg-white/8 mb-4" />
      <div className="space-y-3">
        {[1,2,3,4].map(i => <div key={i} className="h-6 rounded-xl bg-white/8" />)}
      </div>
    </div>
  );
}

export function AIPredictionCard({ loading }: { loading: boolean }) {
  if (loading) return <Skeleton />;

  const ai = aiPrediction;
  const confColor = ai.confidence >= 80 ? "#ef4444" : ai.confidence >= 60 ? "#f59e0b" : "#34d399";

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl p-5"
      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-cyan/6 blur-2xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan text-white shadow-lg shadow-primary/20">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Prediction Engine</h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                Forecast window: {ai.timeframe}
              </div>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold"
            style={{ color: confColor, backgroundColor: `${confColor}18`, border: `1px solid ${confColor}35` }}
          >
            <Zap className="h-3 w-3" />
            {ai.confidence}% Confidence
          </div>
        </div>

        {/* Primary threat */}
        <div className="mt-5 rounded-xl border border-white/8 bg-white/4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Primary Threat Detected</p>
              <p className="mt-1 text-xl font-bold text-white">{ai.primaryThreat}</p>
            </div>
            <div className="relative">
              <svg width="56" height="56" className="-rotate-90">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                <motion.circle
                  cx="28" cy="28" r="22"
                  fill="none"
                  stroke={confColor}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 22}
                  initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - ai.confidence / 100) }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold" style={{ color: confColor }}>{ai.confidence}%</span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{ai.summary}</p>
        </div>

        {/* Contributing factors */}
        <div className="mt-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Contributing Factors</p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {ai.factors.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300">{f.label}</span>
                  <span className="font-bold" style={{ color: f.impact >= 70 ? "#ef4444" : f.impact >= 50 ? "#f59e0b" : "#34d399" }}>
                    {f.impact}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: f.impact >= 70
                        ? "linear-gradient(90deg,#ef4444,#f97316)"
                        : f.impact >= 50
                        ? "linear-gradient(90deg,#f59e0b,#fb923c)"
                        : "linear-gradient(90deg,#22d3ee,#34d399)",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${f.impact}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 py-2.5 text-sm font-medium text-primary-light transition-colors hover:bg-primary/20"
        >
          <Brain className="h-4 w-4" />
          View Full AI Report
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
}
