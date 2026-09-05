import { describe, expect, it } from "vitest";

import {
  ALERT_TYPE_LABELS,
  computeAlerts,
  filterActiveAlerts,
  type AlertDismissalState,
  type AlertSources,
} from "./alerts";
import type { GoalComputed } from "./metas";
import type { Campaign, CampaignPayment, ContentItem, MetricSnapshot } from "@/types/domain";

const NOW = new Date("2026-09-04T12:00:00.000Z"); // 09:00 local (UTC-03:00).

function item(overrides: Partial<ContentItem> = {}): ContentItem {
  return {
    id: "item-1",
    user_id: "user-1",
    account_id: "acc-1",
    title: "Reel de rotina",
    hook: null,
    summary: null,
    script: null,
    caption: null,
    format: "reel",
    pillar: null,
    objective: null,
    cta: null,
    priority: null,
    status: "editing",
    potential: null,
    production_ease: null,
    can_be_series: false,
    series_id: null,
    reference_text: null,
    reference_url: null,
    audience_intent: null,
    planned_at: null,
    production_due_at: null,
    scheduled_at: null,
    published_at: null,
    published_url: null,
    campaign_id: null,
    product_id: null,
    source_content_id: null,
    recording_notes: null,
    editing_notes: null,
    cover_notes: null,
    notes: null,
    tags: [],
    hook_variations: [],
    script_structure: [],
    on_screen_text: null,
    shot_list: [],
    estimated_duration_seconds: null,
    script_checklist: {},
    raw_file_url: null,
    edited_file_url: null,
    editor_name: null,
    edit_visual_references: [],
    edit_cuts_notes: null,
    edit_on_screen_text_notes: null,
    edit_captions_notes: null,
    edit_audio_notes: null,
    recording_checklist: {},
    edit_checklist: {},
    hashtags: [],
    cover_image_url: null,
    scheduling_checklist: {},
    created_at: "2026-06-01T12:00:00.000Z",
    updated_at: "2026-06-01T12:00:00.000Z",
    archived_at: null,
    ...overrides,
  };
}

function metricSnap(overrides: Partial<MetricSnapshot> = {}): MetricSnapshot {
  return {
    id: "msnap-1",
    content_item_id: "item-1",
    user_id: "user-1",
    window_type: "30d",
    window_start: null,
    window_end: null,
    captured_at: "2026-09-02T12:00:00.000Z",
    views: null,
    reach: null,
    impressions: null,
    likes: null,
    comments: null,
    shares: null,
    saves: null,
    replies: null,
    profile_visits: null,
    followers_gained: null,
    link_clicks: null,
    leads: null,
    sales: null,
    revenue: null,
    average_watch_time_seconds: null,
    video_duration_seconds: null,
    three_second_views: null,
    completed_views: null,
    retention_rate: null,
    story_exits: null,
    taps_forward: null,
    taps_back: null,
    created_at: "2026-09-02T12:00:00.000Z",
    ...overrides,
  };
}

function campaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: "camp-1",
    user_id: "user-1",
    name: "Lançamento de setembro",
    description: null,
    brand_name: null,
    contact_name: null,
    contact_email: null,
    contact_phone: null,
    contact_notes: null,
    first_contact_date: null,
    campaign_type: "paid_post",
    account_id: null,
    delivery_due_date: "2026-09-05",
    published_at: null,
    contracted_fee: null,
    currency: "BRL",
    negotiation_status: "approved",
    contract_status: "signed",
    delivery_status: "in_production",
    payment_status: "awaiting_payment",
    expected_payment_date: null,
    briefing_url: null,
    contract_url: null,
    folder_url: null,
    publication_url: null,
    responsible_name: null,
    notes: null,
    starts_at: "2026-08-01",
    ends_at: "2026-09-05",
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
    archived_at: null,
    ...overrides,
  };
}

function campaignPayment(overrides: Partial<CampaignPayment> = {}): CampaignPayment {
  return { id:"pay-1",user_id:"user-1",campaign_id:"camp-1",amount:1000,received_amount:null,due_date:"2026-09-01",received_at:null,status:"awaiting_payment",notes:null,created_at:"2026-08-01T00:00:00Z",updated_at:"2026-08-01T00:00:00Z",...overrides };
}

function goalComputed(overrides: Partial<GoalComputed> = {}): GoalComputed {
  return {
    goal: {
      id: "goal-1",
      user_id: "user-1",
      period_type: "weekly",
      period_start: "2026-09-01",
      period_end: "2026-09-07",
      metric: "conteudos_publicados",
      target_value: 10,
      initial_value: null,
      achieved_value: null,
      notes: null,
      created_at: "2026-09-01T00:00:00.000Z",
      updated_at: "2026-09-01T00:00:00.000Z",
    },
    currentValue: 1,
    effectiveInitialValue: null,
    missing: 9,
    progressPercent: 10,
    elapsedPercent: 80,
    daysRemaining: 3,
    status: "at_risk",
    ...overrides,
  };
}

function emptySources(overrides: Partial<AlertSources> = {}): AlertSources {
  return {
    activeItems: [],
    statusHistory: [],
    publishedItems: [],
    metricSnapshotsByItemId: new Map(),
    knownPillars: [],
    computedGoals: [],
    campaigns: [],
    now: NOW,
    ...overrides,
  };
}

describe("computeAlerts", () => {
  it("sem nenhum dado problemático, não gera nenhum alerta", () => {
    expect(computeAlerts(emptySources())).toEqual([]);
  });

  it("conteúdo atrasado: production_due_at OU scheduled_at vencido, exceto em status terminal", () => {
    const overdueByDue = item({ id: "a", status: "editing", production_due_at: "2026-09-01T12:00:00.000Z" });
    const overdueByScheduled = item({ id: "b", status: "scripting", scheduled_at: "2026-09-01T12:00:00.000Z" });
    const notOverdue = item({ id: "c", status: "editing", production_due_at: "2026-09-10T12:00:00.000Z" });
    const publishedIgnored = item({ id: "d", status: "published", production_due_at: "2026-01-01T12:00:00.000Z" });

    const alerts = computeAlerts(emptySources({ activeItems: [overdueByDue, overdueByScheduled, notOverdue, publishedIgnored] }));
    const overdueAlerts = alerts.filter((a) => a.type === "overdue");
    expect(overdueAlerts.map((a) => a.key).sort()).toEqual(["overdue:a", "overdue:b"]);
    expect(overdueAlerts[0].href).toBe("/edicao/a");
  });

  it("publicado sem URL: só conteúdos publicados sem published_url", () => {
    const missing = item({ id: "a", status: "published", published_at: "2026-09-01T12:00:00.000Z", published_url: null });
    const hasUrl = item({ id: "b", status: "published", published_url: "https://instagram.com/p/xyz" });

    const alerts = computeAlerts(emptySources({ publishedItems: [missing, hasUrl] }));
    expect(alerts.filter((a) => a.type === "missing_url").map((a) => a.key)).toEqual(["missing_url:a"]);
  });

  it("métrica pendente: um alerta por janela (24h/7d/30d) vencida, não um agregado por conteúdo", () => {
    // Publicado há mais de 30 dias, sem NENHUMA leitura -> 24h, 7d e 30d vencidas.
    const longAgo = item({ id: "a", status: "published", published_at: "2026-07-01T12:00:00.000Z" });
    const alerts = computeAlerts(emptySources({ publishedItems: [longAgo] }));
    const pending = alerts.filter((a) => a.type === "metrics_pending");
    expect(pending.map((a) => a.key).sort()).toEqual(["metrics_pending:a:24h", "metrics_pending:a:30d", "metrics_pending:a:7d"]);
  });

  it("métrica pendente: janela já capturada não gera alerta para ela", () => {
    const recent = item({ id: "a", status: "published", published_at: "2026-09-03T12:00:00.000Z" });
    const snapshotsByItemId = new Map<string, MetricSnapshot[]>([
      ["a", [metricSnap({ content_item_id: "a", window_type: "24h", captured_at: "2026-09-04T12:30:00.000Z" })]],
    ]);
    const alerts = computeAlerts(emptySources({ publishedItems: [recent], metricSnapshotsByItemId: snapshotsByItemId }));
    expect(alerts.some((a) => a.key === "metrics_pending:a:24h")).toBe(false);
  });

  it("ideia parada há mais de 45 dias, só para status idea/researching", () => {
    const stalled = item({ id: "a", status: "idea", created_at: "2026-06-01T12:00:00.000Z" });
    const notStalled = item({ id: "b", status: "researching", created_at: "2026-08-25T12:00:00.000Z" });
    const publishedOld = item({ id: "c", status: "published", created_at: "2026-01-01T12:00:00.000Z" });

    const alerts = computeAlerts(emptySources({ activeItems: [stalled, notStalled, publishedOld] }));
    const stalledAlerts = alerts.filter((a) => a.type === "stalled_idea");
    expect(stalledAlerts.map((a) => a.key)).toEqual(["stalled_idea:a"]);
  });

  it("pilar com menos de 3 ideias disponíveis, incluindo pilares cadastrados com 0 ideias", () => {
    const items = [
      item({ id: "a", status: "idea", pillar: "educativo" }),
      item({ id: "b", status: "idea", pillar: "educativo" }),
      item({ id: "c", status: "idea", pillar: "vendas" }),
      item({ id: "d", status: "idea", pillar: "vendas" }),
      item({ id: "e", status: "idea", pillar: "vendas" }),
    ];
    const alerts = computeAlerts(emptySources({ activeItems: items, knownPillars: ["educativo", "vendas", "bastidores"] }));
    const pillarAlerts = alerts.filter((a) => a.type === "pillar_understocked");
    expect(pillarAlerts.map((a) => a.key).sort()).toEqual(["pillar_understocked:bastidores", "pillar_understocked:educativo"]);
    expect(pillarAlerts.find((a) => a.key === "pillar_understocked:bastidores")?.description).toContain("Nenhuma ideia");
  });

  it("meta em risco: só metas com status at_risk viram alerta", () => {
    const atRisk = goalComputed({ goal: { ...goalComputed().goal, id: "g1" }, status: "at_risk" });
    const onPace = goalComputed({ goal: { ...goalComputed().goal, id: "g2" }, status: "on_pace" });
    const alerts = computeAlerts(emptySources({ computedGoals: [atRisk, onPace] }));
    expect(alerts.map((a) => a.key)).toEqual(["goal_at_risk:g1"]);
  });

  it("campanha vencendo: dentro da janela de aviso, não cancelada/concluída, sem contar vencidas", () => {
    const soon = campaign({ id: "c1", delivery_due_date: "2026-09-05" }); // ~1 dia depois de NOW.
    const tooFar = campaign({ id: "c2", delivery_due_date: "2026-10-01" });
    const alreadyEnded = campaign({ id: "c3", delivery_due_date: "2026-08-01" });
    const canceled = campaign({ id: "c4", delivery_due_date: "2026-09-05", negotiation_status: "declined" });

    const alerts = computeAlerts(emptySources({ campaigns: [soon, tooFar, alreadyEnded, canceled] }));
    expect(alerts.map((a) => a.key)).toEqual([
      "campaign_delivery_overdue:c3",
      "deadline_approaching:campaign:c1",
    ]);
  });

  it("prazo de produção vencendo (entrega): dentro da janela de aviso, mas ainda não atrasado", () => {
    const dueSoon = item({ id: "a", status: "editing", production_due_at: "2026-09-06T12:00:00.000Z" });
    const alreadyOverdue = item({ id: "b", status: "editing", production_due_at: "2026-09-01T12:00:00.000Z" });
    const alerts = computeAlerts(emptySources({ activeItems: [dueSoon, alreadyOverdue] }));
    // "b" já é "overdue", não "deadline_approaching" -- os dois não se sobrepõem para o mesmo item.
    expect(alerts.filter((a) => a.type === "deadline_approaching").map((a) => a.key)).toEqual(["deadline_approaching:content:a"]);
    expect(alerts.filter((a) => a.type === "overdue").map((a) => a.key)).toEqual(["overdue:b"]);
  });

  it("ALERT_TYPE_LABELS tem uma entrada para cada tipo, incluindo os 3 alertas financeiros", () => {
    expect(Object.keys(ALERT_TYPE_LABELS)).toHaveLength(10);
  });

  it("gera alertas para pagamento vencido e campanha publicada sem conteúdo", () => {
    const publishedCampaign = campaign({ delivery_status: "published", delivery_due_date: null });
    const alerts = computeAlerts(emptySources({ campaigns: [publishedCampaign], campaignPayments: [campaignPayment()] }));
    expect(alerts.map((alert) => alert.type)).toEqual(expect.arrayContaining(["campaign_payment_overdue", "campaign_missing_content"]));
  });
});

describe("filterActiveAlerts", () => {
  it("sem dispensas, todos os alertas ficam visíveis", () => {
    const alerts = computeAlerts(emptySources({ activeItems: [item({ id: "a", status: "editing", production_due_at: "2026-09-01T12:00:00.000Z" })] }));
    expect(filterActiveAlerts(alerts, [], NOW)).toHaveLength(1);
  });

  it("dispensado (dismissed=true) some e nunca mais reaparece enquanto a mesma chave existir", () => {
    const overdueItem = item({ id: "a", status: "editing", production_due_at: "2026-09-01T12:00:00.000Z" });
    const alerts = computeAlerts(emptySources({ activeItems: [overdueItem] }));
    const dismissals: AlertDismissalState[] = [{ alert_key: "overdue:a", dismissed: true, snoozed_until: null }];
    expect(filterActiveAlerts(alerts, dismissals, NOW)).toEqual([]);
    // Mesmo bem depois, continua dispensado (não é "infinito" porque é a MESMA ocorrência).
    expect(filterActiveAlerts(alerts, dismissals, new Date("2026-12-01T12:00:00.000Z"))).toEqual([]);
  });

  it("adiado (snoozed_until no futuro) some até a data, depois volta a aparecer normalmente", () => {
    const overdueItem = item({ id: "a", status: "editing", production_due_at: "2026-09-01T12:00:00.000Z" });
    const alerts = computeAlerts(emptySources({ activeItems: [overdueItem] }));
    const dismissals: AlertDismissalState[] = [{ alert_key: "overdue:a", dismissed: false, snoozed_until: "2026-09-10T00:00:00.000Z" }];

    expect(filterActiveAlerts(alerts, dismissals, NOW)).toEqual([]);
    expect(filterActiveAlerts(alerts, dismissals, new Date("2026-09-11T00:00:00.000Z"))).toHaveLength(1);
  });

  it("dispensar uma janela de métrica pendente não afeta outra janela do mesmo conteúdo", () => {
    const longAgo = item({ id: "a", status: "published", published_at: "2026-07-01T12:00:00.000Z" });
    const alerts = computeAlerts(emptySources({ publishedItems: [longAgo] }));
    const dismissals: AlertDismissalState[] = [{ alert_key: "metrics_pending:a:24h", dismissed: true, snoozed_until: null }];
    const active = filterActiveAlerts(alerts, dismissals, NOW);
    expect(active.some((a) => a.key === "metrics_pending:a:24h")).toBe(false);
    expect(active.some((a) => a.key === "metrics_pending:a:7d")).toBe(true);
    expect(active.some((a) => a.key === "metrics_pending:a:30d")).toBe(true);
  });
});
