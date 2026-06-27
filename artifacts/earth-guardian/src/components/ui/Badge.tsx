import { cn } from "@/lib/utils";
import type { AlertSeverity } from "@/data/types";

interface BadgeProps {
  children: React.ReactNode;
  variant?: AlertSeverity | "default" | "info";
  className?: string;
}

const variants: Record<string, string> = {
  default: "bg-primary/10 text-primary",
  info: "bg-cyan/10 text-cyan-700",
  low: "bg-emerald-100 text-emerald-700",
  moderate: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
