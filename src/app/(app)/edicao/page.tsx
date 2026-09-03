import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/states";

export const metadata: Metadata = { title: "Edição — Cami Content OS" };

export default function EdicaoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edição"
        description="Conteúdos em edição ou aguardando sua aprovação final antes de agendar."
      />
      <EmptyState
        title="Nada em edição no momento"
        description="Conteúdos com status 'Em edição' ou 'Aguardando aprovação' aparecem aqui."
      />
    </div>
  );
}
