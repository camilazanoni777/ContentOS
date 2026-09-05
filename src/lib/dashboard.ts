import { addDaysISO, instantToISODate } from "./dates";
import { mostRecentSnapshot } from "./metricas";
import { compareWeeks, computeWeekStats, type WeekComparison, type WeekStats, type WeekWindowSources } from "./revisao-semanal";
import type { ContentItem, Goal, MetricSnapshot } from "@/types/domain";
import type { PerformanceIndexResult } from "./metricas";

/**
 * Cálculos puros do Dashboard: filtros, comparação com o período anterior
 * equivalente, séries para os gráficos e agregações por formato/pilar/
 * objetivo. Reaproveita WeekWindowSources/computeWeekStats/compareWeeks de
 * revisao-semanal.ts — apesar do nome, esse cálculo não é específico de
 * semana (soma métricas de um conjunto de conteúdos + profile_snapshots
 * de um período qualquer), então não faz sentido duplicá-lo aqui.
 */

export type { WeekComparison as DashboardComparison, WeekStats as DashboardStats, WeekWindowSources as DashboardWindowSources };
export { compareWeeks as compareDashboardPeriods, computeWeekStats as computeDashboardStats };

export interface DashboardFilters {
  format: string;
  pillar: string;
  objective: string;
  campaignId: string;
  cta: string;
  productId: string;
}

export const EMPTY_DASHBOARD_FILTERS: DashboardFilters = {
  format: "",
  pillar: "",
  objective: "",
  campaignId: "",
  cta: "",
  productId: "",
};

/** Filtra uma lista de conteúdos pelos filtros do Dashboard (todos opcionais — "" = sem filtro nesse campo). */
export function filterDashboardItems(items: ContentItem[], filters: DashboardFilters): ContentItem[] {
  return items.filter((item) => {
    if (filters.format && item.format !== filters.format) return false;
    if (filters.pillar && item.pillar !== filters.pillar) return false;
    if (filters.objective && item.objective !== filters.objective) return false;
    if (filters.campaignId && item.campaign_id !== filters.campaignId) return false;
    if (filters.cta && item.cta !== filters.cta) return false;
    if (filters.productId && item.product_id !== filters.productId) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Séries para os gráficos — cada uma responde a uma pergunta específica,
// nunca decorativas.
// ---------------------------------------------------------------------------

export interface DailyReachViewsPoint {
  date: string;
  views: number | null;
  reach: number | null;
}

/**
 * "Como alcance e views evoluíram dia a dia neste período?" — soma, por
 * dia de PUBLICAÇÃO, a leitura mais recente de cada conteúdo publicado
 * naquele dia. Um dia sem nenhum conteúdo publicado fica com `null` (não
 * "0" fabricado) nos dois campos.
 */
export function buildDailyReachViewsSeries(
  publishedItems: ContentItem[],
  metricSnapshotsByItemId: Map<string, MetricSnapshot[]>,
  periodStart: string,
  periodEnd: string,
): DailyReachViewsPoint[] {
  const byDate = new Map<string, { views: number[]; reach: number[] }>();
  for (const item of publishedItems) {
    if (!item.published_at) continue;
    const date = instantToISODate(item.published_at);
    const snapshot = mostRecentSnapshot(metricSnapshotsByItemId.get(item.id) ?? []);
    if (!snapshot) continue;
    const entry = byDate.get(date) ?? { views: [], reach: [] };
    if (typeof snapshot.views === "number") entry.views.push(snapshot.views);
    if (typeof snapshot.reach === "number") entry.reach.push(snapshot.reach);
    byDate.set(date, entry);
  }

  const points: DailyReachViewsPoint[] = [];
  for (let date = periodStart; date <= periodEnd; date = addDaysISO(date, 1)) {
    const entry = byDate.get(date);
    points.push({
      date,
      views: entry && entry.views.length > 0 ? entry.views.reduce((sum, v) => sum + v, 0) : null,
      reach: entry && entry.reach.length > 0 ? entry.reach.reduce((sum, v) => sum + v, 0) : null,
    });
  }
  return points;
}

export interface DailyPlannedPublishedPoint {
  date: string;
  planned: number;
  published: number;
}

/** "Quanto do planejado por dia foi de fato publicado?" — contagens (nunca null; ausência é 0 conteúdo, não dado ausente). */
export function buildPlannedVsPublishedSeries(
  plannedItems: ContentItem[],
  publishedItems: ContentItem[],
  periodStart: string,
  periodEnd: string,
): DailyPlannedPublishedPoint[] {
  const plannedByDate = new Map<string, number>();
  for (const item of plannedItems) {
    if (!item.scheduled_at) continue;
    const date = instantToISODate(item.scheduled_at);
    plannedByDate.set(date, (plannedByDate.get(date) ?? 0) + 1);
  }
  const publishedByDate = new Map<string, number>();
  for (const item of publishedItems) {
    if (!item.published_at) continue;
    const date = instantToISODate(item.published_at);
    publishedByDate.set(date, (publishedByDate.get(date) ?? 0) + 1);
  }

  const points: DailyPlannedPublishedPoint[] = [];
  for (let date = periodStart; date <= periodEnd; date = addDaysISO(date, 1)) {
    points.push({ date, planned: plannedByDate.get(date) ?? 0, published: publishedByDate.get(date) ?? 0 });
  }
  return points;
}

export interface FollowersSeriesPoint {
  date: string;
  followers: number | null;
}

/** "Como os seguidores evoluíram dia a dia?" — soma de profile_snapshots.followers de todas as contas por dia (mesma simplificação de metas.ts: sem filtrar por conta). */
export function buildFollowersSeries(
  profileSnapshots: { snapshot_date: string; followers: number | null }[],
  periodStart: string,
  periodEnd: string,
): FollowersSeriesPoint[] {
  const byDate = new Map<string, number[]>();
  for (const snapshot of profileSnapshots) {
    if (typeof snapshot.followers !== "number") continue;
    const values = byDate.get(snapshot.snapshot_date) ?? [];
    values.push(snapshot.followers);
    byDate.set(snapshot.snapshot_date, values);
  }
  const points: FollowersSeriesPoint[] = [];
  for (let date = periodStart; date <= periodEnd; date = addDaysISO(date, 1)) {
    const values = byDate.get(date);
    points.push({ date, followers: values && values.length > 0 ? values.reduce((sum, v) => sum + v, 0) : null });
  }
  return points;
}

// ---------------------------------------------------------------------------
// Desempenho por formato / pilar / objetivo — "qual grupo performa melhor?"
// ---------------------------------------------------------------------------

export interface GroupPerformance {
  key: string;
  averageIndex: number;
  sampleSize: number;
}

/** Índice médio de performance por valor de um agrupador (formato/pilar/objetivo), do melhor para o pior — só grupos com ao menos um conteúdo com índice calculável. */
export function computeGroupPerformance(
  items: ContentItem[],
  indexByItemId: Map<string, PerformanceIndexResult>,
  groupKey: (item: ContentItem) => string | null,
): GroupPerformance[] {
  const sums = new Map<string, { total: number; count: number }>();
  for (const item of items) {
    const key = groupKey(item);
    if (!key) continue;
    const result = indexByItemId.get(item.id);
    if (!result || result.state !== "ok" || result.index === null) continue;
    const entry = sums.get(key) ?? { total: 0, count: 0 };
    entry.total += result.index;
    entry.count += 1;
    sums.set(key, entry);
  }
  return [...sums.entries()]
    .map(([key, { total, count }]) => ({ key, averageIndex: total / count, sampleSize: count }))
    .sort((a, b) => b.averageIndex - a.averageIndex);
}

export interface TopFollowersContent {
  item: ContentItem;
  followersGained: number;
}

/** Top N conteúdos por seguidores ganhos (valor bruto da leitura mais recente) — "quais conteúdos mais trouxeram gente nova?". */
export function topContentByFollowersGained(
  items: ContentItem[],
  metricSnapshotsByItemId: Map<string, MetricSnapshot[]>,
  limit: number,
): TopFollowersContent[] {
  const withValue: TopFollowersContent[] = [];
  for (const item of items) {
    const snapshot = mostRecentSnapshot(metricSnapshotsByItemId.get(item.id) ?? []);
    if (typeof snapshot?.followers_gained !== "number") continue;
    withValue.push({ item, followersGained: snapshot.followers_gained });
  }
  return withValue.sort((a, b) => b.followersGained - a.followersGained).slice(0, limit);
}

/**
 * Soma dos seguidores mais recentes de cada conta, considerando só
 * leituras até (e incluindo) `asOfISO` — "quantos seguidores eu tinha
 * nesta data?". Usado para o ganho de seguidores de um período qualquer
 * (before = totalFollowersAsOf(addDaysISO(periodStart, -1)), end =
 * totalFollowersAsOf(periodEnd)) — mesma lógica de metas.ts (não
 * exportada de lá), generalizada para qualquer data, não só metas.
 */
export function totalFollowersAsOf(
  profileSnapshots: { account_id: string; snapshot_date: string; followers: number | null }[],
  asOfISO: string,
): number | null {
  const byAccount = new Map<string, { snapshot_date: string; followers: number }>();
  for (const snapshot of profileSnapshots) {
    if (snapshot.snapshot_date > asOfISO) continue;
    if (typeof snapshot.followers !== "number") continue;
    const current = byAccount.get(snapshot.account_id);
    if (!current || snapshot.snapshot_date > current.snapshot_date) {
      byAccount.set(snapshot.account_id, { snapshot_date: snapshot.snapshot_date, followers: snapshot.followers });
    }
  }
  if (byAccount.size === 0) return null;
  let total = 0;
  for (const entry of byAccount.values()) total += entry.followers;
  return total;
}

/** Metas cujo período se sobrepõe ao período selecionado no Dashboard — "quais metas são relevantes para o que estou olhando agora?". */
export function selectGoalsOverlappingPeriod(goals: Goal[], periodStart: string, periodEnd: string): Goal[] {
  return goals.filter((goal) => goal.period_start <= periodEnd && goal.period_end >= periodStart);
}
