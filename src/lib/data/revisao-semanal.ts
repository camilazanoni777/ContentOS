import type { DbClient } from "./types";
import { unwrap } from "./errors";
import { rangeInstantBounds } from "@/lib/dates";
import type { WeekWindowSources } from "@/lib/revisao-semanal";
import type { MetricSnapshot } from "@/types/domain";

/**
 * Busca os dados de UMA semana (segunda a domingo) para os cálculos de
 * revisao-semanal.ts. Chamada duas vezes pela página (semana atual e
 * semana anterior) — ver getPreviousEquivalentRange em dates.ts. Mesmo
 * padrão de query de getWeeklyPlanStats (weekly-plan.ts), com o adicional
 * de leituras de métricas por conteúdo publicado (não precisa em
 * Planejamento Semanal, precisa aqui para os "melhores da semana").
 */
export async function getWeekWindowSources(
  db: DbClient,
  params: { weekStart: string; weekEnd: string; accountFilter: string | null },
): Promise<WeekWindowSources> {
  const { weekStart, weekEnd, accountFilter } = params;
  const weekInstants = rangeInstantBounds(weekStart, weekEnd);

  let plannedQuery = db
    .from("content_items")
    .select("*")
    .is("archived_at", null)
    .gte("scheduled_at", weekInstants.startInstant)
    .lt("scheduled_at", weekInstants.endInstant);
  let publishedQuery = db
    .from("content_items")
    .select("*")
    .eq("status", "published")
    .gte("published_at", weekInstants.startInstant)
    .lt("published_at", weekInstants.endInstant);
  if (accountFilter) {
    plannedQuery = plannedQuery.eq("account_id", accountFilter);
    publishedQuery = publishedQuery.eq("account_id", accountFilter);
  }

  const profileQuery = db.from("profile_snapshots").select("*").gte("snapshot_date", weekStart).lte("snapshot_date", weekEnd);
  const beforeWeekQuery = db
    .from("profile_snapshots")
    .select("followers, snapshot_date")
    .lt("snapshot_date", weekStart)
    .order("snapshot_date", { ascending: false })
    .limit(1);
  const endOfWeekQuery = db
    .from("profile_snapshots")
    .select("followers, snapshot_date")
    .lte("snapshot_date", weekEnd)
    .order("snapshot_date", { ascending: false })
    .limit(1);

  const [plannedResult, publishedResult, profileResult, beforeWeekResult, endOfWeekResult] = await Promise.all([
    plannedQuery,
    publishedQuery,
    profileQuery,
    beforeWeekQuery,
    endOfWeekQuery,
  ]);

  const publishedItems = unwrap(publishedResult);
  const publishedIds = publishedItems.map((item) => item.id);
  let metricSnapshots: MetricSnapshot[] = [];
  if (publishedIds.length > 0) {
    const snapshotsResult = await db.from("metric_snapshots").select("*").in("content_item_id", publishedIds);
    metricSnapshots = unwrap(snapshotsResult);
  }
  const metricSnapshotsByItemId = new Map<string, MetricSnapshot[]>();
  for (const snapshot of metricSnapshots) {
    const list = metricSnapshotsByItemId.get(snapshot.content_item_id) ?? [];
    list.push(snapshot);
    metricSnapshotsByItemId.set(snapshot.content_item_id, list);
  }

  const before = unwrap(beforeWeekResult)[0] ?? null;
  const end = unwrap(endOfWeekResult)[0] ?? null;

  return {
    plannedItems: unwrap(plannedResult),
    publishedItems,
    metricSnapshotsByItemId,
    profileSnapshots: unwrap(profileResult),
    followersBeforeWeek: before?.followers ?? null,
    followersEndOfWeek: end?.followers ?? null,
  };
}
