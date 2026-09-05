import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { MetasWorkspace } from "@/features/metas/metas-workspace";
import { listGoals } from "@/lib/data/goals";
import { listAllProfileSnapshots } from "@/lib/data/profile-snapshots";
import { listContentItems } from "@/lib/data/content-items";
import { listMetricSnapshotsForItems } from "@/lib/data/metric-snapshots";
import { getAppSettings } from "@/lib/data/app-settings";
import { DataAccessError } from "@/lib/data/errors";
import { createClient } from "@/lib/supabase/server";
import type { ContentItem, Goal, MetricSnapshot, ProfileSnapshot } from "@/types/domain";

export const metadata: Metadata = { title: "Metas — Cami Content OS" };

export default async function MetasPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return <ErrorState title="Supabase não configurado" description="Defina as variáveis públicas do Supabase no .env.local." />;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?proximo=/metas");

  let data: {
    goals: Goal[];
    profileSnapshots: ProfileSnapshot[];
    contentItems: ContentItem[];
    metricSnapshots: MetricSnapshot[];
    extra: unknown;
  } | null = null;
  let loadError: string | null = null;
  try {
    const [goals, profileSnapshots, contentItems, appSettings] = await Promise.all([
      listGoals(supabase),
      listAllProfileSnapshots(supabase),
      listContentItems(supabase, { includeArchived: false }),
      getAppSettings(supabase, user.id),
    ]);
    const publishedIds = contentItems.filter((item) => item.status === "published").map((item) => item.id);
    const metricSnapshots = await listMetricSnapshotsForItems(supabase, publishedIds);
    data = { goals, profileSnapshots, contentItems, metricSnapshots, extra: appSettings?.extra ?? {} };
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar as Metas.";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Metas"
        description="Metas semanais e mensais — ritmo de publicação, prazos e risco de não bater o combinado."
        breadcrumbs={[{ label: "Planejar" }, { label: "Metas" }]}
      />
      {data ? (
        <MetasWorkspace
          initialGoals={data.goals}
          profileSnapshots={data.profileSnapshots}
          contentItems={data.contentItems}
          metricSnapshots={data.metricSnapshots}
          appSettingsExtra={data.extra}
        />
      ) : (
        <ErrorState title="Não foi possível carregar Metas" description={loadError ?? undefined} />
      )}
    </div>
  );
}
