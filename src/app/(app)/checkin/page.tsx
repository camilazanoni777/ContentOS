import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/states";

export const metadata: Metadata = { title: "Check-in — Cami Content OS" };

export default function CheckinPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Check-in"
        description="Um registro rápido de manhã e à noite: foco do dia, humor e o que rolou na produção."
      />
      <EmptyState
        title="Você ainda não fez check-in hoje"
        description="O check-in leva menos de um minuto e ajuda a enxergar seu ritmo de produção ao longo do tempo."
      />
    </div>
  );
}
