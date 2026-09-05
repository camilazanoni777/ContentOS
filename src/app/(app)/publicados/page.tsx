import type { Metadata } from "next";

import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { PublicadosList } from "@/features/publicados/publicados-list";
import { listContentItems, listContentItemsBySourceIds } from "@/lib/data/content-items";
import { listMetricSnapshotsForItems } from "@/lib/data/metric-snapshots";
import { DataAccessError } from "@/lib/data/errors";
import { PUBLICADOS_STATUSES } from "@/lib/publicados";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ContentItem } from "@/types/domain";

export const metadata: Metadata = { title: "Publicados — Cami Content OS" };

export default async function PublicadosPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return <ErrorState title="Supabase não configurado" description="Defina as variáveis públicas do Supabase no .env.local." />;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?proximo=/publicados");

  let data: {
    items: ContentItem[];
    metricSnapshots: Awaited<ReturnType<typeof listMetricSnapshotsForItems>>;
    repurposedBySourceId: Record<string, ContentItem>;
  } | null = null;
  let loadError: string | null = null;
  try {
    const items = await listContentItems(supabase, { status: PUBLICADOS_STATUSES });
    const [metricSnapshots, repurposedItems] = await Promise.all([
      listMetricSnapshotsForItems(supabase, items.map((item) => item.id)),
      listContentItemsBySourceIds(supabase, items.map((item) => item.id)),
    ]);
    const repurposedBySourceId: Record<string, ContentItem> = {};
    for (const repurposedItem of repurposedItems) {
      if (repurposedItem.source_content_id) repurposedBySourceId[repurposedItem.source_content_id] = repurposedItem;
    }
    data = { items, metricSnapshots, repurposedBySourceId };
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar Publicados.";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Publicados"
        description="Histórico do que já foi ao ar, pendências de captura de métricas e fila de reaproveitamento."
      />
      {data ? (
        <PublicadosList
          initialItems={data.items}
          metricSnapshots={data.metricSnapshots}
          repurposedBySourceId={data.repurposedBySourceId}
        />
      ) : (
        <ErrorState title="Não foi possível carregar Publicados" description={loadError ?? undefined} />
      )}
    </div>
  );
}
