import type { DbClient } from "./types";
import { unwrap } from "./errors";
import { dayInstantRange, getMonthStart, getWeekRange, rangeInstantBounds } from "@/lib/dates";
import type { ContentItem, ContentStatus, Goal } from "@/types/domain";

export interface HojeActionableItem {
  id: string;
  title: string;
  type: "atrasado" | "metrica_pendente";
  /** Status do content_item — só definido para type "atrasado" (usado para linkar à página certa do pipeline). */
  status: ContentStatus | null;
}

export interface HojeSummary {
  plannedTodayCount: number;
  publishedTodayCount: number;
  overdueCount: number;
  metricsPendingCount: number;
  publishedThisWeekCount: number;
  weeklyTarget: number | null;
  weeklyPercent: number | null;
  plannedToday: ContentItem[];
  actionableItems: HojeActionableItem[];
  monthlyGoal: Goal | null;
}

/**
 * Filtro de conta para as consultas de content_items desta função. `null`
 * significa "não filtrar por conta" — usado quando a usuária tem 0 ou 1
 * conta cadastrada, para não esconder conteúdos criados sem account_id
 * (ex.: via captura rápida, que não pede conta). Só filtramos de fato
 * quando há mais de uma conta, onde a ambiguidade importa de verdade.
 */
export async function getHojeSummary(
  db: DbClient,
  params: { userId: string; today: string; accountFilter: string | null; weeklyTarget: number | null },
): Promise<HojeSummary> {
  const { today, accountFilter, weeklyTarget } = params;
  const todayRange = dayInstantRange(today);
  const weekRange = getWeekRange(today);
  const weekInstants = rangeInstantBounds(weekRange.start, weekRange.end);
  const monthStart = getMonthStart(today);
  const nowInstant = new Date().toISOString();

  let plannedTodayQuery = db
    .from("content_items")
    .select("*")
    .is("archived_at", null)
    .gte("planned_at", todayRange.startInstant)
    .lt("planned_at", todayRange.endInstant)
    .order("planned_at", { ascending: true });
  let publishedTodayQuery = db
    .from("content_items")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .gte("published_at", todayRange.startInstant)
    .lt("published_at", todayRange.endInstant);
  let publishedThisWeekQuery = db
    .from("content_items")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .gte("published_at", weekInstants.startInstant)
    .lt("published_at", weekInstants.endInstant);
  let overdueQuery = db
    .from("content_items")
    .select("*")
    .is("archived_at", null)
    .not("status", "in", "(published,archived,canceled)")
    .or(`scheduled_at.lt.${nowInstant},production_due_at.lt.${nowInstant}`)
    .order("scheduled_at", { ascending: true });
  let publishedForMetricsQuery = db
    .from("content_items")
    .select("id, title")
    .eq("status", "published")
    .is("archived_at", null);

  if (accountFilter) {
    plannedTodayQuery = plannedTodayQuery.eq("account_id", accountFilter);
    publishedTodayQuery = publishedTodayQuery.eq("account_id", accountFilter);
    publishedThisWeekQuery = publishedThisWeekQuery.eq("account_id", accountFilter);
    overdueQuery = overdueQuery.eq("account_id", accountFilter);
    publishedForMetricsQuery = publishedForMetricsQuery.eq("account_id", accountFilter);
  }

  const monthlyGoalQuery = db
    .from("goals")
    .select("*")
    .eq("period_type", "monthly")
    .eq("period_start", monthStart)
    .order("created_at", { ascending: true })
    .limit(1);

  const [
    plannedTodayResult,
    publishedTodayResult,
    publishedThisWeekResult,
    overdueResult,
    publishedForMetricsResult,
    monthlyGoalResult,
  ] = await Promise.all([
    plannedTodayQuery,
    publishedTodayQuery,
    publishedThisWeekQuery,
    overdueQuery,
    publishedForMetricsQuery,
    monthlyGoalQuery,
  ]);

  const plannedToday = unwrap(plannedTodayResult);
  const overdueItems = unwrap(overdueResult);
  const publishedForMetrics = unwrap(publishedForMetricsResult);
  const monthlyGoals = unwrap(monthlyGoalResult);

  const publishedIds = publishedForMetrics.map((item) => item.id);
  let metricsMissing: { id: string; title: string }[] = [];
  if (publishedIds.length > 0) {
    const metricsResult = await db
      .from("metric_snapshots")
      .select("content_item_id")
      .in("content_item_id", publishedIds);
    const measuredIds = new Set(unwrap(metricsResult).map((row) => row.content_item_id));
    metricsMissing = publishedForMetrics.filter((item) => !measuredIds.has(item.id));
  }

  const actionableItems: HojeActionableItem[] = [
    ...overdueItems
      .slice(0, 10)
      .map((item) => ({ id: item.id, title: item.title, type: "atrasado" as const, status: item.status })),
    ...metricsMissing
      .slice(0, 10)
      .map((item) => ({ id: item.id, title: item.title, type: "metrica_pendente" as const, status: null })),
  ];

  const publishedThisWeekCount = publishedThisWeekResult.count ?? 0;
  const weeklyPercent =
    weeklyTarget && weeklyTarget > 0 ? Math.round((publishedThisWeekCount / weeklyTarget) * 100) : null;

  return {
    plannedTodayCount: plannedToday.length,
    publishedTodayCount: publishedTodayResult.count ?? 0,
    overdueCount: overdueItems.length,
    metricsPendingCount: metricsMissing.length,
    publishedThisWeekCount,
    weeklyTarget: weeklyTarget ?? null,
    weeklyPercent,
    plannedToday,
    actionableItems,
    monthlyGoal: monthlyGoals[0] ?? null,
  };
}
