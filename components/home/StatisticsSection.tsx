"use client";

import { statistics } from "@/data/sampleData";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/motion/Reveal";

export function StatisticsSection() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <Reveal variant="blur">
          <SectionHeader
            title="Impact by the Numbers"
            subtitle="Real-world results from communities using Earth Guardian AI worldwide."
          />
        </Reveal>

        <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.12}>
          {statistics.map((stat) => (
            <StaggerItem key={stat.id} variant="scale">
              <StatCard
                label={stat.label}
                numericValue={stat.numericValue}
                suffix={stat.suffix}
                prefix={stat.prefix}
                decimals={stat.decimals}
                change={stat.change}
                trend={stat.trend}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
