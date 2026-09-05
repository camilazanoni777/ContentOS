import type { ContentItem, ProfileSnapshot } from "@/types/domain";
import { getMonthStart } from "./dates";

/**
 * Cálculos derivados das Métricas do Perfil — sempre em cima dos dados
 * brutos já salvos (profile_snapshots), nunca persistidos. Mesma filosofia
 * do índice de performance em metricas.ts: tudo é recalculado a partir da
 * fonte a cada leitura, então corrigir um registro antigo recalcula
 * automaticamente todos os derivados que dependem dele.
 *
 * Regra geral de null: quando o dado bruto necessário (deste registro ou do
 * anterior) está ausente, o derivado é `null` — nunca 0. Um `0` sempre
 * significa "calculado e deu zero", nunca "sem dado".
 */

/** Um campo numérico opcional de profile_snapshots usado em variações/médias móveis. */
type NumericSnapshotField = Extract<
  {
    [K in keyof ProfileSnapshot]: ProfileSnapshot[K] extends number | null ? K : never;
  }[keyof ProfileSnapshot],
  string
>;

function toDayTimestamp(dateISO: string): number {
  return new Date(`${dateISO}T00:00:00Z`).getTime();
}

/** Registros da mesma conta ordenados por data (crescente) — pré-requisito de todas as funções abaixo. */
export function sortSnapshotsByDate(snapshots: ProfileSnapshot[]): ProfileSnapshot[] {
  return [...snapshots].sort((a, b) => toDayTimestamp(a.snapshot_date) - toDayTimestamp(b.snapshot_date));
}

/** Registro imediatamente anterior a `snapshotId` na lista já ordenada (mesma conta) — null se for o primeiro. */
export function findPreviousSnapshot(sorted: ProfileSnapshot[], snapshotId: string): ProfileSnapshot | null {
  const index = sorted.findIndex((s) => s.id === snapshotId);
  if (index <= 0) return null;
  return sorted[index - 1];
}

/** Delta absoluto de um campo numérico entre um registro e o anterior — null se algum dos dois lados faltar. */
export function fieldDelta(current: ProfileSnapshot, previous: ProfileSnapshot | null, field: NumericSnapshotField): number | null {
  if (!previous) return null;
  const currentValue = current[field];
  const previousValue = previous[field];
  if (typeof currentValue !== "number" || typeof previousValue !== "number") return null;
  return currentValue - previousValue;
}

/** Crescimento percentual de um campo entre um registro e o anterior — null se o anterior for 0 ou ausente (divisão por zero não faz sentido). */
export function fieldGrowthPercent(current: ProfileSnapshot, previous: ProfileSnapshot | null, field: NumericSnapshotField): number | null {
  if (!previous) return null;
  const currentValue = current[field];
  const previousValue = previous[field];
  if (typeof currentValue !== "number" || typeof previousValue !== "number" || previousValue === 0) return null;
  return ((currentValue - previousValue) / previousValue) * 100;
}

/**
 * Média móvel de um campo nos `windowDays` dias que terminam em `asOfDateISO`
 * (inclusive), ignorando registros sem esse campo preenchido — média dos
 * valores disponíveis, não dos dias. `null` quando nenhum registro da janela
 * tem o campo preenchido (nunca 0, que seria "a média deu zero").
 */
export function movingAverage(
  sorted: ProfileSnapshot[],
  asOfDateISO: string,
  windowDays: number,
  field: NumericSnapshotField,
): number | null {
  const asOf = toDayTimestamp(asOfDateISO);
  const windowStart = asOf - (windowDays - 1) * 86_400_000;
  const values = sorted
    .filter((s) => {
      const t = toDayTimestamp(s.snapshot_date);
      return t >= windowStart && t <= asOf;
    })
    .map((s) => s[field])
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Conteúdos com `published_at` na mesma data do registro (comparação por
 * data local, não por instante) — cruza o "conteúdos publicados" autodeclarado
 * (campo bruto `posts_count`, o que a pessoa digitou) com o que o pipeline
 * realmente registra como publicado nesse dia. As duas coisas podem divergir
 * (ex.: um post feito fora do Content OS) — por isso ambas existem: uma é
 * dado bruto, a outra é derivado/cruzado.
 */
export function contentPublishedOnDate(items: ContentItem[], dateISO: string, accountId: string | null): number {
  return items.filter((item) => {
    if (!item.published_at) return false;
    if (accountId && item.account_id !== accountId) return false;
    const publishedDate = item.published_at.slice(0, 10);
    return publishedDate === dateISO;
  }).length;
}

/** Soma de `revenue` de todos os registros da mesma conta no mês (calendário) de `dateISO`, até essa data inclusive — null se nenhum registro do mês tiver receita informada. */
export function cumulativeRevenueForMonth(sorted: ProfileSnapshot[], dateISO: string): number | null {
  const monthStart = getMonthStart(dateISO);
  const relevant = sorted.filter((s) => s.snapshot_date >= monthStart && s.snapshot_date <= dateISO);
  const values = relevant.map((s) => s.revenue).filter((value): value is number => typeof value === "number");
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0);
}

/**
 * Receita do próprio dia dividida pelas horas investidas no dia — "resultado
 * por hora investida". Decisão de escopo: usamos `revenue` como "resultado"
 * por ser o campo mais concreto e diretamente monetário da lista de Métricas
 * do Perfil; `null` quando falta receita ou horas, ou quando horas é 0
 * (divisão por zero não faz sentido, não é "resultado zero").
 */
export function resultPerHour(snapshot: ProfileSnapshot): number | null {
  if (typeof snapshot.revenue !== "number" || typeof snapshot.hours_invested !== "number" || snapshot.hours_invested === 0) {
    return null;
  }
  return snapshot.revenue / snapshot.hours_invested;
}

export interface ProfileSnapshotDerived {
  snapshotId: string;
  followersGained: number | null;
  followersGrowthPercent: number | null;
  reachVariation: number | null;
  viewsVariation: number | null;
  profileVisitsVariation: number | null;
  websiteClicksVariation: number | null;
  movingAverageFollowers7d: number | null;
  movingAverageFollowers30d: number | null;
  movingAverageReach7d: number | null;
  movingAverageReach30d: number | null;
  movingAverageViews7d: number | null;
  movingAverageViews30d: number | null;
  contentPublishedOnDate: number;
  cumulativeRevenueMonth: number | null;
  resultPerHour: number | null;
}

/**
 * Calcula todos os derivados de um registro de perfil de uma vez — função
 * "de fachada" usada pela UI (workspace/tabela), que só precisa desta
 * chamada em vez de conhecer cada função individual acima.
 */
export function computeProfileSnapshotDerived(
  sorted: ProfileSnapshot[],
  snapshotId: string,
  items: ContentItem[],
): ProfileSnapshotDerived {
  const current = sorted.find((s) => s.id === snapshotId);
  if (!current) {
    throw new Error(`Registro de perfil ${snapshotId} não encontrado na lista fornecida.`);
  }
  const previous = findPreviousSnapshot(sorted, snapshotId);

  return {
    snapshotId,
    followersGained: fieldDelta(current, previous, "followers"),
    followersGrowthPercent: fieldGrowthPercent(current, previous, "followers"),
    reachVariation: fieldDelta(current, previous, "reach"),
    viewsVariation: fieldDelta(current, previous, "views"),
    profileVisitsVariation: fieldDelta(current, previous, "profile_visits"),
    websiteClicksVariation: fieldDelta(current, previous, "website_clicks"),
    movingAverageFollowers7d: movingAverage(sorted, current.snapshot_date, 7, "followers"),
    movingAverageFollowers30d: movingAverage(sorted, current.snapshot_date, 30, "followers"),
    movingAverageReach7d: movingAverage(sorted, current.snapshot_date, 7, "reach"),
    movingAverageReach30d: movingAverage(sorted, current.snapshot_date, 30, "reach"),
    movingAverageViews7d: movingAverage(sorted, current.snapshot_date, 7, "views"),
    movingAverageViews30d: movingAverage(sorted, current.snapshot_date, 30, "views"),
    contentPublishedOnDate: contentPublishedOnDate(items, current.snapshot_date, current.account_id),
    cumulativeRevenueMonth: cumulativeRevenueForMonth(sorted, current.snapshot_date),
    resultPerHour: resultPerHour(current),
  };
}
