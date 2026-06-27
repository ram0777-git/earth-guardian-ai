import { PageShell } from "@/components/layout/PageShell";
import { VolunteerNetworkGrid } from "@/components/volunteer-network/VolunteerNetworkGrid";
import { Button } from "@/components/ui/Button";
import { UserPlus } from "lucide-react";

export default function VolunteerNetworkPage() {
  return (
    <PageShell
      title="Volunteer Network"
      subtitle="Connect with certified volunteers and relief organizations in your community."
    >
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-slate-600">
          Join our network of dedicated volunteers making a difference in disaster response.
        </p>
        <Button>
          <UserPlus className="h-4 w-4" />
          Become a Volunteer
        </Button>
      </div>
      <VolunteerNetworkGrid />
    </PageShell>
  );
}
