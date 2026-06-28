import { GlassCard } from "@/components/ui/GlassCard";
import { teamMembers } from "@/data/sampleData";
import { Button } from "@/components/ui/button";
import {
  Award,
  Cloud,
  Globe2,
  Heart,
  Sparkles,
  Target,
} from "lucide-react";

export function AboutContent() {
  return (
    <>
      <GlassCard variant="strong" className="mb-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyan text-white shadow-lg">
          <Globe2 className="h-8 w-8" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-slate-900 md:text-3xl">
          Protecting Communities with AI
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600 leading-relaxed">
          Earth Guardian AI was created for the Google GDG Hackathon with a mission to
          leverage artificial intelligence and real-time geospatial data to predict natural
          disasters before they happen — giving communities the critical time needed to
          prepare, evacuate, and save lives.
        </p>
      </GlassCard>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        {[
          {
            icon: Target,
            title: "Our Mission",
            text: "Reduce disaster-related casualties by 50% through early AI-powered warnings accessible to every community.",
          },
          {
            icon: Sparkles,
            title: "Our Vision",
            text: "A world where no community is caught off guard by natural disasters, regardless of geography or resources.",
          },
          {
            icon: Heart,
            title: "Our Values",
            text: "Accessibility, accuracy, and community-first design guide every feature we build.",
          },
        ].map((item) => (
          <GlassCard key={item.title} hover>
            <item.icon className="h-8 w-8 text-primary" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.text}</p>
          </GlassCard>
        ))}
      </div>

      <h3 className="mb-6 text-2xl font-bold text-slate-900">Meet the Team</h3>
      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        {teamMembers.map((member) => (
          <GlassCard key={member.id} hover>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan text-lg font-bold text-white">
                {member.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">{member.name}</h4>
                <p className="text-sm text-primary">{member.role}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">{member.bio}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-cyan/10">
          <Cloud className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-center gap-2 md:justify-start">
            <Award className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-slate-900">Built for Google GDG Hackathon</h3>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Designed with Material Design principles, powered by Next.js, and ready for
            Google Cloud AI integration in the next development phase.
          </p>
        </div>
        <Button href="/dashboard">Explore Dashboard</Button>
      </GlassCard>
    </>
  );
}
