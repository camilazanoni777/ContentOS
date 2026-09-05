import type { ContentItem, MetricSnapshot, MetricWindow } from "@/types/domain";
import { getCapturePendencies, hasAnyCapturePendency } from "@/lib/publicados";

/**
 * Lógica pura de Métricas dos Conteúdos: os cálculos derivados de uma
 * leitura de métricas (engajamento, taxas, conversões, RPM, retenção,
 * crescimento) e o índice de performance (0–300+, 100 = média histórica
 * comparável). Nada aqui toca o Supabase — os componentes buscam os dados
 * e chamam estas funções.
 *
 * Regra crítica em todo este arquivo: ausência de dado é `null`, nunca
 * `0` — um campo não informado nunca vira zero num cálculo. Uma divisão
 * também nunca produz `Infinity`/`NaN`: denominador ausente ou igual a
 * zero sempre resulta em `null` (ver `divide`).
 */

// ---------------------------------------------------------------------------
// Helpers numéricos null-safe
// ---------------------------------------------------------------------------

/** Soma valores disponíveis, ignorando os `null` — retorna `null` só quando NENHUM valor está disponível (nunca finge que "tudo ausente" é zero). */
export function sumAvailable(...values: Array<number | null>): number | null {
  const available = values.filter((value): value is number => value !== null && value !== undefined);
  if (available.length === 0) return null;
  return available.reduce((total, value) => total + value, 0);
}

/** Primeiro valor não-nulo, em ordem de prioridade — usado para escolher a "base" de uma taxa (ex.: alcance quando disponível, senão views). */
function pickBase(...values: Array<number | null>): number | null {
  for (const value of values) {
    if (value !== null && value !== undefined) return value;
  }
  return null;
}

/** Divisão null-safe: numerador ou denominador ausente, ou denominador zero, sempre produz `null` — nunca `Infinity`/`NaN`. */
function divide(numerator: number | null, denominator: number | null): number | null {
  if (numerator === null || denominator === null || denominator === 0) return null;
  return numerator / denominator;
}

/** Todas as funções de "taxa"/"conversão" deste arquivo devolvem pontos percentuais (0–100), não fração — para bater com `retention_rate`, que já vem informado nessa mesma escala pelo formulário. */
function toPercentage(ratio: number | null): number | null {
  return ratio === null ? null : ratio * 100;
}

// ---------------------------------------------------------------------------
// Cálculos por leitura (MetricSnapshot)
// ---------------------------------------------------------------------------

/** Engajamento total = curtidas + comentários + compartilhamentos + salvamentos + respostas — soma dos campos disponíveis (ver sumAvailable). */
export function totalEngagement(
  s: Pick<MetricSnapshot, "likes" | "comments" | "shares" | "saves" | "replies">,
): number | null {
  return sumAvailable(s.likes, s.comments, s.shares, s.saves, s.replies);
}

/** Taxa de engajamento por alcance (%). */
export function engagementRateByReach(
  s: Pick<MetricSnapshot, "likes" | "comments" | "shares" | "saves" | "replies" | "reach">,
): number | null {
  return toPercentage(divide(totalEngagement(s), s.reach));
}

/** Taxa de engajamento por views (%). */
export function engagementRateByViews(
  s: Pick<MetricSnapshot, "likes" | "comments" | "shares" | "saves" | "replies" | "views">,
): number | null {
  return toPercentage(divide(totalEngagement(s), s.views));
}

/** Taxa de curtidas (%) — base é alcance quando disponível, senão views. */
export function likeRate(s: Pick<MetricSnapshot, "likes" | "reach" | "views">): number | null {
  return toPercentage(divide(s.likes, pickBase(s.reach, s.views)));
}

/** Taxa de comentários (%) — mesma base de likeRate. */
export function commentRate(s: Pick<MetricSnapshot, "comments" | "reach" | "views">): number | null {
  return toPercentage(divide(s.comments, pickBase(s.reach, s.views)));
}

/** Taxa de compartilhamentos (%) — mesma base de likeRate. */
export function shareRate(s: Pick<MetricSnapshot, "shares" | "reach" | "views">): number | null {
  return toPercentage(divide(s.shares, pickBase(s.reach, s.views)));
}

/** Taxa de salvamentos (%) — mesma base de likeRate. */
export function saveRate(s: Pick<MetricSnapshot, "saves" | "reach" | "views">): number | null {
  return toPercentage(divide(s.saves, pickBase(s.reach, s.views)));
}

/**
 * Conversão em seguidores (%): seguidores gerados sobre a base mais
 * precisa disponível — visitas ao perfil (funil real perfil→seguir),
 * senão alcance, senão views.
 */
export function followerConversionRate(
  s: Pick<MetricSnapshot, "followers_gained" | "profile_visits" | "reach" | "views">,
): number | null {
  return toPercentage(divide(s.followers_gained, pickBase(s.profile_visits, s.reach, s.views)));
}

/** CTR (%): cliques sobre impressões quando disponíveis, senão alcance, senão views. */
export function ctr(
  s: Pick<MetricSnapshot, "link_clicks" | "impressions" | "reach" | "views">,
): number | null {
  return toPercentage(divide(s.link_clicks, pickBase(s.impressions, s.reach, s.views)));
}

/** Conversão clique → venda (%). */
export function clickToSaleConversion(s: Pick<MetricSnapshot, "sales" | "link_clicks">): number | null {
  return toPercentage(divide(s.sales, s.link_clicks));
}

/** RPM por 1.000 views (receita a cada mil visualizações) — não é uma taxa percentual, fica na unidade da receita. */
export function rpmPer1000Views(s: Pick<MetricSnapshot, "revenue" | "views">): number | null {
  const perView = divide(s.revenue, s.views);
  return perView === null ? null : perView * 1000;
}

/** Conclusão (%): views completas sobre views totais. */
export function completionRate(s: Pick<MetricSnapshot, "completed_views" | "views">): number | null {
  return toPercentage(divide(s.completed_views, s.views));
}

/**
 * Retenção média de um conteúdo: média de `retention_rate` (retenção
 * informada manualmente, 0–100) entre as leituras que têm esse campo
 * preenchido — leituras sem retenção informada não entram na média (e não
 * viram zero). `null` quando nenhuma leitura tem retenção informada.
 */
export function averageRetention(snapshots: Pick<MetricSnapshot, "retention_rate">[]): number | null {
  const values = snapshots
    .map((snapshot) => snapshot.retention_rate)
    .filter((value): value is number => value !== null && value !== undefined);
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

/**
 * Crescimento de views entre a leitura de 24h e a de 7d (%). `null`
 * quando falta uma das duas leituras, falta o campo `views` numa delas,
 * ou `views` em 24h é zero (divisão por zero não calculável).
 */
export function viewsGrowth24hTo7d(
  snapshot24h: Pick<MetricSnapshot, "views"> | null | undefined,
  snapshot7d: Pick<MetricSnapshot, "views"> | null | undefined,
): number | null {
  if (!snapshot24h || !snapshot7d) return null;
  const views24h = snapshot24h.views;
  const views7d = snapshot7d.views;
  if (views24h === null || views7d === null || views24h === 0) return null;
  return toPercentage((views7d - views24h) / views24h);
}

/** A leitura de métricas mais recente de um conteúdo (maior `captured_at`) — `null` quando não há nenhuma leitura ainda. */
export function mostRecentSnapshot(snapshots: MetricSnapshot[]): MetricSnapshot | null {
  if (snapshots.length === 0) return null;
  return [...snapshots].sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime())[0];
}

/** A leitura de uma janela fixa (24h/7d/30d) específica — no máximo uma existe por conteúdo+janela fixa (constraint no banco), então find() é seguro. */
export function getSnapshotByWindow(
  snapshots: MetricSnapshot[],
  window: Extract<MetricWindow, "24h" | "7d" | "30d">,
): MetricSnapshot | null {
  return snapshots.find((snapshot) => snapshot.window_type === window) ?? null;
}

// ---------------------------------------------------------------------------
// Índice de performance
// ---------------------------------------------------------------------------

export type PerformanceComponentKey =
  | "shareRate"
  | "saveRate"
  | "engagementRate"
  | "followerConversion"
  | "ctr"
  | "salesPerBase";

export const PERFORMANCE_COMPONENT_KEYS: PerformanceComponentKey[] = [
  "shareRate",
  "saveRate",
  "engagementRate",
  "followerConversion",
  "ctr",
  "salesPerBase",
];

export const PERFORMANCE_COMPONENT_LABELS: Record<PerformanceComponentKey, string> = {
  shareRate: "Taxa de compartilhamento",
  saveRate: "Taxa de salvamento",
  engagementRate: "Taxa de engajamento",
  followerConversion: "Conversão em seguidores",
  ctr: "CTR",
  salesPerBase: "Vendas por base",
};

/** Vendas por base (%): vendas sobre alcance quando disponível, senão views — mesma convenção de base das demais taxas. Componente do índice; diferente de clickToSaleConversion (que é clique→venda). */
function salesPerBaseRate(s: Pick<MetricSnapshot, "sales" | "reach" | "views">): number | null {
  return toPercentage(divide(s.sales, pickBase(s.reach, s.views)));
}

/** Taxa de engajamento "canônica" usada como componente do índice — alcance quando disponível, senão views (os dois cálculos separados por alcance/por views continuam existindo acima para exibição lado a lado). */
function canonicalEngagementRate(
  s: Pick<MetricSnapshot, "likes" | "comments" | "shares" | "saves" | "replies" | "reach" | "views">,
): number | null {
  return toPercentage(divide(totalEngagement(s), pickBase(s.reach, s.views)));
}

/** Valores brutos (%) dos 6 componentes do índice de performance para uma leitura. */
export function computePerformanceComponentValues(snapshot: MetricSnapshot): Record<PerformanceComponentKey, number | null> {
  return {
    shareRate: shareRate(snapshot),
    saveRate: saveRate(snapshot),
    engagementRate: canonicalEngagementRate(snapshot),
    followerConversion: followerConversionRate(snapshot),
    ctr: ctr(snapshot),
    salesPerBase: salesPerBaseRate(snapshot),
  };
}

/**
 * Pesos padrão de cada componente por objetivo do conteúdo (soma sempre
 * 1.0). "default" é usado quando o conteúdo não tem objetivo definido ou
 * tem um valor fora da lista conhecida (ver CONTENT_OBJECTIVES em
 * content-pipeline.ts). Julgamento de produto documentado aqui: cada
 * objetivo reforça os componentes mais diretamente ligados a ele
 * (ex.: "vendas" pesa mais em vendas por base e CTR; "seguidores" pesa
 * mais em conversão em seguidores), sem zerar nenhum componente — todo
 * conteúdo continua sendo avaliado nas 6 dimensões.
 */
export const DEFAULT_OBJECTIVE_WEIGHTS: Record<string, Record<PerformanceComponentKey, number>> = {
  default: { engagementRate: 0.3, shareRate: 0.2, saveRate: 0.2, followerConversion: 0.15, ctr: 0.1, salesPerBase: 0.05 },
  alcance: { engagementRate: 0.3, shareRate: 0.3, saveRate: 0.15, followerConversion: 0.15, ctr: 0.05, salesPerBase: 0.05 },
  viralizacao: { shareRate: 0.4, saveRate: 0.15, engagementRate: 0.25, followerConversion: 0.1, ctr: 0.05, salesPerBase: 0.05 },
  compartilhamentos: { shareRate: 0.5, engagementRate: 0.2, saveRate: 0.15, followerConversion: 0.1, ctr: 0.03, salesPerBase: 0.02 },
  engajamento: { engagementRate: 0.45, shareRate: 0.2, saveRate: 0.2, followerConversion: 0.1, ctr: 0.03, salesPerBase: 0.02 },
  seguidores: { followerConversion: 0.45, engagementRate: 0.2, shareRate: 0.15, saveRate: 0.1, ctr: 0.05, salesPerBase: 0.05 },
  comunidade: { engagementRate: 0.35, saveRate: 0.2, shareRate: 0.15, followerConversion: 0.2, ctr: 0.05, salesPerBase: 0.05 },
  autoridade: { saveRate: 0.3, engagementRate: 0.25, shareRate: 0.15, followerConversion: 0.15, ctr: 0.1, salesPerBase: 0.05 },
  trafego: { ctr: 0.45, engagementRate: 0.15, shareRate: 0.15, saveRate: 0.1, followerConversion: 0.1, salesPerBase: 0.05 },
  leads: { ctr: 0.4, salesPerBase: 0.2, engagementRate: 0.15, shareRate: 0.1, saveRate: 0.1, followerConversion: 0.05 },
  vendas: { salesPerBase: 0.5, ctr: 0.25, engagementRate: 0.1, shareRate: 0.05, saveRate: 0.05, followerConversion: 0.05 },
  entretenimento: { engagementRate: 0.3, shareRate: 0.25, saveRate: 0.2, followerConversion: 0.1, ctr: 0.1, salesPerBase: 0.05 },
};

export type PerformanceTier = "below_average" | "average" | "above_average" | "viral";

export const PERFORMANCE_TIER_LABELS: Record<PerformanceTier, string> = {
  below_average: "Abaixo da média",
  average: "Dentro da média",
  above_average: "Acima da média",
  viral: "Viral",
};

export interface PerformanceTierThresholds {
  /** Índice mínimo para entrar em "average" (padrão 70 — abaixo disso é "below_average"). */
  averageMin: number;
  /** Índice mínimo para "above_average" (padrão 120). */
  aboveAverageMin: number;
  /** Índice mínimo para "viral" (padrão 300). */
  viralMin: number;
}

/** Faixas padrão do índice — configuráveis (ver getPerformanceIndexThresholds, que lê app_settings.extra quando presente). */
export const DEFAULT_PERFORMANCE_TIER_THRESHOLDS: PerformanceTierThresholds = {
  averageMin: 70,
  aboveAverageMin: 120,
  viralMin: 300,
};

export function getPerformanceTier(
  index: number,
  thresholds: PerformanceTierThresholds = DEFAULT_PERFORMANCE_TIER_THRESHOLDS,
): PerformanceTier {
  if (index >= thresholds.viralMin) return "viral";
  if (index >= thresholds.aboveAverageMin) return "above_average";
  if (index >= thresholds.averageMin) return "average";
  return "below_average";
}

/** Lê os limites das faixas de app_settings.extra.performance_index_thresholds quando presentes e válidos, senão os padrões — é isso que torna as faixas "configuráveis" sem exigir uma tabela nova (extra é jsonb livre, mesmo padrão de outras configurações do produto). */
export function getPerformanceIndexThresholds(extra: unknown): PerformanceTierThresholds {
  if (!extra || typeof extra !== "object") return DEFAULT_PERFORMANCE_TIER_THRESHOLDS;
  const raw = (extra as Record<string, unknown>).performance_index_thresholds;
  if (!raw || typeof raw !== "object") return DEFAULT_PERFORMANCE_TIER_THRESHOLDS;
  const candidate = raw as Record<string, unknown>;
  const averageMin = candidate.averageMin;
  const aboveAverageMin = candidate.aboveAverageMin;
  const viralMin = candidate.viralMin;
  if (
    typeof averageMin === "number" &&
    typeof aboveAverageMin === "number" &&
    typeof viralMin === "number" &&
    averageMin > 0 &&
    aboveAverageMin > averageMin &&
    viralMin > aboveAverageMin
  ) {
    return { averageMin, aboveAverageMin, viralMin };
  }
  return DEFAULT_PERFORMANCE_TIER_THRESHOLDS;
}

// ---------------------------------------------------------------------------
// Média histórica comparável (baseline) e o índice em si
// ---------------------------------------------------------------------------

export type BaselineScope = "account_format" | "account" | "global";

export interface BaselineDescription {
  scope: BaselineScope;
  average: number;
  sampleSize: number;
}

export interface BaselineGroupInput {
  accountId: string | null;
  format: string | null;
  values: Record<PerformanceComponentKey, number | null>;
}

export interface PerformanceBaselines {
  /**
   * Média histórica comparável para um componente, com o nível de
   * comparação efetivamente usado — para a explicação visual ("comparado
   * com N conteúdos do mesmo formato e conta" etc.). `null` quando não há
   * base histórica suficiente nem no nível mais amplo (global).
   */
  describe(accountId: string | null, format: string | null, component: PerformanceComponentKey): BaselineDescription | null;
}

type ComponentSamples = Record<PerformanceComponentKey, number[]>;

function emptySamples(): ComponentSamples {
  return { shareRate: [], saveRate: [], engagementRate: [], followerConversion: [], ctr: [], salesPerBase: [] };
}

function pushSample(samples: ComponentSamples, values: Record<PerformanceComponentKey, number | null>): void {
  for (const key of PERFORMANCE_COMPONENT_KEYS) {
    const value = values[key];
    if (value !== null && value !== undefined) samples[key].push(value);
  }
}

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

/**
 * Constrói a base de comparação a partir de um conjunto de leituras (uma
 * por conteúdo, já na mesma janela — ver computePerformanceIndexForWindow).
 * Compara preferencialmente por formato+conta; cai para conta (todos os
 * formatos) e depois para global (toda a base) quando a amostra do nível
 * mais específico é pequena demais (`minSample`, padrão 3).
 *
 * Simplificação deliberada: a média inclui o próprio conteúdo sendo
 * comparado (não exclui "a si mesmo" da própria base). Numa base pequena
 * como a deste produto isso muda pouco o resultado e evita ter que
 * recalcular uma base inteira por item; documentado como possível
 * refinamento futuro no TODO.md.
 */
export function buildPerformanceBaselines(
  inputs: BaselineGroupInput[],
  options: { minSample?: number } = {},
): PerformanceBaselines {
  const minSample = options.minSample ?? 3;
  const byAccountFormat = new Map<string, ComponentSamples>();
  const byAccount = new Map<string, ComponentSamples>();
  const global = emptySamples();

  const accountFormatKey = (accountId: string | null, format: string | null) => `${accountId ?? "none"}::${format ?? "none"}`;
  const accountKey = (accountId: string | null) => accountId ?? "none";

  for (const input of inputs) {
    const afKey = accountFormatKey(input.accountId, input.format);
    if (!byAccountFormat.has(afKey)) byAccountFormat.set(afKey, emptySamples());
    pushSample(byAccountFormat.get(afKey)!, input.values);

    const aKey = accountKey(input.accountId);
    if (!byAccount.has(aKey)) byAccount.set(aKey, emptySamples());
    pushSample(byAccount.get(aKey)!, input.values);

    pushSample(global, input.values);
  }

  function describe(
    accountId: string | null,
    format: string | null,
    component: PerformanceComponentKey,
  ): BaselineDescription | null {
    const af = byAccountFormat.get(accountFormatKey(accountId, format));
    if (af && af[component].length >= minSample) {
      return { scope: "account_format", average: average(af[component]), sampleSize: af[component].length };
    }
    const a = byAccount.get(accountKey(accountId));
    if (a && a[component].length >= minSample) {
      return { scope: "account", average: average(a[component]), sampleSize: a[component].length };
    }
    if (global[component].length >= minSample) {
      return { scope: "global", average: average(global[component]), sampleSize: global[component].length };
    }
    return null;
  }

  return { describe };
}

const MAX_COMPONENT_RATIO = 3;

export interface PerformanceComponentBreakdown {
  key: PerformanceComponentKey;
  label: string;
  /** Valor bruto (%) deste componente para o conteúdo. */
  value: number | null;
  /** Média histórica comparável usada, com o nível de comparação. */
  baseline: BaselineDescription | null;
  /** value / baseline.average, limitado a 3x (ver MAX_COMPONENT_RATIO) para não deixar um outlier distorcer o índice. */
  ratio: number | null;
  /** ratio * 100 — 100 = igual à média histórica. */
  score: number | null;
  /** Peso original deste componente (conforme o objetivo do conteúdo). */
  weight: number;
  /** Peso após redistribuir os pesos dos componentes indisponíveis entre os disponíveis — null quando este componente está indisponível. */
  redistributedWeight: number | null;
  /** score * redistributedWeight — quanto este componente contribuiu para o índice final. */
  contribution: number | null;
  available: boolean;
  unavailableReason?: "missing_value" | "insufficient_baseline";
}

export interface PerformanceIndexResult {
  /** "ok": índice calculado. "no_capture": não há leitura de métricas para a janela escolhida. "insufficient_data": há leitura, mas nenhum componente tem base histórica comparável suficiente. */
  state: "ok" | "no_capture" | "insufficient_data";
  index: number | null;
  tier: PerformanceTier | null;
  /** Sempre presente (mesmo em estados sem índice) — é a "explicação visual" de como a nota foi formada, ou por que não pôde ser formada. */
  breakdown: PerformanceComponentBreakdown[];
}

/**
 * Calcula o índice de performance de UMA leitura, já comparada com uma
 * base histórica (ver buildPerformanceBaselines) e com os pesos do
 * objetivo do conteúdo. Cada componente sem valor informado ou sem base
 * histórica suficiente fica de fora, e seu peso é redistribuído
 * proporcionalmente entre os componentes disponíveis — nunca vira zero.
 * Quando NENHUM componente está disponível, o índice fica indisponível
 * (state "insufficient_data") em vez de mostrar um número enganoso.
 */
export function computePerformanceIndex(
  snapshot: MetricSnapshot | null,
  context: { accountId: string | null; format: string | null; objective: string | null },
  baselines: PerformanceBaselines,
  weightsByObjective: Record<string, Record<PerformanceComponentKey, number>> = DEFAULT_OBJECTIVE_WEIGHTS,
  thresholds: PerformanceTierThresholds = DEFAULT_PERFORMANCE_TIER_THRESHOLDS,
): PerformanceIndexResult {
  if (!snapshot) {
    return { state: "no_capture", index: null, tier: null, breakdown: [] };
  }

  const values = computePerformanceComponentValues(snapshot);
  const weights = weightsByObjective[context.objective ?? ""] ?? weightsByObjective.default;

  const breakdown: PerformanceComponentBreakdown[] = PERFORMANCE_COMPONENT_KEYS.map((key) => {
    const value = values[key];
    const weight = weights[key];
    const label = PERFORMANCE_COMPONENT_LABELS[key];

    if (value === null) {
      return {
        key,
        label,
        value: null,
        baseline: null,
        ratio: null,
        score: null,
        weight,
        redistributedWeight: null,
        contribution: null,
        available: false,
        unavailableReason: "missing_value",
      };
    }

    const baseline = baselines.describe(context.accountId, context.format, key);
    // baseline.average === 0 também não é calculável (divisão por zero) mesmo com amostra suficiente.
    if (!baseline || baseline.average === 0) {
      return {
        key,
        label,
        value,
        baseline,
        ratio: null,
        score: null,
        weight,
        redistributedWeight: null,
        contribution: null,
        available: false,
        unavailableReason: "insufficient_baseline",
      };
    }

    const ratio = Math.min(value / baseline.average, MAX_COMPONENT_RATIO);
    return {
      key,
      label,
      value,
      baseline,
      ratio,
      score: ratio * 100,
      weight,
      redistributedWeight: null,
      contribution: null,
      available: true,
    };
  });

  const availableWeightSum = breakdown.filter((item) => item.available).reduce((sum, item) => sum + item.weight, 0);

  if (availableWeightSum <= 0) {
    return { state: "insufficient_data", index: null, tier: null, breakdown };
  }

  let index = 0;
  for (const item of breakdown) {
    if (item.available && item.score !== null) {
      item.redistributedWeight = item.weight / availableWeightSum;
      item.contribution = item.score * item.redistributedWeight;
      index += item.contribution;
    }
  }
  index = Math.round(index);

  return { state: "ok", index, tier: getPerformanceTier(index, thresholds), breakdown };
}

/**
 * Orquestra tudo para uma janela de comparação (24h/7d/30d): monta a base
 * histórica a partir das leituras dessa janela de TODOS os conteúdos
 * comparáveis (nunca mistura janelas diferentes na mesma base — comparar
 * 24h contra a média de 7d não faria sentido) e calcula o índice de cada
 * conteúdo contra ela. É a função que a página de Métricas chama.
 */
export function computePerformanceIndexForWindow(
  items: Pick<ContentItem, "id" | "account_id" | "format" | "objective">[],
  snapshotsByItem: Map<string, MetricSnapshot[]>,
  window: Extract<MetricWindow, "24h" | "7d" | "30d">,
  options: {
    weightsByObjective?: Record<string, Record<PerformanceComponentKey, number>>;
    thresholds?: PerformanceTierThresholds;
    minSample?: number;
  } = {},
): Map<string, PerformanceIndexResult> {
  const weightsByObjective = options.weightsByObjective ?? DEFAULT_OBJECTIVE_WEIGHTS;
  const thresholds = options.thresholds ?? DEFAULT_PERFORMANCE_TIER_THRESHOLDS;

  const baselineInputs: BaselineGroupInput[] = [];
  for (const item of items) {
    const snapshot = getSnapshotByWindow(snapshotsByItem.get(item.id) ?? [], window);
    if (!snapshot) continue;
    baselineInputs.push({ accountId: item.account_id, format: item.format, values: computePerformanceComponentValues(snapshot) });
  }
  const baselines = buildPerformanceBaselines(baselineInputs, { minSample: options.minSample });

  const result = new Map<string, PerformanceIndexResult>();
  for (const item of items) {
    const snapshot = getSnapshotByWindow(snapshotsByItem.get(item.id) ?? [], window);
    result.set(
      item.id,
      computePerformanceIndex(
        snapshot,
        { accountId: item.account_id, format: item.format, objective: item.objective },
        baselines,
        weightsByObjective,
        thresholds,
      ),
    );
  }
  return result;
}

export interface RankedContentItem {
  item: ContentItem;
  result: PerformanceIndexResult;
}

/** Ranking por índice de performance, do maior para o menor — só inclui conteúdos com índice calculável (state "ok"); os demais aparecem como pendência/estado sem base, não no ranking. */
export function rankByPerformanceIndex(
  items: ContentItem[],
  indexByItem: Map<string, PerformanceIndexResult>,
  limit?: number,
): RankedContentItem[] {
  const ranked = items
    .map((item) => ({ item, result: indexByItem.get(item.id) }))
    .filter((entry): entry is RankedContentItem => Boolean(entry.result) && entry.result!.state === "ok")
    .sort((a, b) => (b.result.index ?? 0) - (a.result.index ?? 0));
  return typeof limit === "number" ? ranked.slice(0, limit) : ranked;
}

// ---------------------------------------------------------------------------
// Filtros e ordenação da tabela de Métricas dos Conteúdos
// ---------------------------------------------------------------------------

export const METRICAS_STATUSES: ContentItem["status"][] = ["published", "repurpose"];

function normalized(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export interface MetricasFilters {
  search: string;
  format: string;
  pillar: string;
  objective: string;
  accountId: string;
  campaignId: string;
  tier: PerformanceTier | "";
  pendingCaptureOnly: boolean;
}

export const EMPTY_METRICAS_FILTERS: MetricasFilters = {
  search: "",
  format: "",
  pillar: "",
  objective: "",
  accountId: "",
  campaignId: "",
  tier: "",
  pendingCaptureOnly: false,
};

export function filterMetricasItems(
  items: ContentItem[],
  filters: MetricasFilters,
  snapshotsByItem: Map<string, MetricSnapshot[]>,
  indexByItem: Map<string, PerformanceIndexResult>,
  now = new Date(),
): ContentItem[] {
  const needle = normalized(filters.search);
  return items.filter((item) => {
    if (filters.format && normalized(item.format) !== normalized(filters.format)) return false;
    if (filters.pillar && item.pillar !== filters.pillar) return false;
    if (filters.objective && item.objective !== filters.objective) return false;
    if (filters.accountId && item.account_id !== filters.accountId) return false;
    if (filters.campaignId && item.campaign_id !== filters.campaignId) return false;
    if (filters.tier) {
      const result = indexByItem.get(item.id);
      if (!result || result.tier !== filters.tier) return false;
    }
    if (filters.pendingCaptureOnly && !hasAnyCapturePendency(item, snapshotsByItem.get(item.id) ?? [], now)) return false;
    if (needle) {
      const haystack = normalized([item.title, item.hook, item.pillar].filter(Boolean).join(" "));
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export type MetricasSort = "index_desc" | "published_desc" | "views_desc";

export const METRICAS_SORT_LABELS: Record<MetricasSort, string> = {
  index_desc: "Índice de performance",
  published_desc: "Publicado recentemente",
  views_desc: "Mais views (última leitura)",
};

export function sortMetricasItems(
  items: ContentItem[],
  sort: MetricasSort,
  indexByItem: Map<string, PerformanceIndexResult>,
  snapshotsByItem: Map<string, MetricSnapshot[]>,
): ContentItem[] {
  const sorted = [...items];
  if (sort === "index_desc") {
    sorted.sort((a, b) => {
      const indexA = indexByItem.get(a.id);
      const indexB = indexByItem.get(b.id);
      const scoreA = indexA?.state === "ok" ? indexA.index! : -Infinity;
      const scoreB = indexB?.state === "ok" ? indexB.index! : -Infinity;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return (b.published_at ? new Date(b.published_at).getTime() : 0) - (a.published_at ? new Date(a.published_at).getTime() : 0);
    });
  } else if (sort === "views_desc") {
    sorted.sort((a, b) => {
      const viewsA = mostRecentSnapshot(snapshotsByItem.get(a.id) ?? [])?.views ?? -1;
      const viewsB = mostRecentSnapshot(snapshotsByItem.get(b.id) ?? [])?.views ?? -1;
      return viewsB - viewsA;
    });
  } else {
    sorted.sort((a, b) => {
      if (!a.published_at && !b.published_at) return 0;
      if (!a.published_at) return 1;
      if (!b.published_at) return -1;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });
  }
  return sorted;
}

// Reexporta as pendências de captura (24h/7d/30d) de Publicados — mesma
// lógica, evita duplicar: um conteúdo pendente em Publicados é o mesmo
// conteúdo pendente aqui em Métricas.
export { getCapturePendencies, hasAnyCapturePendency };
// ---------------------------------------------------------------------------
// Metadados de exibição das 22 entradas brutas (rótulo pt-BR e formatação) —
// usados pela tabela de comparação de janelas e por qualquer outra tela que
// precise listar os campos de uma leitura sem duplicar os rótulos.
// ---------------------------------------------------------------------------

export type RawMetricFieldKind = "count" | "money" | "seconds" | "percent";

export interface RawMetricField {
  key: keyof Pick<
    MetricSnapshot,
    | "views"
    | "reach"
    | "impressions"
    | "likes"
    | "comments"
    | "shares"
    | "saves"
    | "replies"
    | "profile_visits"
    | "followers_gained"
    | "link_clicks"
    | "leads"
    | "sales"
    | "revenue"
    | "average_watch_time_seconds"
    | "video_duration_seconds"
    | "three_second_views"
    | "completed_views"
    | "retention_rate"
    | "story_exits"
    | "taps_forward"
    | "taps_back"
  >;
  label: string;
  kind: RawMetricFieldKind;
}

export const RAW_METRIC_FIELDS: RawMetricField[] = [
  { key: "views", label: "Views", kind: "count" },
  { key: "reach", label: "Alcance", kind: "count" },
  { key: "impressions", label: "Impressões", kind: "count" },
  { key: "likes", label: "Curtidas", kind: "count" },
  { key: "comments", label: "Comentários", kind: "count" },
  { key: "shares", label: "Compartilhamentos", kind: "count" },
  { key: "saves", label: "Salvamentos", kind: "count" },
  { key: "replies", label: "Respostas", kind: "count" },
  { key: "profile_visits", label: "Visitas ao perfil", kind: "count" },
  { key: "followers_gained", label: "Seguidores gerados", kind: "count" },
  { key: "link_clicks", label: "Cliques", kind: "count" },
  { key: "leads", label: "Leads", kind: "count" },
  { key: "sales", label: "Vendas", kind: "count" },
  { key: "revenue", label: "Receita", kind: "money" },
  { key: "average_watch_time_seconds", label: "Tempo médio assistido", kind: "seconds" },
  { key: "video_duration_seconds", label: "Duração do vídeo", kind: "seconds" },
  { key: "three_second_views", label: "Views de 3 segundos", kind: "count" },
  { key: "completed_views", label: "Views completas", kind: "count" },
  { key: "retention_rate", label: "Retenção informada", kind: "percent" },
  { key: "story_exits", label: "Saídas de stories", kind: "count" },
  { key: "taps_forward", label: "Toques para avançar", kind: "count" },
  { key: "taps_back", label: "Toques para voltar", kind: "count" },
];

export interface DerivedMetricRow {
  label: string;
  compute: (s: MetricSnapshot) => number | null;
  suffix?: string;
}

/** Cálculos derivados exibidos lado a lado com os campos brutos, um por janela. */
export const DERIVED_METRIC_ROWS: DerivedMetricRow[] = [
  { label: "Engajamento total", compute: totalEngagement },
  { label: "Taxa de engajamento (por alcance)", compute: engagementRateByReach, suffix: "%" },
  { label: "Taxa de engajamento (por views)", compute: engagementRateByViews, suffix: "%" },
  { label: "Taxa de curtidas", compute: likeRate, suffix: "%" },
  { label: "Taxa de comentários", compute: commentRate, suffix: "%" },
  { label: "Taxa de compartilhamentos", compute: shareRate, suffix: "%" },
  { label: "Taxa de salvamentos", compute: saveRate, suffix: "%" },
  { label: "Conversão em seguidores", compute: followerConversionRate, suffix: "%" },
  { label: "CTR", compute: ctr, suffix: "%" },
  { label: "Conversão clique → venda", compute: clickToSaleConversion, suffix: "%" },
  { label: "RPM por 1.000 views", compute: rpmPer1000Views },
  { label: "Conclusão", compute: completionRate, suffix: "%" },
];
