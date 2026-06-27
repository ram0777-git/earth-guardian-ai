import { PageShell } from "@/components/layout/PageShell";
import { RiskScoreCard } from "@/components/dashboard/RiskScoreCard";
import { WeatherCard } from "@/components/dashboard/WeatherCard";
import { AIPredictionCard } from "@/components/dashboard/AIPredictionCard";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { InteractiveCharts } from "@/components/dashboard/InteractiveCharts";
import { DisasterTimeline } from "@/components/dashboard/DisasterTimeline";

export default function DashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      subtitle="Real-time overview of disaster risks and AI predictions for your region."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <RiskScoreCard />
        <WeatherCard />
        <RecentAlerts />
      </div>

      <div className="mt-6">
        <AIPredictionCard />
      </div>

      <div className="mt-6">
        <InteractiveCharts />
      </div>

      <div className="mt-6">
        <DisasterTimeline />
      </div>
    </PageShell>
  );
}
