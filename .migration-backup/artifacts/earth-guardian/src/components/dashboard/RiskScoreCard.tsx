import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useGetRiskFactors, useGetOverallRiskScore } from "@workspace/api-client-react";
import { AlertTriangle } from "lucide-react";

function getRisk(s: number) {
  if (s >= 75) return { label: "High Risk",      color: "#ef4444", grad: ["#ef4444","#f97316"] };
  if (s >= 50) return { label: "Elevated Risk",  color: "#f59e0b", grad: ["#f59e0b","#fb923c"] };
  return            { label: "Low Risk",         color: "#34d399", grad: ["#34d399","#22d3ee"] };
}

const severityColor: Record<string, string> = {
  critical: "#ef4444", high: "#f97316", moderate: "#f59e0b", low: "#34d399",
};

function Skeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/6 bg-white/[0.03] p-5">
      <div className="h-4 w-24 rounded bg-white/10 mb-4" />
      <div className="flex justify-center">
        <div className="h-44 w-44 rounded-full bg-white/8" />
      </div>
      <div className="mt-4 space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-8 rounded-xl bg-white/8" />)}
      </div>
    </div>
  );
}

export function RiskScoreCard({ loading }: { loading: boolean }) {
  const { data: riskScore, isLoading: scoreLoading } = useGetOverallRiskScore();
  const { data: riskFactors = [], isLoading: factorsLoading } = useGetRiskFactors();

  if (loading || scoreLoading || factorsLoading) return <Skeleton />;

  const overallRiskScore = riskScore?.overall ?? 68;
  const risk = getRisk(overallRiskScore);
  const R = 72;
  const circ = 2 * Math.PI * R;
  const offset = circ - (overallRiskScore / 100) * circ;

  return (
    <div
      className="rounded-2xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur-xl"
      style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Risk Score</h3>
        <div className="flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[10px] font-semibold text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          Elevated
        </div>
      </div>

      {/* Ring chart */}
      <div className="relative mx-auto mt-4 flex h-44 w-44 items-center justify-center">
        <svg width="176" height="176" className="-rotate-90 absolute inset-0">
          {/* Track */}
          <circle cx="88" cy="88" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          {/* Glow ring */}
          <circle cx="88" cy="88" r={R} fill="none" stroke={risk.color} strokeWidth="10"
            strokeOpacity={0.15} strokeDasharray={`${circ * 0.001} ${circ}`} />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor={risk.grad[0]} />
              <stop offset="100%" stopColor={risk.grad[1]} />
            </linearGradient>
          </defs>
          {/* Progress arc */}
          <motion.circle
            cx="88" cy="88" r={R}
            fill="none"
            stroke="url(#rg)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          />
        </svg>
        <div className="relative text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="text-4xl font-bold text-white">{overallRiskScore}</div>
            <div className="mt-0.5 text-xs font-medium" style={{ color: risk.color }}>{risk.label}</div>
            <div className="mt-0.5 text-[9px] text-slate-500 uppercase tracking-wider">out of 100</div>
          </motion.div>
        </div>
      </div>

      {/* Risk factors */}
      <div className="mt-4 space-y-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Top Risk Factors</p>
        {riskFactors.slice(0, 4).map((rf, i) => (
          <motion.div
            key={rf.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.07 }}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 truncate max-w-[130px]">{rf.name}</span>
              <span className="font-bold ml-2" style={{ color: severityColor[rf.level] ?? "#94a3b8" }}>{rf.score}</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/8">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: severityColor[rf.level] ?? "#94a3b8" }}
                initial={{ width: 0 }}
                animate={{ width: `${rf.score}%` }}
                transition={{ duration: 0.8, delay: 0.6 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
