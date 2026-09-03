import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/states";

export const metadata: Metadata = { title: "Agendamento — Cami Content OS" };

export default function AgendamentoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Agendamento"
        description="Checklist final antes de publicar: gancho, CTA, legenda, capa, áudio, acessibilidade e link."
      />
      <EmptyState
        title="Nenhum conteúdo agendado"
        description="Conteúdos com status 'Agendado' aparecem aqui, prontos para o checklist de qualidade."
      />
    </div>
  );
}
