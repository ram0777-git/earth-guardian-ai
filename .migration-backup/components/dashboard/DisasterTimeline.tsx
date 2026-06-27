import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { timelineEvents } from "@/data/sampleData";
import { Activity, Clock } from "lucide-react";

const statusColors = {
  active: "bg-red-500",
  monitoring: "bg-amber-500",
  resolved: "bg-emerald-500",
};

export function DisasterTimeline() {
  return (
    <GlassCard>
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-slate-900">Disaster Timeline</h3>
      </div>

      <div className="mt-6 relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-cyan to-primary/20" />

        <div className="space-y-6">
          {timelineEvents.map((event) => (
            <div key={event.id} className="relative flex gap-4 pl-6">
              <div
                className={`absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm ${statusColors[event.status]}`}
              />
              <div className="flex-1 rounded-xl border border-slate-100 bg-white/50 p-4 transition-colors hover:bg-white/80">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">{event.title}</h4>
                  <Badge variant={event.status === "active" ? "high" : event.status === "monitoring" ? "moderate" : "low"}>
                    {event.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{event.description}</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  {event.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
