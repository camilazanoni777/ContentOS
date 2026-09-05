import type { DbClient } from "./types";
import { unwrap } from "./errors";
import { rangeInstantBounds } from "@/lib/dates";
import { computeExecutionPercent } from "@/lib/planejamento-semanal";
import type { ContentItem } from "@/types/domain";

export interface WeeklyPlanStats {
  plannedCount: number;
  publishedCount: number;
  executionPercent: number | null;
  /** Delta de seguidores na semana (profile_snapshots do fim da semana - do início) — null sem check-ins suficientes. */
  followersDelta: number | null;
  /** Soma de vendas/receita dos metric_snapshots capturados durante a semana — aproximação (ver comentário abaixo), não um livro-razão. */
  sales: number | null;
  revenue: number | null;
  /** Itens para montar a grade diária (ver buildWeeklyDailyGrid). */
  itemsForGrid: ContentItem[];
}

/**
 * Estatísticas da semana para o Planejamento Semanal: planejados/publicados
 * (por scheduled_at/published_at dentro da semana), percentual de
 * execução, delta de seguidores (via profile_snapshots, o check-in diário
 * já existente) e vendas/receita.
 *
 * Vendas/receita somam os metric_snapshots capturados durante a semana —
 * é uma aproximação deliberada (o produto não tem um livro-razão
 * financeiro dedicado; "receita" fora do conteúdo é escopo de Fase 8). Fica
 * documentado aqui e na UI como "capturado nesta semana", não "faturado
 * nesta semana".
 */
export async function getWeeklyPlanStats(
  db: DbClient,
  params: { weekStart: string; weekEnd: string; accountFilter: string | null },
): Promise<WeeklyPlanStats> {
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
  const metricsThisWeekQuery = db
    .from("metric_snapshots")
    .select("sales, revenue")
    .gte("captured_at", weekInstants.startInstant)
    .lt("captured_at", weekInstants.endInstant);

  const [plannedResult, publishedResult, beforeWeekResult, endOfWeekResult, metricsResult] = await Promise.all([
    plannedQuery,
    publishedQuery,
    beforeWeekQuery,
    endOfWeekQuery,
    metricsThisWeekQuery,
  ]);

  const plannedItems = unwrap(plannedResult);
  const publishedItems = unwrap(publishedResult);
  const before = unwrap(beforeWeekResult)[0] ?? null;
  const end = unwrap(endOfWeekResult)[0] ?? null;
  const metrics = unwrap(metricsResult);

  const followersDelta =
    before?.followers !== null && before?.followers !== undefined && end?.followers !== null && end?.followers !== undefined
      ? end.followers - before.followers
      : null;

  const sales = metrics.length > 0 ? metrics.reduce((sum, row) => sum + (row.sales ?? 0), 0) : null;
  const revenue = metrics.length > 0 ? metrics.reduce((sum, row) => sum + (row.revenue ?? 0), 0) : null;

  const itemsForGrid = [
    ...plannedItems,
    ...publishedItems.filter((item) => !plannedItems.some((planned) => planned.id === item.id)),
  ];

  return {
    plannedCount: plannedItems.length,
    publishedCount: publishedItems.length,
    executionPercent: computeExecutionPercent(plannedItems.length, publishedItems.length),
    followersDelta,
    sales,
    revenue,
    itemsForGrid,
  };
}
