"use client";

import { supportedDisasters } from "@/data/sampleData";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { TiltCard } from "@/components/ui/TiltCard";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/motion/Reveal";
import { motion } from "framer-motion";
import {
  Activity,
  Flame,
  Sun,
  Waves,
  Wind,
  Droplets,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  activity: Activity,
  waves: Waves,
  flame: Flame,
  wind: Wind,
  water: Droplets,
  sun: Sun,
};

export function SupportedDisasters() {
  return (
    <section className="relative py-24 pb-32">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <Reveal variant="blur">
          <SectionHeader
            title="Supported Disasters"
            subtitle="Our AI models are trained to detect and predict a wide range of natural disasters with industry-leading accuracy."
          />
        </Reveal>

        <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
          {supportedDisasters.map((disaster) => {
            const Icon = iconMap[disaster.icon] ?? Activity;
            return (
              <StaggerItem key={disaster.id} variant="scale">
                <TiltCard>
                  <GlassCard hover className="glass-premium h-full">
                    <div className="flex items-start gap-4">
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan text-white shadow-md shadow-primary/20"
                      >
                        <Icon className="h-6 w-6" />
                      </motion.div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-900">
                            {disaster.name}
                          </h3>
                          <span className="text-sm font-bold text-primary">
                            <AnimatedCounter value={disaster.accuracy} suffix="%" />
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {disaster.description}
                        </p>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${disaster.accuracy}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full bg-gradient-to-r from-primary to-cyan"
                          />
                        </div>
                      </div>
                    </div>
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
