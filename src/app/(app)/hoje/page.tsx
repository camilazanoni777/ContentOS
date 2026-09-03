import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/states";

export const metadata: Metadata = { title: "Hoje — Cami Content OS" };

export default function HojePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Hoje"
        description="Seu ponto de partida do dia: o que está parado, o que vence hoje e o que fazer a seguir."
      />
      <EmptyState
        title="Nenhuma pendência por aqui ainda"
        description="Quando você tiver ideias, roteiros ou publicações com prazo, elas aparecem aqui organizadas por urgência."
      />
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Use “Nova ideia” no topo da tela para começar a preencher seu banco de conteúdo.
      </p>
    </div>
  );
}
