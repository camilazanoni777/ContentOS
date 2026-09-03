import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/states";

export const metadata: Metadata = { title: "Gravação — Cami Content OS" };

export default function GravacaoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gravação"
        description="Conteúdos prontos para gravar ou já gravados, organizados para planejar seus blocos de gravação."
      />
      <EmptyState
        title="Nada para gravar no momento"
        description="Conteúdos com status 'Pronto para gravar' ou 'Gravado' aparecem aqui."
      />
    </div>
  );
}
