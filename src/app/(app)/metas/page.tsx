import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/states";

export const metadata: Metadata = { title: "Metas — Cami Content OS" };

export default function MetasPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Metas"
        description="Metas semanais e mensais — ritmo de publicação, prazos e risco de não bater o combinado."
        breadcrumbs={[{ label: "Planejar" }, { label: "Metas" }]}
      />
      <EmptyState
        title="Nenhuma meta cadastrada"
        description="Cadastre uma meta semanal ou mensal para acompanhar seu progresso ao longo do tempo."
      />
    </div>
  );
}
