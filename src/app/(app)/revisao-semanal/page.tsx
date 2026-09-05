import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { WeeklyReviewWorkspace } from "@/features/revisao-semanal/weekly-review-workspace";
import { getWeekWindowSources } from "@/lib/data/revisao-semanal";
import { getWeeklyReview } from "@/lib/data/weekly-reviews";
import { listContentItems } from "@/lib/data/content-items";
import { listMetricSnapshotsForItems } from "@/lib/data/metric-snapshots";
import { DataAccessError } from "@/lib/data/errors";
import { getPreviousEquivalentRange, getWeekRange, todayISODate } from "@/lib/dates";
import { computePerformanceIndexForWindow } from "@/lib/metricas";
import { METRICAS_STATUSES } from "@/lib/metricas";
import { compareWeeks, computeWeekHighlights, type WeekComparison, type WeekHighlights } from "@/lib/revisao-semanal";
import { createClient } from "@/lib/supabase/server";
import type { WeeklyReview } from "@/types/domain";

export const metadata: Metadata = { title: "Revisão semanal — Analisar — Cami Content OS" };

export default async function RevisaoSemanalPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return <ErrorState title="Supabase não configurado" description="Defina as variáveis públicas do Supabase no .env.local." />;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?proximo=/revisao-semanal");

  const { start: weekStart, end: weekEnd } = getWeekRange(week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : todayISODate());
  const previousWeek = getPreviousEquivalentRange(weekStart, weekEnd);

  let data: { review: WeeklyReview | null; comparison: WeekComparison; highlights: WeekHighlights } | null = null;
  let loadError: string | null = null;
  try {
    const [review, currentSources, previousSources, allPublishedItems] = await Promise.all([
      getWeeklyReview(supabase, weekStart),
      getWeekWindowSources(supabase, { weekStart, weekEnd, accountFilter: null }),
      getWeekWindowSources(supabase, { weekStart: previousWeek.start, weekEnd: previousWeek.end, accountFilter: null }),
      listContentItems(supabase, { status: METRICAS_STATUSES }),
    ]);

    // O índice de performance dos "melhores da semana" precisa de uma base
    // histórica ampla (não só os conteúdos desta semana) — ver comentário em
    // computeWeekHighlights (revisao-semanal.ts). Por isso busca TODOS os
    // conteúdos publicados (não só os desta semana) e suas leituras de 30d,
    // mesma janela padrão usada como base comparável em todo o produto.
    const allSnapshots = await listMetricSnapshotsForItems(supabase, allPublishedItems.map((item) => item.id));
    const snapshotsByItemId = new Map<string, typeof allSnapshots>();
    for (const snapshot of allSnapshots) {
      const list = snapshotsByItemId.get(snapshot.content_item_id) ?? [];
      list.push(snapshot);
      snapshotsByItemId.set(snapshot.content_item_id, list);
    }
    const indexByItemId = computePerformanceIndexForWindow(allPublishedItems, snapshotsByItemId, "30d");

    const comparison = compareWeeks(currentSources, previousSources);
    const highlights = computeWeekHighlights(currentSources.publishedItems, indexByItemId, currentSources.metricSnapshotsByItemId);

    data = { review, comparison, highlights };
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar a Revisão Semanal.";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Revisão semanal"
        description="Compare a semana com a anterior, veja os melhores conteúdos e registre o que aprender para a próxima semana."
        breadcrumbs={[{ label: "Analisar" }, { label: "Revisão semanal" }]}
      />
      {data ? (
        <WeeklyReviewWorkspace
          weekStart={weekStart}
          weekEnd={weekEnd}
          review={data.review}
          comparison={data.comparison}
          highlights={data.highlights}
        />
      ) : (
        <ErrorState title="Não foi possível carregar a Revisão Semanal" description={loadError ?? undefined} />
      )}
    </div>
  );
}
