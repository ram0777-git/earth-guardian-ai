import { PageShell } from "@/components/layout/PageShell";
import { LiveDisasterMap } from "@/components/live-map/LiveDisasterMap";

export default function LiveMapPage() {
  return (
    <PageShell
      title="Live Disaster Map"
      subtitle="Global view of active disaster events and severity levels in real time."
    >
      <LiveDisasterMap />
    </PageShell>
  );
}
