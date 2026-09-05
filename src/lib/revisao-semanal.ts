import { getHourLocal, getWeekdayLocal } from "./dates";
import { mostRecentSnapshot } from "./metricas";
import { computeExecutionPercent } from "./planejamento-semanal";
import type { ContentItem, MetricSnapshot, ProfileSnapshot } from "@/types/domain";
import type { PerformanceIndexResult } from "./metricas";

/**
 * Cálculos puros da Revisão Semanal: estatísticas da semana (e comparação
 * com a semana anterior de mesmo tamanho — sempre 7 dias, segunda a
 * domingo), os "melhores" da semana e o resumo automático em uma frase.
 * Nada aqui persiste nada — mesma filosofia de metas.ts/perfil.ts: tudo
 * derivado ao vivo dos dados brutos já salvos.
 */

export interface WeekWindowSources {
  /** Conteúdos com scheduled_at dentro da semana (não precisa estar publicado). */
  plannedItems: ContentItem[];
  /** Conteúdos com published_at dentro da semana. */
  publishedItems: ContentItem[];
  /** Leituras de métricas dos conteúdos de publishedItems. */
  metricSnapshotsByItemId: Map<string, MetricSnapshot[]>;
  /** Registros de perfil (todas as contas — mesma simplificação de metas.ts) dentro da semana. */
  profileSnapshots: ProfileSnapshot[];
  /** Seguidores no fim da semana anterior a esta (para calcular o ganho da semana) — null sem leitura anterior. */
  followersBeforeWeek: number | null;
  /** Seguidores no fim desta semana — null sem leitura na semana ou antes dela. */
  followersEndOfWeek: number | null;
}

export interface WeekStats {
  plannedCount: number;
  publishedCount: number;
  executionPercent: number | null;
  views: number | null;
  reach: number | null;
  totalEngagement: number | null;
  engagementRate: number | null;
  shares: number | null;
  saves: number | null;
  followersGained: number | null;
  profileVisits: number | null;
  websiteClicks: number | null;
  leads: number | null;
  sales: number | null;
  revenue: number | null;
  hoursInvested: number | null;
  resultPerHour: number | null;
}

function sumSnapshotField(items: ContentItem[], metricSnapshotsByItemId: Map<string, MetricSnapshot[]>, field: "views" | "reach" | "likes" | "comments" | "shares" | "saves" | "replies"): number | null {
  const values = items
    .map((item) => mostRecentSnapshot(metricSnapshotsByItemId.get(item.id) ?? []))
    .map((snapshot) => snapshot?.[field] ?? null)
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0);
}

function sumProfileField(profileSnapshots: ProfileSnapshot[], field: "profile_visits" | "website_clicks" | "leads" | "sales" | "revenue" | "hours_invested"): number | null {
  const values = profileSnapshots.map((snapshot) => snapshot[field]).filter((value): value is number => typeof value === "number");
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0);
}

/** Estatísticas da semana a partir dos dados já buscados (ver WeekWindowSources). */
export function computeWeekStats(sources: WeekWindowSources): WeekStats {
  const { plannedItems, publishedItems, metricSnapshotsByItemId, profileSnapshots } = sources;

  const views = sumSnapshotField(publishedItems, metricSnapshotsByItemId, "views");
  const reach = sumSnapshotField(publishedItems, metricSnapshotsByItemId, "reach");
  const likes = sumSnapshotField(publishedItems, metricSnapshotsByItemId, "likes");
  const comments = sumSnapshotField(publishedItems, metricSnapshotsByItemId, "comments");
  const shares = sumSnapshotField(publishedItems, metricSnapshotsByItemId, "shares");
  const saves = sumSnapshotField(publishedItems, metricSnapshotsByItemId, "saves");
  const replies = sumSnapshotField(publishedItems, metricSnapshotsByItemId, "replies");

  const engagementParts = [likes, comments, shares, saves, replies].filter((v): v is number => typeof v === "number");
  const totalEngagement = engagementParts.length > 0 ? engagementParts.reduce((sum, v) => sum + v, 0) : null;
  const engagementRate = totalEngagement !== null && reach !== null && reach > 0 ? (totalEngagement / reach) * 100 : null;

  const followersGained =
    sources.followersBeforeWeek !== null && sources.followersEndOfWeek !== null
      ? sources.followersEndOfWeek - sources.followersBeforeWeek
      : null;

  const revenue = sumProfileField(profileSnapshots, "revenue");
  const hoursInvested = sumProfileField(profileSnapshots, "hours_invested");

  return {
    plannedCount: plannedItems.length,
    publishedCount: publishedItems.length,
    executionPercent: computeExecutionPercent(plannedItems.length, publishedItems.length),
    views,
    reach,
    totalEngagement,
    engagementRate,
    shares,
    saves,
    followersGained,
    profileVisits: sumProfileField(profileSnapshots, "profile_visits"),
    websiteClicks: sumProfileField(profileSnapshots, "website_clicks"),
    leads: sumProfileField(profileSnapshots, "leads"),
    sales: sumProfileField(profileSnapshots, "sales"),
    revenue,
    hoursInvested,
    resultPerHour: revenue !== null && hoursInvested !== null && hoursInvested > 0 ? revenue / hoursInvested : null,
  };
}

/** Chaves numéricas de WeekStats — usado para calcular deltas ponto a ponto. */
const WEEK_STAT_NUMERIC_KEYS: (keyof WeekStats)[] = [
  "plannedCount",
  "publishedCount",
  "executionPercent",
  "views",
  "reach",
  "totalEngagement",
  "engagementRate",
  "shares",
  "saves",
  "followersGained",
  "profileVisits",
  "websiteClicks",
  "leads",
  "sales",
  "revenue",
  "hoursInvested",
  "resultPerHour",
];

export interface WeekComparison {
  current: WeekStats;
  previous: WeekStats;
  /** current - previous, campo a campo — null quando qualquer um dos dois lados é null. */
  deltas: Record<keyof WeekStats, number | null>;
}

/** Compara a semana atual com a semana anterior de mesmo tamanho (sempre 7 dias). */
export function compareWeeks(currentSources: WeekWindowSources, previousSources: WeekWindowSources): WeekComparison {
  const current = computeWeekStats(currentSources);
  const previous = computeWeekStats(previousSources);
  const deltas = {} as Record<keyof WeekStats, number | null>;
  for (const key of WEEK_STAT_NUMERIC_KEYS) {
    const currentValue = current[key];
    const previousValue = previous[key];
    deltas[key] = typeof currentValue === "number" && typeof previousValue === "number" ? currentValue - previousValue : null;
  }
  return { current, previous, deltas };
}

// ---------------------------------------------------------------------------
// Melhores da semana
// ---------------------------------------------------------------------------

interface Champion {
  item: ContentItem;
  value: number;
}

function pickChampion(
  items: ContentItem[],
  metricSnapshotsByItemId: Map<string, MetricSnapshot[]>,
  field: "views" | "shares" | "saves" | "followers_gained" | "revenue",
): Champion | null {
  let best: Champion | null = null;
  for (const item of items) {
    const snapshot = mostRecentSnapshot(metricSnapshotsByItemId.get(item.id) ?? []);
    const value = snapshot?.[field];
    if (typeof value !== "number") continue;
    if (!best || value > best.value) best = { item, value };
  }
  return best;
}

interface GroupAverage {
  key: string;
  averageIndex: number;
  sampleSize: number;
}

function bestGroupByIndex(
  items: ContentItem[],
  indexByItemId: Map<string, PerformanceIndexResult>,
  groupKey: (item: ContentItem) => string | null,
): GroupAverage | null {
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
  let best: GroupAverage | null = null;
  for (const [key, { total, count }] of sums) {
    const averageIndex = total / count;
    if (!best || averageIndex > best.averageIndex) best = { key, averageIndex, sampleSize: count };
  }
  return best;
}

export interface WeekHighlights {
  bestContent: { item: ContentItem; result: PerformanceIndexResult } | null;
  mostViews: Champion | null;
  mostShares: Champion | null;
  mostSaves: Champion | null;
  mostFollowersGained: Champion | null;
  mostRevenue: Champion | null;
  bestFormat: GroupAverage | null;
  bestPillar: GroupAverage | null;
  /** weekday: 0=domingo...6=sábado (Date#getDay), no timezone do produto. */
  bestWeekday: (GroupAverage & { weekday: number }) | null;
  bestHour: (GroupAverage & { hour: number }) | null;
  formatWithMostFollowers: { format: string; totalFollowersGained: number } | null;
  /** Conteúdos publicados na semana com índice calculável e abaixo da média da própria semana. */
  belowAverageContent: ContentItem[];
}

/**
 * "Melhores" da semana. O índice de performance (bestContent/bestFormat/
 * bestPillar/bestWeekday/bestHour/belowAverageContent) precisa ser
 * calculado por fora com uma base histórica ampla (não só os conteúdos
 * desta semana, que seria uma base pequena e enviesada) — ver
 * computePerformanceIndexForWindow em metricas.ts, mesmo padrão da página
 * de Métricas dos Conteúdos. Os "mais X" (views/compartilhamentos/
 * salvamentos/seguidores/receita) são sempre por valor bruto, não índice —
 * é literalmente "o conteúdo com mais X", não "o mais equilibrado".
 */
export function computeWeekHighlights(
  publishedItems: ContentItem[],
  indexByItemId: Map<string, PerformanceIndexResult>,
  metricSnapshotsByItemId: Map<string, MetricSnapshot[]>,
): WeekHighlights {
  const mostViews = pickChampion(publishedItems, metricSnapshotsByItemId, "views");
  const mostShares = pickChampion(publishedItems, metricSnapshotsByItemId, "shares");
  const mostSaves = pickChampion(publishedItems, metricSnapshotsByItemId, "saves");
  const mostFollowersGained = pickChampion(publishedItems, metricSnapshotsByItemId, "followers_gained");
  const mostRevenue = pickChampion(publishedItems, metricSnapshotsByItemId, "revenue");

  let bestContent: WeekHighlights["bestContent"] = null;
  const indexedItems: { item: ContentItem; index: number }[] = [];
  for (const item of publishedItems) {
    const result = indexByItemId.get(item.id);
    if (!result || result.state !== "ok" || result.index === null) continue;
    indexedItems.push({ item, index: result.index });
    if (!bestContent || result.index > (bestContent.result.index ?? -Infinity)) {
      bestContent = { item, result };
    }
  }

  const bestFormatGroup = bestGroupByIndex(publishedItems, indexByItemId, (item) => item.format);
  const bestPillarGroup = bestGroupByIndex(publishedItems, indexByItemId, (item) => item.pillar);
  const bestWeekdayGroup = bestGroupByIndex(publishedItems, indexByItemId, (item) =>
    item.published_at ? String(getWeekdayLocal(item.published_at)) : null,
  );
  const bestHourGroup = bestGroupByIndex(publishedItems, indexByItemId, (item) =>
    item.published_at ? String(getHourLocal(item.published_at)) : null,
  );

  const followersByFormat = new Map<string, number>();
  for (const item of publishedItems) {
    if (!item.format) continue;
    const snapshot = mostRecentSnapshot(metricSnapshotsByItemId.get(item.id) ?? []);
    if (typeof snapshot?.followers_gained !== "number") continue;
    followersByFormat.set(item.format, (followersByFormat.get(item.format) ?? 0) + snapshot.followers_gained);
  }
  let formatWithMostFollowers: WeekHighlights["formatWithMostFollowers"] = null;
  for (const [format, total] of followersByFormat) {
    if (!formatWithMostFollowers || total > formatWithMostFollowers.totalFollowersGained) {
      formatWithMostFollowers = { format, totalFollowersGained: total };
    }
  }

  const averageIndex = indexedItems.length > 0 ? indexedItems.reduce((sum, e) => sum + e.index, 0) / indexedItems.length : null;
  const belowAverageContent =
    averageIndex === null ? [] : indexedItems.filter((e) => e.index < averageIndex).map((e) => e.item);

  return {
    bestContent,
    mostViews,
    mostShares,
    mostSaves,
    mostFollowersGained,
    mostRevenue,
    bestFormat: bestFormatGroup ? { ...bestFormatGroup } : null,
    bestPillar: bestPillarGroup ? { ...bestPillarGroup } : null,
    bestWeekday: bestWeekdayGroup ? { ...bestWeekdayGroup, weekday: Number(bestWeekdayGroup.key) } : null,
    bestHour: bestHourGroup ? { ...bestHourGroup, hour: Number(bestHourGroup.key) } : null,
    formatWithMostFollowers,
    belowAverageContent,
  };
}

const WEEKDAY_LABELS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/**
 * Resumo automático em uma frase — só com dados realmente calculados
 * (nunca inventa nada); cada trecho só entra se o dado correspondente
 * não for null. Quando nada é calculável ainda, devolve uma frase neutra
 * em vez de uma frase vazia ou enganosa.
 */
export function buildAutoSummary(comparison: WeekComparison, highlights: WeekHighlights): string {
  const parts: string[] = [];
  const { current, deltas } = comparison;

  if (current.publishedCount > 0 || current.plannedCount > 0) {
    const execution = current.executionPercent !== null ? ` (${current.executionPercent}% de execução)` : "";
    parts.push(`Você publicou ${current.publishedCount} de ${current.plannedCount} conteúdos planejados${execution}`);
  }

  if (current.followersGained !== null) {
    const trend =
      deltas.followersGained !== null
        ? deltas.followersGained > 0
          ? " (crescendo em relação à semana passada)"
          : deltas.followersGained < 0
            ? " (menos que a semana passada)"
            : ""
        : "";
    parts.push(`ganhou ${current.followersGained} seguidores${trend}`);
  }

  if (highlights.bestFormat) {
    parts.push(`o formato que mais performou foi ${highlights.bestFormat.key}`);
  }

  if (highlights.mostViews) {
    parts.push(`"${highlights.mostViews.item.title}" foi o conteúdo com mais views (${highlights.mostViews.value.toLocaleString("pt-BR")})`);
  }

  if (current.revenue !== null && current.revenue > 0) {
    parts.push(`a receita da semana foi ${current.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`);
  }

  if (highlights.belowAverageContent.length > 0) {
    parts.push(`${highlights.belowAverageContent.length} conteúdo(s) ficaram abaixo da média da semana`);
  }

  if (parts.length === 0) {
    return "Ainda não há dados suficientes desta semana para um resumo automático.";
  }

  const [first, ...rest] = parts;
  return `${first.charAt(0).toUpperCase()}${first.slice(1)}${rest.length > 0 ? `, ${rest.join(", ")}` : ""}.`;
}

export { WEEKDAY_LABELS };
