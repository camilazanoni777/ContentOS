import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { PerfilWorkspace } from "@/features/perfil/perfil-workspace";
import { listAllProfileSnapshots } from "@/lib/data/profile-snapshots";
import { listInstagramAccounts } from "@/lib/data/instagram-accounts";
import { listContentItems } from "@/lib/data/content-items";
import { DataAccessError } from "@/lib/data/errors";
import { createClient } from "@/lib/supabase/server";
import type { ContentItem, InstagramAccount, ProfileSnapshot } from "@/types/domain";

export const metadata: Metadata = { title: "Perfil — Analisar — Cami Content OS" };

export default async function MetricasPerfilPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return <ErrorState title="Supabase não configurado" description="Defina as variáveis públicas do Supabase no .env.local." />;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?proximo=/metricas/perfil");

  let data: { snapshots: ProfileSnapshot[]; accounts: InstagramAccount[]; contentItems: ContentItem[] } | null = null;
  let loadError: string | null = null;
  try {
    const [snapshots, accounts, contentItems] = await Promise.all([
      listAllProfileSnapshots(supabase),
      listInstagramAccounts(supabase),
      listContentItems(supabase, { includeArchived: false }),
    ]);
    data = { snapshots, accounts, contentItems };
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar as Métricas do Perfil.";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Perfil"
        description="Evolução geral da sua conta do Instagram — seguidores, alcance, visitas ao perfil e resultado por hora investida ao longo do tempo."
        breadcrumbs={[{ label: "Analisar" }, { label: "Perfil" }]}
      />
      {data ? (
        <PerfilWorkspace initialSnapshots={data.snapshots} accounts={data.accounts} contentItems={data.contentItems} />
      ) : (
        <ErrorState title="Não foi possível carregar Perfil" description={loadError ?? undefined} />
      )}
    </div>
  );
}
