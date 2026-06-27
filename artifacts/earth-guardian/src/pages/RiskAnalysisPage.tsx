import { PageShell } from "@/components/layout/PageShell";
import { RiskAnalysisOverview } from "@/components/risk-analysis/RiskAnalysisOverview";

export default function RiskAnalysisPage() {
  return (
    <PageShell
      title="Risk Analysis"
      subtitle="Detailed breakdown of environmental risk factors affecting your region."
    >
      <RiskAnalysisOverview />
    </PageShell>
  );
}
