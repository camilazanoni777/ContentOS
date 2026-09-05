import type {
  Campaign,
  CampaignDeliverable,
  CampaignPayment,
  ContentItem,
  MetricSnapshot,
  SalesRecord,
} from "@/types/domain";

export const CAMPAIGN_TYPES = ["barter", "paid_post", "ambassador", "affiliate", "event_appearance", "exclusive_content", "image_licensing", "other"] as const;
export const CAMPAIGN_TYPE_LABELS: Record<(typeof CAMPAIGN_TYPES)[number], string> = {
  barter: "Permuta", paid_post: "Publipost pago", ambassador: "Embaixadora", affiliate: "Afiliação",
  event_appearance: "Presença em evento", exclusive_content: "Conteúdo exclusivo / whitelabel",
  image_licensing: "Cessão de imagem", other: "Outro",
};
export const NEGOTIATION_STATUSES = ["prospecting", "first_contact", "proposal_sent", "negotiating", "approved", "declined", "standby"] as const;
export const NEGOTIATION_STATUS_LABELS: Record<(typeof NEGOTIATION_STATUSES)[number], string> = {
  prospecting: "Prospecção", first_contact: "Primeiro contato", proposal_sent: "Proposta enviada",
  negotiating: "Em negociação", approved: "Aprovada", declined: "Recusada", standby: "Standby",
};
export const CONTRACT_STATUSES = ["not_applicable", "not_sent", "sent", "under_review", "signed"] as const;
export const CONTRACT_STATUS_LABELS: Record<(typeof CONTRACT_STATUSES)[number], string> = {
  not_applicable: "Não se aplica", not_sent: "Não enviado", sent: "Enviado", under_review: "Em revisão", signed: "Assinado",
};
export const DELIVERY_STATUSES = ["not_started", "in_production", "sent_for_approval", "approved", "published", "late"] as const;
export const DELIVERY_STATUS_LABELS: Record<(typeof DELIVERY_STATUSES)[number], string> = {
  not_started: "Não iniciada", in_production: "Em produção", sent_for_approval: "Enviada para aprovação",
  approved: "Aprovada", published: "Publicada", late: "Atrasada",
};
export const CAMPAIGN_PAYMENT_STATUSES = ["not_applicable", "to_be_agreed", "awaiting_invoice", "awaiting_payment", "partially_paid", "paid", "overdue", "canceled"] as const;
export const CAMPAIGN_PAYMENT_STATUS_LABELS: Record<(typeof CAMPAIGN_PAYMENT_STATUSES)[number], string> = {
  not_applicable: "Não se aplica", to_be_agreed: "A combinar", awaiting_invoice: "Aguardando nota fiscal",
  awaiting_payment: "Aguardando pagamento", partially_paid: "Pago parcialmente", paid: "Pago",
  overdue: "Atrasado", canceled: "Cancelado",
};
export const INSTALLMENT_STATUSES = ["awaiting_invoice", "awaiting_payment", "partially_paid", "paid", "overdue", "canceled"] as const;
export const PRODUCT_STATUSES = ["draft", "active", "inactive", "archived"] as const;
export const PRODUCT_STATUS_LABELS: Record<(typeof PRODUCT_STATUSES)[number], string> = {
  draft: "Rascunho", active: "Ativo", inactive: "Inativo", archived: "Arquivado",
};

export function formatCurrency(value: number | null, currency = "BRL"): string {
  return value === null ? "—" : new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
}

function toCents(value: number | null | undefined): number | null {
  return typeof value === "number" ? Math.round(value * 100) : null;
}
function fromCents(value: number): number { return value / 100; }

export function confirmedReceived(payment: CampaignPayment): number {
  if (!payment.received_at || payment.status === "canceled") return 0;
  return payment.received_amount ?? 0;
}

export function campaignFinancials(campaign: Campaign, payments: CampaignPayment[], today: string) {
  const own = payments.filter((payment) => payment.campaign_id === campaign.id);
  const contracted = campaign.contracted_fee;
  const receivedCents = own.reduce((sum, payment) => sum + (toCents(confirmedReceived(payment)) ?? 0), 0);
  const contractedCents = toCents(contracted);
  const balanceCents = contractedCents === null ? null : Math.max(0, contractedCents - receivedCents);
  const overdueCents = own.reduce((sum, payment) => {
    if (!payment.due_date || payment.due_date >= today || payment.status === "paid" || payment.status === "canceled") return sum;
    const amount = toCents(payment.amount) ?? 0;
    const received = toCents(confirmedReceived(payment)) ?? 0;
    return sum + Math.max(0, amount - received);
  }, 0);
  return {
    contracted,
    received: fromCents(receivedCents),
    balance: balanceCents === null ? null : fromCents(balanceCents),
    overdue: fromCents(overdueCents),
  };
}

export function isDeliveryOverdue(campaign: Pick<Campaign, "delivery_due_date" | "delivery_status">, today: string): boolean {
  return Boolean(campaign.delivery_due_date && campaign.delivery_due_date < today && !["approved", "published"].includes(campaign.delivery_status));
}

export function isPaymentOverdue(payment: CampaignPayment, today: string): boolean {
  if (!payment.due_date || payment.due_date >= today || ["paid", "canceled"].includes(payment.status)) return false;
  return (toCents(payment.amount) ?? 0) > (toCents(confirmedReceived(payment)) ?? 0);
}

export function isPublishedWithoutContent(campaign: Pick<Campaign, "id" | "delivery_status">, contents: ContentItem[]): boolean {
  return campaign.delivery_status === "published" && !contents.some((item) => item.campaign_id === campaign.id);
}

export interface EffectiveSalesRecord {
  record: SalesRecord;
  linkClicks: number | null;
  leads: number | null;
  sales: number | null;
  revenue: number | null;
}

export function resolveSalesRecord(record: SalesRecord, snapshotsById: Map<string, MetricSnapshot>): EffectiveSalesRecord {
  if (record.source === "metric_snapshot") {
    const snapshot = record.metric_snapshot_id ? snapshotsById.get(record.metric_snapshot_id) : undefined;
    return { record, linkClicks: snapshot?.link_clicks ?? null, leads: snapshot?.leads ?? null, sales: snapshot?.sales ?? null, revenue: snapshot?.revenue ?? null };
  }
  return { record, linkClicks: record.link_clicks, leads: record.leads, sales: record.sales_count, revenue: record.revenue };
}

function ratio(numerator: number | null, denominator: number | null): number | null {
  return numerator === null || denominator === null || denominator <= 0 ? null : (numerator / denominator) * 100;
}

export function salesConversions(entry: Pick<EffectiveSalesRecord, "linkClicks" | "leads" | "sales" | "revenue">) {
  return {
    clickToLead: ratio(entry.leads, entry.linkClicks),
    clickToSale: ratio(entry.sales, entry.linkClicks),
    averageTicket: entry.revenue === null || entry.sales === null || entry.sales <= 0 ? null : entry.revenue / entry.sales,
  };
}

function nullableSum(values: Array<number | null>): number | null {
  const present = values.filter((value): value is number => value !== null);
  if (present.length === 0) return null;
  return fromCents(present.reduce((sum, value) => sum + (toCents(value) ?? 0), 0));
}

export interface RevenueSummary {
  contracted: number | null;
  received: number;
  receivable: number | null;
  overdue: number;
  productRevenue: number | null;
  totalRevenue: number;
  sales: number | null;
  linkClicks: number | null;
  leads: number | null;
  clickToLead: number | null;
  clickToSale: number | null;
  averageTicket: number | null;
}

export function computeRevenueSummary(campaigns: Campaign[], payments: CampaignPayment[], records: EffectiveSalesRecord[], today: string, allPayments: CampaignPayment[] = payments): RevenueSummary {
  const approved = campaigns.filter((campaign) => campaign.negotiation_status === "approved" && !campaign.archived_at);
  const financials = approved.map((campaign) => campaignFinancials(campaign, allPayments, today));
  const contracted = nullableSum(financials.map((item) => item.contracted));
  const approvedIds = new Set(approved.map((campaign) => campaign.id));
  const received = nullableSum(payments.filter((payment) => approvedIds.has(payment.campaign_id)).map((payment) => confirmedReceived(payment))) ?? 0;
  const receivable = contracted === null ? null : nullableSum(financials.map((item) => item.balance));
  const overdue = nullableSum(financials.map((item) => item.overdue)) ?? 0;
  const productRevenue = nullableSum(records.map((item) => item.revenue));
  const sales = nullableCountSum(records.map((item) => item.sales));
  const linkClicks = nullableCountSum(records.map((item) => item.linkClicks));
  const leads = nullableCountSum(records.map((item) => item.leads));
  const conversions = salesConversions({ linkClicks, leads, sales, revenue: productRevenue });
  return { contracted, received, receivable, overdue, productRevenue, totalRevenue: fromCents((toCents(received) ?? 0) + (toCents(productRevenue) ?? 0)), sales, linkClicks, leads, ...conversions };
}

function nullableCountSum(values: Array<number | null>): number | null {
  const present = values.filter((value): value is number => value !== null);
  return present.length === 0 ? null : present.reduce((sum, value) => sum + value, 0);
}

export function filterByPeriod<T extends { sale_date: string }>(records: T[], from: string, to: string): T[] {
  return records.filter((record) => record.sale_date >= from && record.sale_date <= to);
}

export function campaignTimeline(campaign: Campaign, deliverables: CampaignDeliverable[], payments: CampaignPayment[]) {
  const events: Array<{ date: string; label: string }> = [];
  events.push({ date: campaign.created_at, label: "Campanha criada" });
  if (campaign.first_contact_date) events.push({ date: campaign.first_contact_date, label: "Primeiro contato" });
  for (const item of deliverables) if (item.completed_at) events.push({ date: item.completed_at, label: `Entregável concluído: ${item.title}` });
  for (const payment of payments) if (payment.received_at) events.push({ date: payment.received_at, label: `Recebimento confirmado: ${formatCurrency(confirmedReceived(payment), campaign.currency)}` });
  if (campaign.published_at) events.push({ date: campaign.published_at, label: "Campanha publicada" });
  return events.sort((a, b) => a.date.localeCompare(b.date));
}
