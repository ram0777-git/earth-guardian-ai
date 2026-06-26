import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { volunteers } from "@/data/sampleData";
import { Clock, MapPin, Users } from "lucide-react";

export function VolunteerNetworkGrid() {
  const totalHours = volunteers.reduce((sum, v) => sum + v.hoursContributed, 0);

  return (
    <>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Active Volunteers", value: volunteers.length.toString(), icon: Users },
          { label: "Hours Contributed", value: totalHours.toLocaleString(), icon: Clock },
          { label: "Regions Covered", value: "12", icon: MapPin },
        ].map((stat) => (
          <GlassCard key={stat.label} hover className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-cyan/10">
              <stat.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {volunteers.map((volunteer, index) => (
          <GlassCard
            key={volunteer.id}
            hover
            className="animate-fade-in-up opacity-0"
            style={{ animationDelay: `${index * 80}ms`, animationFillMode: "forwards" }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan text-lg font-bold text-white shadow-md">
                {volunteer.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{volunteer.name}</h3>
                <p className="text-sm text-primary">{volunteer.role}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400" />
                {volunteer.location}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="h-4 w-4 text-slate-400" />
                Available: {volunteer.availability}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {volunteer.skills.map((skill) => (
                <Badge key={skill} variant="info">{skill}</Badge>
              ))}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-primary">{volunteer.hoursContributed}</span> hours contributed
              </p>
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
