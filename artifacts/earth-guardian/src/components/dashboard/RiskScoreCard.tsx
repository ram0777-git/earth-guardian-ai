

import { GlassCard } from "@/components/ui/GlassCard";
import { overallRiskScore } from "@/data/sampleData";
import { AlertTriangle } from "lucide-react";

function getRiskLevel(score: number) {
  if (score >= 75) return { label: "High Risk", color: "text-red-600", bg: "from-red-500 to-orange-500" };
  if (score >= 50) return { label: "Moderate Risk", color: "text-amber-600", bg: "from-amber-500 to-orange-400" };
  return { label: "Low Risk", color: "text-emerald-600", bg: "from-emerald-500 to-cyan" };
}

export function RiskScoreCard() {
  const risk = getRiskLevel(overallRiskScore);
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (overallRiskScore / 100) * circumference;

  return (
    <GlassCard className="flex flex-col items-center">
      <div className="flex w-full items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Risk Score</h3>
        <AlertTriangle className={`h-5 w-5 ${risk.color}`} />
      </div>

      <div className="relative mt-4">
        <svg width="180" height="180" className="-rotate-90">
          <circle
            cx="90"
            cy="90"
            r="70"
            fill="none"
            stroke="rgba(26, 115, 232, 0.1)"
            strokeWidth="12"
          />
          <circle
            cx="90"
            cy="90"
            r="70"
            fill="none"
            stroke="url(#riskGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1a73e8" />
              <stop offset="100%" stopColor="#00bcd4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-slate-900">{overallRiskScore}</span>
          <span className={`text-sm font-medium ${risk.color}`}>{risk.label}</span>
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-slate-600">
        San Francisco Bay Area composite risk index based on 6 environmental factors.
      </p>
    </GlassCard>
  );
}
