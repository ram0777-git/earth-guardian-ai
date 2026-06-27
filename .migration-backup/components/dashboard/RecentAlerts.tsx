import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { recentAlerts } from "@/data/sampleData";
import { Bell, MapPin } from "lucide-react";

export function RecentAlerts() {
  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-slate-900">Recent Alerts</h3>
        </div>
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {recentAlerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white/50 p-3 transition-colors hover:bg-white/80"
          >
            <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                <Badge variant={alert.severity}>{alert.severity}</Badge>
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3 w-3" />
                {alert.location}
              </div>
              <p className="mt-1 text-xs text-slate-400">{alert.time}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
