import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/states";

export const metadata: Metadata = { title: "Configurações — Cami Content OS" };

export default function ConfiguracoesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configurações"
        description="Pilares, formatos, objetivos, CTAs, contas do Instagram, produtos e campanhas — tudo editável por você."
      />
      <EmptyState
        title="Nenhuma configuração personalizada ainda"
        description="As opções que você cadastrar aqui passam a aparecer nos formulários de conteúdo em todo o app."
      />
    </div>
  );
}
