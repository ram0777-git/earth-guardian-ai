"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { emergencySteps } from "@/data/sampleData";
import { CheckCircle2, Circle, ClipboardCheck } from "lucide-react";
import { useState } from "react";

const priorityVariants = {
  essential: "critical" as const,
  recommended: "moderate" as const,
  optional: "low" as const,
};

export function EmergencyPlannerChecklist() {
  const [steps, setSteps] = useState(emergencySteps);

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  const toggleStep = (id: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <GlassCard variant="strong" className="lg:col-span-1">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Your Progress</h3>
            <p className="text-sm text-slate-500">{completedCount} of {steps.length} completed</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold text-primary">{progress}%</span>
            <span className="text-sm text-slate-500">Preparedness Score</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-cyan transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {(["essential", "recommended", "optional"] as const).map((priority) => {
            const count = steps.filter((s) => s.priority === priority).length;
            const done = steps.filter((s) => s.priority === priority && s.completed).length;
            return (
              <div key={priority} className="flex items-center justify-between text-sm">
                <Badge variant={priorityVariants[priority]}>{priority}</Badge>
                <span className="text-slate-600">{done}/{count}</span>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="lg:col-span-2">
        <h3 className="text-lg font-semibold text-slate-900">Emergency Preparedness Checklist</h3>
        <p className="mt-1 text-sm text-slate-500">
          Complete these steps to maximize your family&apos;s disaster readiness
        </p>

        <div className="mt-6 space-y-3">
          {steps.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => toggleStep(step.id)}
              className={`w-full flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                step.completed
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-slate-100 bg-white/50 hover:bg-white/80"
              }`}
            >
              {step.completed ? (
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="h-6 w-6 shrink-0 text-slate-300" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${step.completed ? "text-slate-500 line-through" : "text-slate-900"}`}>
                    {step.title}
                  </span>
                  <Badge variant={priorityVariants[step.priority]}>{step.priority}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{step.description}</p>
              </div>
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
