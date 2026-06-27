import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "strong" | "dark";
  hover?: boolean;
  style?: React.CSSProperties;
}

export function GlassCard({
  children,
  className,
  variant = "default",
  hover = false,
  style,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-300",
        variant === "default" && "glass",
        variant === "strong" && "glass-strong",
        variant === "dark" && "glass-dark text-white",
        hover && "hover:shadow-xl hover:-translate-y-1 hover:shadow-primary/10",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
