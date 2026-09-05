import { mostRecentSnapshot } from "./metricas";
import type { ContentItem, Goal, MetricSnapshot, ProfileSnapshot } from "@/types/domain";

/**
 * Metas semanais/mensais — catálogo de métricas suportadas, cálculo do valor
 * atual (sempre derivado ao vivo das fontes brutas, nunca persistido — mesma
 * filosofia do índice de performance em metricas.ts), progresso e status.
 *
 * `goals.metric` guarda um destes 12 valores como texto livre (o banco não
 * usa enum, ver migração) — este arquivo é a única fonte de verdade de quais
 * valores são válidos e o que cada um significa.
 */
export const GOAL_METRICS = [
  "seguidores",
  "conteudos_publicados",
  "views",
  "alcance",
  "compartilhamentos",
  "salvamentos",
  "visitas_perfil",
  "cliques",
  "leads",
  "vendas",
  "receita",
  "consistencia",
] as const;

export type GoalMetric = (typeof GOAL_METRICS)[number];

export const GOAL_METRIC_LABELS: Record<GoalMetric, string> = {
  seguidores: "Seguidores",
  conteudos_publicados: "Conteúdos publicados",
  views: "Views",
  alcance: "Alcance",
  compartilhamentos: "Compartilhamentos",
  salvamentos: "Salvamentos",
  visitas_perfil: "Visitas ao perfil",
  cliques: "Cliques",
  leads: "Leads",
  vendas: "Vendas",
  receita: "Receita",
  consistencia: "Consistência (dias com publicação)",
};

/** Metas cujo valor vem de profile_snapshots (somando o campo direto no período) — todas as métricas de fluxo exceto as baseadas em conteúdo/conteúdos. */
const PROFILE_FLOW_FIELD: Partial<Record<GoalMetric, keyof ProfileSnapshot>> = {
  views: "views",
  alcance: "reach",
  visitas_perfil: "profile_visits",
  cliques: "website_clicks",
  leads: "leads",
  vendas: "sales",
  receita: "revenue",
};

export type GoalStatus = "not_started" | "on_pace" | "in_progress" | "at_risk" | "achieved" | "exceeded";

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: "Não iniciada",
  on_pace: "No ritmo",
  in_progress: "Em andamento",
  at_risk: "Em risco",
  achieved: "Atingida",
  exceeded: "Superada",
};

/**
 * Explicação da regra de status, para exibir na interface (o prompt exige
 * que a regra fique visível, não só implementada). Mantida aqui, perto do
 * cálculo, para nunca dessincronizar do que o código realmente faz.
 */
export const GOAL_STATUS_RULE_EXPLANATION =
  "O status compara duas porcentagens: quanto da meta já foi alcançado (progresso) e quanto do período já passou (tempo decorrido) — nunca olha só o valor final. " +
  "Se o progresso está igual ou à frente do tempo decorrido, a meta está \"no ritmo\". Se está um pouco atrás (entre 70% e 100% do ritmo esperado), está \"em andamento\". " +
  "Abaixo de 70% do ritmo esperado, entra \"em risco\". Ao atingir 100% do valor-alvo a meta fica \"atingida\"; passando de 150%, \"superada\". " +
  "Antes da data de início, toda meta começa \"não iniciada\".";

export interface GoalStatusThresholds {
  /** Razão progresso/tempo-decorrido abaixo da qual a meta entra "em risco" (padrão 0.7 — 70% do ritmo esperado). */
  atRiskBelowPaceRatio: number;
  /** Progresso mínimo (%) para "atingida" (padrão 100). */
  achievedAtPercent: number;
  /** Progresso mínimo (%) para "superada" (padrão 150). */
  exceededAtPercent: number;
}

/** Limites padrão do status — configuráveis via app_settings.extra.goal_status_thresholds (mesmo padrão de getPerformanceIndexThresholds em metricas.ts). */
export const DEFAULT_GOAL_STATUS_THRESHOLDS: GoalStatusThresholds = {
  atRiskBelowPaceRatio: 0.7,
  achievedAtPercent: 100,
  exceededAtPercent: 150,
};

export function getGoalStatusThresholds(extra: unknown): GoalStatusThresholds {
  if (!extra || typeof extra !== "object") return DEFAULT_GOAL_STATUS_THRESHOLDS;
  const raw = (extra as Record<string, unknown>).goal_status_thresholds;
  if (!raw || typeof raw !== "object") return DEFAULT_GOAL_STATUS_THRESHOLDS;
  const candidate = raw as Record<string, unknown>;
  const atRiskBelowPaceRatio = candidate.atRiskBelowPaceRatio;
  const achievedAtPercent = candidate.achievedAtPercent;
  const exceededAtPercent = candidate.exceededAtPercent;
  if (
    typeof atRiskBelowPaceRatio === "number" &&
    typeof achievedAtPercent === "number" &&
    typeof exceededAtPercent === "number" &&
    atRiskBelowPaceRatio > 0 &&
    atRiskBelowPaceRatio < 1 &&
    achievedAtPercent > 0 &&
    exceededAtPercent > achievedAtPercent
  ) {
    return { atRiskBelowPaceRatio, achievedAtPercent, exceededAtPercent };
  }
  return DEFAULT_GOAL_STATUS_THRESHOLDS;
}

/** Metas-padrão configuráveis (valor-alvo sugerido por métrica + tipo de período) — app_settings.extra.default_goals, mesmo padrão de "configurável sem tabela nova". */
export type DefaultGoalTargets = Partial<Record<GoalMetric, number>>;

export function getDefaultGoalTargets(extra: unknown, periodType: "weekly" | "monthly"): DefaultGoalTargets {
  if (!extra || typeof extra !== "object") return {};
  const raw = (extra as Record<string, unknown>).default_goals;
  if (!raw || typeof raw !== "object") return {};
  const byPeriod = (raw as Record<string, unknown>)[periodType];
  if (!byPeriod || typeof byPeriod !== "object") return {};
  const result: DefaultGoalTargets = {};
  for (const metric of GOAL_METRICS) {
    const value = (byPeriod as Record<string, unknown>)[metric];
    if (typeof value === "number" && value >= 0) {
      result[metric] = value;
    }
  }
  return result;
}

/** Grava as metas-padrão de volta em app_settings.extra, preservando o restante de `extra` (ex.: performance_index_thresholds). */
export function withDefaultGoalTargets(
  extra: unknown,
  periodType: "weekly" | "monthly",
  targets: DefaultGoalTargets,
): Record<string, unknown> {
  const base = extra && typeof extra === "object" ? { ...(extra as Record<string, unknown>) } : {};
  const existingDefaults =
    base.default_goals && typeof base.default_goals === "object" ? { ...(base.default_goals as Record<string, unknown>) } : {};
  existingDefaults[periodType] = targets;
  base.default_goals = existingDefaults;
  return base;
}

// ---------------------------------------------------------------------------
// Cálculo do valor atual
// ---------------------------------------------------------------------------

export interface GoalMetricSources {
  /** Todos os registros de perfil do usuário, de todas as contas — metas não são filtradas por conta (mesma simplificação já adotada em weekly-plan.ts para o delta de seguidores). */
  profileSnapshots: ProfileSnapshot[];
  /** Todos os conteúdos do usuário (não arquivados). */
  contentItems: ContentItem[];
  /** Leituras de métricas por conteúdo — usado para compartilhamentos/salvamentos, pegando sempre a leitura mais recente de cada conteúdo (mostRecentSnapshot) para não contar a mesma leitura duas vezes entre janelas sobrepostas. */
  metricSnapshotsByItemId: Map<string, MetricSnapshot[]>;
}

function clampRangeEnd(periodStart: string, periodEnd: string, todayISO: string): string {
  const end = todayISO < periodEnd ? todayISO : periodEnd;
  return end < periodStart ? periodStart : end;
}

function sumProfileField(snapshots: ProfileSnapshot[], field: keyof ProfileSnapshot, fromISO: string, toISO: string): number | null {
  const values = snapshots
    .filter((s) => s.snapshot_date >= fromISO && s.snapshot_date <= toISO)
    .map((s) => s[field])
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0);
}

function latestFollowersAcrossAccounts(snapshots: ProfileSnapshot[], asOfISO: string): number | null {
  const byAccount = new Map<string, ProfileSnapshot>();
  for (const snapshot of snapshots) {
    if (snapshot.snapshot_date > asOfISO) continue;
    if (typeof snapshot.followers !== "number") continue;
    const current = byAccount.get(snapshot.account_id);
    if (!current || snapshot.snapshot_date > current.snapshot_date) {
      byAccount.set(snapshot.account_id, snapshot);
    }
  }
  if (byAccount.size === 0) return null;
  let total = 0;
  for (const snapshot of byAccount.values()) total += snapshot.followers as number;
  return total;
}

function itemsPublishedInRange(items: ContentItem[], fromISO: string, toISO: string): ContentItem[] {
  return items.filter((item) => {
    if (!item.published_at) return false;
    const date = item.published_at.slice(0, 10);
    return date >= fromISO && date <= toISO;
  });
}

function sumContentEngagementField(
  items: ContentItem[],
  metricSnapshotsByItemId: Map<string, MetricSnapshot[]>,
  field: "shares" | "saves",
): number | null {
  const values = items
    .map((item) => mostRecentSnapshot(metricSnapshotsByItemId.get(item.id) ?? []))
    .map((snapshot) => snapshot?.[field] ?? null)
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0);
}

/**
 * Valor atual de uma meta, considerando só o que já aconteceu (do início do
 * período até hoje, ou até o fim se o período já passou) — uma meta em
 * andamento não deve ser julgada pelo que "vai" acontecer no resto do
 * período. `null` quando não há nenhum dado bruto na janela (nunca 0, que
 * significaria "medido e deu zero").
 */
export function computeGoalCurrentValue(
  metric: GoalMetric,
  periodStart: string,
  periodEnd: string,
  todayISO: string,
  sources: GoalMetricSources,
): number | null {
  const effectiveEnd = clampRangeEnd(periodStart, periodEnd, todayISO);
  if (todayISO < periodStart) return null;

  if (metric === "seguidores") {
    return latestFollowersAcrossAccounts(sources.profileSnapshots, effectiveEnd);
  }

  if (metric === "conteudos_publicados") {
    const count = itemsPublishedInRange(sources.contentItems, periodStart, effectiveEnd).length;
    return count;
  }

  if (metric === "consistencia") {
    const days = new Set(
      itemsPublishedInRange(sources.contentItems, periodStart, effectiveEnd).map((item) => item.published_at!.slice(0, 10)),
    );
    return days.size;
  }

  if (metric === "compartilhamentos" || metric === "salvamentos") {
    const items = itemsPublishedInRange(sources.contentItems, periodStart, effectiveEnd);
    return sumContentEngagementField(items, sources.metricSnapshotsByItemId, metric === "compartilhamentos" ? "shares" : "saves");
  }

  const field = PROFILE_FLOW_FIELD[metric];
  if (!field) return null;
  return sumProfileField(sources.profileSnapshots, field, periodStart, effectiveEnd);
}

/**
 * Valor inicial "efetivo" de uma meta: o que a pessoa informou (`initial_value`)
 * quando preenchido, senão um padrão que depende do tipo de métrica. Métricas
 * de fluxo (views, receita etc.) naturalmente começam do zero no período —
 * `0` é o padrão certo. Seguidores é estoque: começar de 0 faria o progresso
 * ficar sem sentido (uma meta de "chegar a 10 mil seguidores" partindo de uma
 * conta que já tem 8 mil), então o padrão é a contagem de seguidores no
 * início do período, quando existir uma leitura.
 */
export function effectiveInitialValue(goal: Goal, sources: GoalMetricSources): number | null {
  if (typeof goal.initial_value === "number") return goal.initial_value;
  if ((goal.metric as GoalMetric) === "seguidores") {
    return latestFollowersAcrossAccounts(sources.profileSnapshots, goal.period_start);
  }
  return 0;
}

/** Progresso em % de uma meta: (atual - inicial) / (alvo - inicial) × 100. `null` sem alvo, sem valor atual, ou quando alvo == inicial (progresso indefinido). */
export function computeProgressPercent(currentValue: number | null, targetValue: number | null, initialValue: number | null): number | null {
  if (currentValue === null || targetValue === null) return null;
  const base = initialValue ?? 0;
  const denominator = targetValue - base;
  if (denominator === 0) return currentValue - base >= 0 ? 100 : 0;
  return ((currentValue - base) / denominator) * 100;
}

/** % do período já decorrido, em relação a hoje — 0 antes do início, 100 no fim ou depois. */
export function computeElapsedPercent(periodStart: string, periodEnd: string, todayISO: string): number {
  const start = new Date(`${periodStart}T00:00:00Z`).getTime();
  const end = new Date(`${periodEnd}T00:00:00Z`).getTime();
  const today = new Date(`${todayISO}T00:00:00Z`).getTime();
  const totalDays = Math.max(1, Math.round((end - start) / 86_400_000) + 1);
  if (today < start) return 0;
  if (today > end) return 100;
  const elapsedDays = Math.round((today - start) / 86_400_000) + 1;
  return Math.min(100, (elapsedDays / totalDays) * 100);
}

/** Dias restantes até o fim do período — 0 quando o período já terminou. */
export function computeDaysRemaining(periodEnd: string, todayISO: string): number {
  const end = new Date(`${periodEnd}T00:00:00Z`).getTime();
  const today = new Date(`${todayISO}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((end - today) / 86_400_000));
}

/**
 * Status de uma meta — compara progresso com tempo decorrido (ver
 * GOAL_STATUS_RULE_EXPLANATION, exibida na interface), nunca só o valor
 * final. Uma meta "no ritmo" pode ter só 20% de progresso se também só 15%
 * do período passou.
 */
export function computeGoalStatus(
  periodStart: string,
  todayISO: string,
  progressPercent: number | null,
  elapsedPercent: number,
  thresholds: GoalStatusThresholds = DEFAULT_GOAL_STATUS_THRESHOLDS,
): GoalStatus {
  if (todayISO < periodStart) return "not_started";
  if (progressPercent === null) return elapsedPercent <= 0 ? "not_started" : "in_progress";
  if (progressPercent >= thresholds.exceededAtPercent) return "exceeded";
  if (progressPercent >= thresholds.achievedAtPercent) return "achieved";
  if (elapsedPercent <= 0) return progressPercent > 0 ? "on_pace" : "in_progress";
  const paceRatio = progressPercent / elapsedPercent;
  if (paceRatio >= 1) return "on_pace";
  if (paceRatio >= thresholds.atRiskBelowPaceRatio) return "in_progress";
  return "at_risk";
}

export interface GoalComputed {
  goal: Goal;
  currentValue: number | null;
  effectiveInitialValue: number | null;
  missing: number | null;
  progressPercent: number | null;
  elapsedPercent: number;
  daysRemaining: number;
  status: GoalStatus;
}

/** Calcula tudo (valor atual, progresso, status etc.) de uma meta — função de fachada usada pela UI. */
export function computeGoal(
  goal: Goal,
  sources: GoalMetricSources,
  todayISO: string,
  thresholds: GoalStatusThresholds = DEFAULT_GOAL_STATUS_THRESHOLDS,
): GoalComputed {
  const currentValue = computeGoalCurrentValue(goal.metric as GoalMetric, goal.period_start, goal.period_end, todayISO, sources);
  const initial = effectiveInitialValue(goal, sources);
  const progressPercent = computeProgressPercent(currentValue, goal.target_value, initial);
  const elapsedPercent = computeElapsedPercent(goal.period_start, goal.period_end, todayISO);
  const missing =
    currentValue === null || goal.target_value === null ? null : Math.max(0, goal.target_value - currentValue);
  const status = computeGoalStatus(goal.period_start, todayISO, progressPercent, elapsedPercent, thresholds);

  return {
    goal,
    currentValue,
    effectiveInitialValue: initial,
    missing,
    progressPercent,
    elapsedPercent,
    daysRemaining: computeDaysRemaining(goal.period_end, todayISO),
    status,
  };
}
