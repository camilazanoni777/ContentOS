import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/states";

export const metadata: Metadata = { title: "Banco de ideias — Cami Content OS" };

export default function IdeiasPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Banco de ideias"
        description="Todo conteúdo nasce aqui como uma ideia e avança pelo pipeline sem nunca ser duplicado."
      />
      <EmptyState
        title="Seu banco de ideias está vazio"
        description='Clique em "Nova ideia" no topo da tela para capturar sua primeira ideia — só o título é obrigatório.'
      />
    </div>
  );
}
