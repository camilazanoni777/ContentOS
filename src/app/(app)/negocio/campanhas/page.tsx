import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/states";

export const metadata: Metadata = { title: "Campanhas — Negócio — Cami Content OS" };

export default function NegocioCampanhasPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Campanhas"
        description="Campanhas de marketing e lançamento associadas aos seus conteúdos."
        breadcrumbs={[{ label: "Negócio" }, { label: "Campanhas" }]}
      />
      <EmptyState
        title="Nenhuma campanha cadastrada"
        description="Crie uma campanha para agrupar conteúdos de um mesmo lançamento ou período."
      />
    </div>
  );
}
