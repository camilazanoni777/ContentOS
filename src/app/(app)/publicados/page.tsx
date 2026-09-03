import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/states";

export const metadata: Metadata = { title: "Publicados — Cami Content OS" };

export default function PublicadosPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Publicados"
        description="Histórico de tudo que já foi ao ar, com fila de reaproveitamento para conteúdos campeões."
      />
      <EmptyState
        title="Nada publicado ainda"
        description="Assim que um conteúdo mudar para o status 'Publicado', ele aparece aqui com seu histórico."
      />
    </div>
  );
}
