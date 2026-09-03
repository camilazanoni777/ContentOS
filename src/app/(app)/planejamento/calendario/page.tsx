import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/states";

export const metadata: Metadata = { title: "Calendário — Planejar — Cami Content OS" };

export default function PlanejamentoCalendarioPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calendário"
        description="Visão mensal do seu editorial — arraste conteúdos entre datas para reorganizar a agenda."
        breadcrumbs={[{ label: "Planejar" }, { label: "Calendário" }]}
      />
      <EmptyState
        title="Nenhum conteúdo agendado neste mês"
        description="Conteúdos com data de agendamento definida aparecem aqui, organizados por dia."
      />
    </div>
  );
}
