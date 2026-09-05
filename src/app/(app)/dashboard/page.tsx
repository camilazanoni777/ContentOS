import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardWorkspace } from "@/features/dashboard/dashboard-workspace";
import { listCampaigns } from "@/lib/data/campaigns";
import { listContentItems } from "@/lib/data/content-items";
import { listGoals } from "@/lib/data/goals";
import { listMetricSnapshotsForItems } from "@/lib/data/metric-snapshots";
import { listAllProfileSnapshots } from "@/lib/data/profile-snapshots";
import { listProducts } from "@/lib/data/products";
import { DataAccessError } from "@/lib/data/errors";
import { createClient } from "@/lib/supabase/server";
import type { Campaign, ContentItem, Goal, MetricSnapshot, ProfileSnapshot, Product } from "@/types/domain";

export const metadata: Metadata = { title: "Dashboard — Analisar — Cami Content OS" };

export default async function DashboardPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return <ErrorState title="Supabase não configurado" description="Defina as variáveis públicas do Supabase no .env.local." />;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?proximo=/dashboard");

  let data: {
    allItems: ContentItem[];
    metricSnapshots: MetricSnapshot[];
    profileSnapshots: ProfileSnapshot[];
    goals: Goal[];
    campaigns: Campaign[];
    products: Product[];
  } | null = null;
  let loadError: string | null = null;
  try {
    const [allItems, profileSnapshots, goals, campaigns, products] = await Promise.all([
      listContentItems(supabase, { includeArchived: false }),
      listAllProfileSnapshots(supabase),
      listGoals(supabase),
      listCampaigns(supabase),
      listProducts(supabase),
    ]);
    const publishedIds = allItems.filter((item) => item.status === "published" || item.status === "repurpose").map((item) => item.id);
    const metricSnapshots = await listMetricSnapshotsForItems(supabase, publishedIds);
    data = { allItems, metricSnapshots, profileSnapshots, goals, campaigns, products };
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar o Dashboard.";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral de qualquer período: comparação com o período anterior, campeões, evolução de seguidores e progresso das metas."
        breadcrumbs={[{ label: "Analisar" }, { label: "Dashboard" }]}
      />
      {data ? (
        <DashboardWorkspace
          allItems={data.allItems}
          metricSnapshots={data.metricSnapshots}
          profileSnapshots={data.profileSnapshots}
          goals={data.goals}
          campaigns={data.campaigns}
          products={data.products}
        />
      ) : (
        <ErrorState title="Não foi possível carregar o Dashboard" description={loadError ?? undefined} />
      )}
    </div>
  );
}
