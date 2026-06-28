import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { riskFactors, overallRiskScore } from "@/data/sampleData";
import { Shield, AlertTriangle } from "lucide-react";

export function RiskAnalysisOverview() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <GlassCard variant="strong" className="lg:col-span-1">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-slate-500">Overall Regional Score</p>
            <p className="text-4xl font-bold text-slate-900">{overallRiskScore}/100</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Composite index for San Francisco Bay Area combining geological, meteorological,
          and infrastructure vulnerability data updated hourly.
        </p>
      </GlassCard>

      <GlassCard className="lg:col-span-2">
        <h3 className="text-lg font-semibold text-slate-900">Risk Factor Breakdown</h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {riskFactors.map((factor) => (
            <div
              key={factor.id}
              className="rounded-xl border border-slate-100 bg-white/50 p-4 transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  <span className="font-medium text-slate-900">{factor.name}</span>
                </div>
                <Badge variant={factor.level}>{factor.level}</Badge>
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-2xl font-bold text-primary">{factor.score}</span>
                <span className="mb-1 text-sm text-slate-500">/ 100</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-cyan"
                  style={{ width: `${factor.score}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-600">{factor.description}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
