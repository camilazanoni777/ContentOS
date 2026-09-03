import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/states";

export const metadata: Metadata = { title: "Perfil — Analisar — Cami Content OS" };

export default function MetricasPerfilPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Perfil"
        description="Evolução geral da sua conta do Instagram — seguidores, alcance e visitas ao perfil ao longo do tempo."
        breadcrumbs={[{ label: "Analisar" }, { label: "Perfil" }]}
      />
      <EmptyState
        title="Nenhuma leitura de perfil registrada"
        description="Registre uma leitura periódica do seu perfil para começar a ver a evolução aqui."
      />
    </div>
  );
}
