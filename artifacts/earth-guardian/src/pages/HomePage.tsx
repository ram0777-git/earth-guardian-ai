import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { StatisticsSection } from "@/components/home/StatisticsSection";
import { SupportedDisasters } from "@/components/home/SupportedDisasters";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <StatisticsSection />
      <SupportedDisasters />
    </>
  );
}
