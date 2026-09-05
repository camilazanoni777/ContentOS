import { getStalledDays } from "./content-pipeline";
import { getPillarThermometer } from "./content-pipeline";
import { CONTENT_STATUS_ROUTE } from "./content-status-meta";
import { getCapturePendencies, isMissingPublishedUrl } from "./publicados";
import type { Campaign, CampaignPayment, ContentItem, ContentStatusHistory, MetricSnapshot } from "@/types/domain";
import type { GoalComputed } from "./metas";
import { isDeliveryOverdue, isPaymentOverdue, isPublishedWithoutContent } from "./negocio";

/**
 * Central de Alertas: cálculos puros que produzem os 7 tipos de alerta
 * acionável do prompt. Nunca persistimos o alerta em si — sempre
 * recalculado ao vivo a partir dos dados já existentes (mesma filosofia
 * de metas.ts/perfil.ts/revisao-semanal.ts). Só a DECISÃO da usuária de
 * dispensar/adiar um alerta é persistida (tabela alert_dismissals),
 * amarrada a uma chave estável (`key`) — ver filterActiveAlerts.
 */

export type AlertType =
  | "overdue"
  | "missing_url"
  | "metrics_pending"
  | "stalled_idea"
  | "pillar_understocked"
  | "goal_at_risk"
  | "deadline_approaching"
  | "campaign_delivery_overdue"
  | "campaign_payment_overdue"
  | "campaign_missing_content";

export interface AlertItem {
  /** Chave estável (tipo + id da entidade + o que for necessário para diferenciar ocorrências) — usada para dispensar/adiar. */
  key: string;
  type: AlertType;
  title: string;
  description: string;
  href: string | null;
  actionLabel: string | null;
  canDismiss: boolean;
  canDefer: boolean;
}

const WINDOW_LABELS: Record<"24h" | "7d" | "30d", string> = { "24h": "24 horas", "7d": "7 dias", "30d": "30 dias" };

/**
 * Conteúdo atrasado: usa um critério mais amplo que editing.ts#isOverdue
 * (que só olha production_due_at) — aqui, como em hoje.ts#getHojeSummary,
 * também considera scheduled_at vencido. Deliberadamente não unificado com
 * isOverdue nem com a query de hoje.ts nesta fase, para não arriscar
 * regressão nos dois lugares que já usam essas versões — ver TODO.md.
 */
function isAlertOverdue(item: Pick<ContentItem, "status" | "scheduled_at" | "production_due_at">, now: Date): boolean {
  if (["published", "archived", "canceled"].includes(item.status)) return false;
  const scheduledOverdue = Boolean(item.scheduled_at) && new Date(item.scheduled_at as string).getTime() < now.getTime();
  const dueOverdue = Boolean(item.production_due_at) && new Date(item.production_due_at as string).getTime() < now.getTime();
  return scheduledOverdue || dueOverdue;
}

function routeForItem(item: Pick<ContentItem, "id" | "status">): string {
  // Rotas por item existem hoje só para roteiros/edição/agendamento/métricas de conteúdos —
  // as demais telas (ideias, gravação, publicados) ainda não têm rota por registro, então o
  // alerta linka para a lista (a busca/filtro de lá encontra o conteúdo pelo título).
  if (item.status === "scripting") return `/roteiros/${item.id}`;
  if (item.status === "editing" || item.status === "awaiting_approval") return `/edicao/${item.id}`;
  if (item.status === "scheduled") return `/agendamento/${item.id}`;
  return CONTENT_STATUS_ROUTE[item.status] ?? "/hoje";
}

export interface AlertSources {
  /** Conteúdos ativos (não arquivados, não publicados/cancelados) — usado para atrasados, ideias paradas e prazos vencendo. */
  activeItems: ContentItem[];
  /** Histórico de status de TODOS os activeItems (para calcular dias parados desde a última mudança). */
  statusHistory: ContentStatusHistory[];
  /** Conteúdos publicados (para URL ausente e métricas pendentes). */
  publishedItems: ContentItem[];
  /** Leituras de métricas dos publishedItems, por content_item_id. */
  metricSnapshotsByItemId: Map<string, MetricSnapshot[]>;
  /** Pilares cadastrados em Configurações — para o termômetro incluir pilares com 0 ideias, não só os que já têm alguma. */
  knownPillars: string[];
  /** Metas já computadas (ver metas.ts#computeGoal) — este módulo só filtra por status "at_risk". */
  computedGoals: GoalComputed[];
  /** Campanhas ativas, com prazo de entrega definido. */
  campaigns: Campaign[];
  campaignPayments?: CampaignPayment[];
  now: Date;
  /** Quantos dias de antecedência conta como "vencendo" para campanhas e prazos de conteúdo (produção). Padrão: 3. */
  deadlineWarningDays?: number;
}

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });
}

/** Calcula todos os alertas acionáveis vivos a partir dos dados já buscados. Não filtra dispensados/adiados — ver filterActiveAlerts. */
export function computeAlerts(sources: AlertSources): AlertItem[] {
  const { activeItems, statusHistory, publishedItems, metricSnapshotsByItemId, knownPillars, computedGoals, campaigns, now } = sources;
  const campaignPayments = sources.campaignPayments ?? [];
  const deadlineWarningDays = sources.deadlineWarningDays ?? 3;
  const alerts: AlertItem[] = [];

  // 1. Conteúdo atrasado.
  for (const item of activeItems) {
    if (!isAlertOverdue(item, now)) continue;
    const dueDate = item.production_due_at ?? item.scheduled_at;
    alerts.push({
      key: `overdue:${item.id}`,
      type: "overdue",
      title: item.title,
      description: dueDate ? `Atrasado desde ${formatDateLabel(dueDate)}` : "Atrasado",
      href: routeForItem(item),
      actionLabel: "Ver conteúdo",
      canDismiss: true,
      canDefer: true,
    });
  }

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
  const allContents = [...activeItems, ...publishedItems];
  for (const campaign of campaigns) {
    if (isDeliveryOverdue(campaign, today)) alerts.push({ key:`campaign_delivery_overdue:${campaign.id}`,type:"campaign_delivery_overdue",title:campaign.name,description:`Entrega vencida desde ${formatDateLabel(campaign.delivery_due_date as string)}`,href:`/negocio/campanhas/${campaign.id}`,actionLabel:"Ver campanha",canDismiss:true,canDefer:true });
    if (isPublishedWithoutContent(campaign, allContents)) alerts.push({ key:`campaign_missing_content:${campaign.id}`,type:"campaign_missing_content",title:campaign.name,description:"Campanha publicada sem conteúdo vinculado",href:`/negocio/campanhas/${campaign.id}`,actionLabel:"Vincular conteúdo",canDismiss:true,canDefer:false });
  }
  for (const payment of campaignPayments) {
    if (!isPaymentOverdue(payment, today)) continue;
    const campaign = campaigns.find((item) => item.id === payment.campaign_id);
    alerts.push({ key:`campaign_payment_overdue:${payment.id}`,type:"campaign_payment_overdue",title:campaign?.name??"Pagamento de campanha",description:`Pagamento vencido desde ${formatDateLabel(payment.due_date as string)}`,href:`/negocio/campanhas/${payment.campaign_id}`,actionLabel:"Ver pagamento",canDismiss:true,canDefer:true });
  }

  // 2. Publicado sem URL.
  for (const item of publishedItems) {
    if (!isMissingPublishedUrl(item)) continue;
    alerts.push({
      key: `missing_url:${item.id}`,
      type: "missing_url",
      title: item.title,
      description: item.published_at ? `Publicado em ${formatDateLabel(item.published_at)} sem URL registrada` : "Publicado sem URL registrada",
      href: "/publicados",
      actionLabel: "Adicionar URL",
      canDismiss: true,
      canDefer: true,
    });
  }

  // 3. Métricas de 24h/7d/30d pendentes — um alerta por janela vencida, não um agregado por conteúdo
  //    (senão dispensar a pendência de 24h dispensaria também a de 7d quando ela vencer depois).
  for (const item of publishedItems) {
    const pendencies = getCapturePendencies(item, metricSnapshotsByItemId.get(item.id) ?? [], now);
    for (const pendency of pendencies) {
      if (!pendency.due) continue;
      alerts.push({
        key: `metrics_pending:${item.id}:${pendency.window}`,
        type: "metrics_pending",
        title: item.title,
        description: `Métrica de ${WINDOW_LABELS[pendency.window]} pendente de captura`,
        href: "/publicados",
        actionLabel: "Registrar métrica",
        canDismiss: true,
        canDefer: true,
      });
    }
  }

  // 4. Ideia parada há mais de 45 dias.
  for (const item of activeItems) {
    if (item.status !== "idea" && item.status !== "researching") continue;
    const days = getStalledDays(item, statusHistory, now);
    if (days <= 45) continue;
    alerts.push({
      key: `stalled_idea:${item.id}`,
      type: "stalled_idea",
      title: item.title,
      description: `Parada há ${days} dias sem mudança de status`,
      href: "/ideias",
      actionLabel: "Ver ideia",
      canDismiss: true,
      canDefer: true,
    });
  }

  // 5. Pilar com menos de 3 ideias disponíveis.
  const thermometer = getPillarThermometer(activeItems, knownPillars);
  for (const entry of thermometer) {
    if (!entry.understocked) continue;
    alerts.push({
      key: `pillar_understocked:${entry.pillar}`,
      type: "pillar_understocked",
      title: entry.pillar,
      description: entry.count === 0 ? "Nenhuma ideia disponível neste pilar" : `Só ${entry.count} ideia(s) disponível(is) neste pilar`,
      href: "/ideias",
      actionLabel: "Criar ideia",
      canDismiss: true,
      canDefer: true,
    });
  }

  // 6. Meta em risco.
  for (const computed of computedGoals) {
    if (computed.status !== "at_risk") continue;
    alerts.push({
      key: `goal_at_risk:${computed.goal.id}`,
      type: "goal_at_risk",
      title: computed.goal.metric,
      description: "Meta em risco: o progresso está bem atrás do ritmo esperado para o período.",
      href: "/metas",
      actionLabel: "Ver meta",
      canDismiss: true,
      canDefer: true,
    });
  }

  // 7. Campanha ou entrega (prazo de produção de conteúdo) vencendo.
  const warningMs = deadlineWarningDays * 24 * 60 * 60 * 1000;
  for (const campaign of campaigns) {
    if (!campaign.delivery_due_date || campaign.archived_at || campaign.negotiation_status === "declined" || ["approved", "published"].includes(campaign.delivery_status)) continue;
    const endsAt = new Date(`${campaign.delivery_due_date}T23:59:59-03:00`).getTime();
    const diff = endsAt - now.getTime();
    if (diff < 0 || diff > warningMs) continue;
    alerts.push({
      key: `deadline_approaching:campaign:${campaign.id}`,
      type: "deadline_approaching",
      title: campaign.name,
      description: `Entrega vence em ${formatDateLabel(campaign.delivery_due_date)}`,
      href: `/negocio/campanhas/${campaign.id}`,
      actionLabel: "Ver campanha",
      canDismiss: true,
      canDefer: true,
    });
  }
  for (const item of activeItems) {
    if (!item.production_due_at) continue;
    if (isAlertOverdue(item, now)) continue; // já vencido -> é alerta de "overdue", não de "vencendo".
    const diff = new Date(item.production_due_at).getTime() - now.getTime();
    if (diff < 0 || diff > warningMs) continue;
    alerts.push({
      key: `deadline_approaching:content:${item.id}`,
      type: "deadline_approaching",
      title: item.title,
      description: `Prazo de produção vence em ${formatDateLabel(item.production_due_at)}`,
      href: routeForItem(item),
      actionLabel: "Ver conteúdo",
      canDismiss: true,
      canDefer: true,
    });
  }

  return alerts;
}

export interface AlertDismissalState {
  alert_key: string;
  dismissed: boolean;
  snoozed_until: string | null;
}

/**
 * Aplica dispensar/adiar aos alertas vivos. Dispensado = some até a condição
 * mudar (e gerar uma chave diferente ou deixar de existir). Adiado = some
 * até snoozed_until, depois volta a aparecer normalmente. É isto que
 * garante "não gerar alertas repetidos infinitos": a MESMA ocorrência
 * (mesma key) nunca reaparece depois de dispensada.
 */
export function filterActiveAlerts(alerts: AlertItem[], dismissals: AlertDismissalState[], now: Date): AlertItem[] {
  const byKey = new Map(dismissals.map((dismissal) => [dismissal.alert_key, dismissal]));
  return alerts.filter((alert) => {
    const dismissal = byKey.get(alert.key);
    if (!dismissal) return true;
    if (dismissal.dismissed) return false;
    if (dismissal.snoozed_until && new Date(dismissal.snoozed_until).getTime() > now.getTime()) return false;
    return true;
  });
}

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  overdue: "Conteúdo atrasado",
  missing_url: "Publicado sem URL",
  metrics_pending: "Métrica pendente",
  stalled_idea: "Ideia parada",
  pillar_understocked: "Pilar com poucas ideias",
  goal_at_risk: "Meta em risco",
  deadline_approaching: "Prazo vencendo",
  campaign_delivery_overdue: "Entrega de campanha vencida",
  campaign_payment_overdue: "Pagamento de campanha vencido",
  campaign_missing_content: "Campanha sem conteúdo",
};
