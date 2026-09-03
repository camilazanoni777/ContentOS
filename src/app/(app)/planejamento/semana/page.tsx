import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/states";

export const metadata: Metadata = { title: "Semana — Planejar — Cami Content OS" };

export default function PlanejamentoSemanaPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Semana"
        description="Foco da semana, experimento em andamento e o conteúdo prioritário para os próximos dias."
        breadcrumbs={[{ label: "Planejar" }, { label: "Semana" }]}
      />
      <EmptyState
        title="Nenhum plano definido para esta semana"
        description="Defina um foco semanal para organizar suas prioridades de produção."
      />
    </div>
  );
}
