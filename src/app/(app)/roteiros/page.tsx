import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/states";

export const metadata: Metadata = { title: "Roteiros — Cami Content OS" };

export default function RoteirosPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roteiros"
        description="Ideias que já entraram em roteirização — gancho, estrutura e texto final antes de gravar."
      />
      <EmptyState
        title="Nenhum conteúdo em roteirização"
        description="Avance uma ideia do Banco de ideias para o status 'Roteiro' para ela aparecer aqui."
      />
    </div>
  );
}
