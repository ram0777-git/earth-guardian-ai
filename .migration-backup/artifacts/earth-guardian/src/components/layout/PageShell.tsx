import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function PageShell({ children, title, subtitle, className }: PageShellProps) {
  return (
    <div className={cn("min-h-screen bg-mesh pt-28 pb-16", className)}>
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {(title || subtitle) && (
          <div className="mb-10 animate-fade-in-up">
            {title && (
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-2 text-lg text-slate-600">{subtitle}</p>
            )}
            <div className="mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-primary to-cyan" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
