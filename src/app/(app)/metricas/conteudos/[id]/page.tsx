import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/layout/status-badge";
import { Button } from "@/components/ui/button";
import { getContentItemById, listContentItems } from "@/lib/data/content-items";
import { listMetricSnapshotsForItems } from "@/lib/data/metric-snapshots";
import { DataAccessError } from "@/lib/data/errors";
import { METRICAS_STATUSES } from "@/lib/metricas";
import { createClient } from "@/lib/supabase/server";
import type { DbClient } from "@/lib/data/types";
import { MetricasDetail } from "@/features/metricas/metricas-detail";

export const metadata: Metadata = { title: "Métricas do conteúdo — Cami Content OS" };

async function loadDetailData(supabase: DbClient, id: string) {
  const [item, allItems] = await Promise.all([
    getContentItemById(supabase, id),
    listContentItems(supabase, { status: METRICAS_STATUSES }),
  ]);
  const allSnapshots = await listMetricSnapshotsForItems(supabase, allItems.map((entry) => entry.id));
  return { item, allItems, allSnapshots };
}

export default async function MetricasConteudoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return <ErrorState title="Supabase não configurado" description="Defina as variáveis públicas do Supabase no .env.local." />;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?proximo=/metricas/conteudos/${id}`);

  let data: Awaited<ReturnType<typeof loadDetailData>> | null = null;
  let loadError: string | null = null;
  try {
    data = await loadDetailData(supabase, id);
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar as métricas deste conteúdo.";
  }

  if (!data) {
    return <ErrorState title="Não foi possível carregar este conteúdo" description={loadError ?? undefined} />;
  }
  if (!data.item) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={data.item.title}
        description="Todas as leituras de métricas deste conteúdo, os cálculos derivados e o índice de performance."
        breadcrumbs={[{ label: "Analisar" }, { label: "Conteúdos", href: "/metricas/conteudos" }, { label: data.item.title }]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={data.item.status} />
            <Button asChild variant="outline">
              <Link href="/metricas/conteudos">Voltar</Link>
            </Button>
          </div>
        }
      />
      <MetricasDetail item={data.item} allItems={data.allItems} allSnapshots={data.allSnapshots} />
    </div>
  );
}
