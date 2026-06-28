import { PageShell } from "@/components/layout/PageShell";
import { EmergencyPlannerChecklist } from "@/components/emergency-planner/EmergencyPlannerChecklist";

export default function EmergencyPlannerPage() {
  return (
    <PageShell
      title="Emergency Planner"
      subtitle="Build your personalized disaster preparedness plan step by step."
    >
      <EmergencyPlannerChecklist />
    </PageShell>
  );
}
