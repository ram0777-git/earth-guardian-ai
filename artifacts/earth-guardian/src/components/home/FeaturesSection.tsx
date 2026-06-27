

import { features } from "@/data/sampleData";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { TiltCard } from "@/components/ui/TiltCard";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/motion/Reveal";
import { motion } from "framer-motion";
import {
  Bell,
  Brain,
  ClipboardList,
  Gauge,
  Map,
  Users,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  brain: Brain,
  bell: Bell,
  map: Map,
  clipboard: ClipboardList,
  users: Users,
  gauge: Gauge,
};

export function FeaturesSection() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <Reveal variant="slideUp">
          <SectionHeader
            title="Powerful Features"
            subtitle="Everything you need to stay ahead of natural disasters and protect your community."
          />
        </Reveal>

        <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
          {features.map((feature) => {
            const Icon = iconMap[feature.icon] ?? Brain;
            return (
              <StaggerItem key={feature.id} variant="slideUp">
                <TiltCard>
                  <GlassCard hover className="group h-full glass-premium">
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-cyan/15 text-primary transition-all duration-500 group-hover:from-primary group-hover:to-cyan group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/25"
                    >
                      <Icon className="h-6 w-6" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {feature.description}
                    </p>
                  </GlassCard>
                </TiltCard>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
