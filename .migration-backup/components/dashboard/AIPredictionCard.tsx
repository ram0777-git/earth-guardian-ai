import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { aiPrediction } from "@/data/sampleData";
import { Brain, Clock } from "lucide-react";

export function AIPredictionCard() {
  return (
    <GlassCard variant="strong" className="relative overflow-hidden">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/10 to-cyan/10 blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan text-white">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">AI Prediction</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              {aiPrediction.timeframe}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Primary Threat</p>
            <p className="text-xl font-bold text-slate-900">{aiPrediction.primaryThreat}</p>
          </div>
          <Badge variant="high">{aiPrediction.confidence}% Confidence</Badge>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          {aiPrediction.summary}
        </p>

        <div className="mt-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Contributing Factors
          </p>
          {aiPrediction.factors.map((factor) => (
            <div key={factor.label}>
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">{factor.label}</span>
                <span className="font-medium text-primary">{factor.impact}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-cyan transition-all duration-700"
                  style={{ width: `${factor.impact}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
