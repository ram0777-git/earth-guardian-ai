"use client";

import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { AnimatedCounter } from "./AnimatedCounter";
import { TiltCard } from "./TiltCard";

interface StatCardProps {
  label: string;
  numericValue: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  change: string;
  trend: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({
  label,
  numericValue,
  suffix = "",
  prefix = "",
  decimals = 0,
  change,
  trend,
  className,
}: StatCardProps) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <TiltCard className={className}>
      <GlassCard hover className="h-full text-center">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-primary to-cyan bg-clip-text text-transparent md:text-4xl">
          <AnimatedCounter
            value={numericValue}
            suffix={suffix}
            prefix={prefix}
            decimals={decimals}
          />
        </p>
        <div
          className={cn(
            "mt-2 flex items-center justify-center gap-1 text-xs font-medium",
            trend === "up" && "text-emerald-600",
            trend === "down" && "text-red-500",
            trend === "neutral" && "text-slate-500"
          )}
        >
          <TrendIcon className="h-3 w-3" />
          <span>{change}</span>
        </div>
      </GlassCard>
    </TiltCard>
  );
}
