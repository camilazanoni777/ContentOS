import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/states";

export const metadata: Metadata = { title: "Dashboard — Cami Content OS" };

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral por período: comparação entre janelas de tempo e seus conteúdos campeões."
        breadcrumbs={[{ label: "Analisar" }, { label: "Dashboard" }]}
      />
      <EmptyState
        title="Ainda não há dados suficientes"
        description="O dashboard ganha vida assim que você tiver conteúdos publicados com métricas registradas."
      />
    </div>
  );
}
