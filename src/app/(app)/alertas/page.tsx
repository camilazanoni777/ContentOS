import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { AlertsWorkspace } from "@/features/alertas/alerts-workspace";
import { listAlertDismissals } from "@/lib/data/alert-dismissals";
import { getAppSettings } from "@/lib/data/app-settings";
import { listCampaigns } from "@/lib/data/campaigns";
import { listCampaignPayments } from "@/lib/data/campaign-payments";
import { listContentItems, listContentStatusHistoryForItems } from "@/lib/data/content-items";
import { listGoals } from "@/lib/data/goals";
import { listMetricSnapshotsForItems } from "@/lib/data/metric-snapshots";
import { listAllProfileSnapshots } from "@/lib/data/profile-snapshots";
import { DataAccessError } from "@/lib/data/errors";
import { todayISODate } from "@/lib/dates";
import { computeGoal } from "@/lib/metas";
import { createClient } from "@/lib/supabase/server";
import type { AlertDismissal, Campaign, CampaignPayment, ContentItem, ContentStatusHistory, MetricSnapshot } from "@/types/domain";
import type { GoalComputed } from "@/lib/metas";

export const metadata: Metadata = { title: "Alertas — Analisar — Cami Content OS" };

export default async function AlertasPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return <ErrorState title="Supabase não configurado" description="Defina as variáveis públicas do Supabase no .env.local." />;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?proximo=/alertas");

  let data: {
    activeItems: ContentItem[];
    statusHistory: ContentStatusHistory[];
    publishedItems: ContentItem[];
    metricSnapshots: MetricSnapshot[];
    knownPillars: string[];
    computedGoals: GoalComputed[];
    campaigns: Campaign[];
    campaignPayments: CampaignPayment[];
    dismissals: AlertDismissal[];
  } | null = null;
  let loadError: string | null = null;
  try {
    const [allItems, appSettings, goals, campaigns, campaignPayments, profileSnapshots, dismissals] = await Promise.all([
      listContentItems(supabase, { includeArchived: false }),
      getAppSettings(supabase, user.id),
      listGoals(supabase),
      listCampaigns(supabase),
      listCampaignPayments(supabase),
      listAllProfileSnapshots(supabase),
      listAlertDismissals(supabase),
    ]);

    const activeItems = allItems.filter((item) => !["published", "canceled"].includes(item.status));
    const publishedItems = allItems.filter((item) => item.status === "published" || item.status === "repurpose");

    const [statusHistory, metricSnapshots] = await Promise.all([
      listContentStatusHistoryForItems(supabase, activeItems.map((item) => item.id)),
      listMetricSnapshotsForItems(supabase, publishedItems.map((item) => item.id)),
    ]);

    const metricSnapshotsByItemId = new Map<string, MetricSnapshot[]>();
    for (const snapshot of metricSnapshots) {
      const list = metricSnapshotsByItemId.get(snapshot.content_item_id) ?? [];
      list.push(snapshot);
      metricSnapshotsByItemId.set(snapshot.content_item_id, list);
    }

    const goalSources = { profileSnapshots, contentItems: allItems, metricSnapshotsByItemId };
    const computedGoals = goals.map((goal) => computeGoal(goal, goalSources, todayISODate()));

    data = {
      activeItems,
      statusHistory,
      publishedItems,
      metricSnapshots,
      knownPillars: appSettings?.pillars ?? [],
      computedGoals,
      campaigns,
      campaignPayments,
      dismissals,
    };
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar os Alertas.";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Alertas"
        description="Tudo que precisa da sua atenção agora — atrasos, métricas pendentes, ideias paradas, metas em risco e prazos vencendo."
        breadcrumbs={[{ label: "Analisar" }, { label: "Alertas" }]}
      />
      {data ? (
        <AlertsWorkspace
          activeItems={data.activeItems}
          statusHistory={data.statusHistory}
          publishedItems={data.publishedItems}
          metricSnapshots={data.metricSnapshots}
          knownPillars={data.knownPillars}
          computedGoals={data.computedGoals}
          campaigns={data.campaigns}
          campaignPayments={data.campaignPayments}
          initialDismissals={data.dismissals}
        />
      ) : (
        <ErrorState title="Não foi possível carregar os Alertas" description={loadError ?? undefined} />
      )}
    </div>
  );
}
