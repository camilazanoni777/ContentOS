import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/states";

export const metadata: Metadata = { title: "Receita — Negócio — Cami Content OS" };

export default function NegocioReceitaPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Receita"
        description="Produtos, vendas e receita atribuídos aos conteúdos que geraram resultado."
        breadcrumbs={[{ label: "Negócio" }, { label: "Receita" }]}
      />
      <EmptyState
        title="Nenhum dado de receita ainda"
        description="Cadastre produtos e vincule conteúdos a eles para acompanhar a receita gerada aqui."
      />
    </div>
  );
}
