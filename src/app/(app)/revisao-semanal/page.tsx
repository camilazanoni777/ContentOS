import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/states";

export const metadata: Metadata = { title: "Revisão semanal — Cami Content OS" };

export default function RevisaoSemanalPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Revisão semanal"
        description="Resumo automático da semana, sua análise estratégica e a decisão para a semana seguinte."
        breadcrumbs={[{ label: "Analisar" }, { label: "Revisão semanal" }]}
      />
      <EmptyState
        title="Nenhuma revisão semanal ainda"
        description="No fim de cada semana, um resumo automático aparece aqui para você analisar e registrar sua decisão."
      />
    </div>
  );
}
