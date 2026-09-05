import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { MetricasWorkspace } from "@/features/metricas/metricas-workspace";
import { listContentItems } from "@/lib/data/content-items";
import { listCampaigns } from "@/lib/data/campaigns";
import { listInstagramAccounts } from "@/lib/data/instagram-accounts";
import { listMetricSnapshotsForItems } from "@/lib/data/metric-snapshots";
import { DataAccessError } from "@/lib/data/errors";
import { METRICAS_STATUSES } from "@/lib/metricas";
import { createClient } from "@/lib/supabase/server";
import type { Campaign, ContentItem, InstagramAccount, MetricSnapshot } from "@/types/domain";

export const metadata: Metadata = { title: "Conteúdos — Analisar — Cami Content OS" };

export default async function MetricasConteudosPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return <ErrorState title="Supabase não configurado" description="Defina as variáveis públicas do Supabase no .env.local." />;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?proximo=/metricas/conteudos");

  let data: {
    items: ContentItem[];
    metricSnapshots: MetricSnapshot[];
    campaigns: Campaign[];
    accounts: InstagramAccount[];
  } | null = null;
  let loadError: string | null = null;
  try {
    const items = await listContentItems(supabase, { status: METRICAS_STATUSES });
    const [metricSnapshots, campaigns, accounts] = await Promise.all([
      listMetricSnapshotsForItems(supabase, items.map((item) => item.id)),
      listCampaigns(supabase),
      listInstagramAccounts(supabase),
    ]);
    data = { items, metricSnapshots, campaigns, accounts };
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar as métricas dos conteúdos.";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Conteúdos"
        description="Métricas de cada conteúdo publicado — leituras de 24h, 7 dias, 30 dias ou período personalizado, e o índice de performance comparado com a sua base histórica."
        breadcrumbs={[{ label: "Analisar" }, { label: "Conteúdos" }]}
      />
      {data ? (
        <MetricasWorkspace
          initialItems={data.items}
          metricSnapshots={data.metricSnapshots}
          campaigns={data.campaigns}
          accounts={data.accounts}
        />
      ) : (
        <ErrorState title="Não foi possível carregar Métricas" description={loadError ?? undefined} />
      )}
    </div>
  );
}
