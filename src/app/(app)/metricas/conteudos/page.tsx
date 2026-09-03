import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/states";

export const metadata: Metadata = { title: "Conteúdos — Analisar — Cami Content OS" };

export default function MetricasConteudosPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Conteúdos"
        description="Métricas de cada conteúdo publicado — leituras de 24h, 7 dias, 30 dias ou período customizado."
        breadcrumbs={[{ label: "Analisar" }, { label: "Conteúdos" }]}
      />
      <EmptyState
        title="Nenhuma métrica registrada ainda"
        description="Assim que você publicar e registrar leituras de métrica, os conteúdos aparecem aqui comparados entre si."
      />
    </div>
  );
}
