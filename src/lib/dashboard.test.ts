import { describe, expect, it } from "vitest";

import {
  buildDailyReachViewsSeries,
  buildFollowersSeries,
  buildPlannedVsPublishedSeries,
  computeGroupPerformance,
  EMPTY_DASHBOARD_FILTERS,
  filterDashboardItems,
  selectGoalsOverlappingPeriod,
  topContentByFollowersGained,
  totalFollowersAsOf,
  type DashboardFilters,
} from "./dashboard";
import type { PerformanceIndexResult } from "./metricas";
import type { ContentItem, Goal, MetricSnapshot } from "@/types/domain";

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
    status: "published",
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
    published_at: "2026-09-01T12:00:00.000Z",
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
    created_at: "2026-09-01T12:00:00.000Z",
    updated_at: "2026-09-01T12:00:00.000Z",
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

function okIndex(index: number): PerformanceIndexResult {
  return { state: "ok", index, tier: null, breakdown: [] };
}

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
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
    ...overrides,
  };
}

describe("filterDashboardItems", () => {
  it("sem filtros (EMPTY_DASHBOARD_FILTERS), devolve tudo", () => {
    const items = [item({ id: "a" }), item({ id: "b", format: "carrossel" })];
    expect(filterDashboardItems(items, EMPTY_DASHBOARD_FILTERS)).toHaveLength(2);
  });

  it("aplica cada filtro de forma independente (AND entre campos preenchidos)", () => {
    const items = [
      item({ id: "a", format: "reel", pillar: "educativo", objective: "alcance", campaign_id: "camp-1", cta: "seguir", product_id: "prod-1" }),
      item({ id: "b", format: "carrossel", pillar: "educativo", objective: "alcance", campaign_id: "camp-1", cta: "seguir", product_id: "prod-1" }),
    ];
    const filters: DashboardFilters = { ...EMPTY_DASHBOARD_FILTERS, format: "reel" };
    expect(filterDashboardItems(items, filters).map((i) => i.id)).toEqual(["a"]);
  });

  it("combina múltiplos filtros ao mesmo tempo", () => {
    const items = [
      item({ id: "a", pillar: "educativo", cta: "comprar" }),
      item({ id: "b", pillar: "educativo", cta: "seguir" }),
      item({ id: "c", pillar: "vendas", cta: "comprar" }),
    ];
    const filters: DashboardFilters = { ...EMPTY_DASHBOARD_FILTERS, pillar: "educativo", cta: "comprar" };
    expect(filterDashboardItems(items, filters).map((i) => i.id)).toEqual(["a"]);
  });
});

describe("buildDailyReachViewsSeries", () => {
  it("um ponto por dia do período, null (não 0) quando nada foi publicado naquele dia", () => {
    const itemA = item({ id: "a", published_at: "2026-09-02T12:00:00.000Z" });
    const snapshotsByItemId = new Map<string, MetricSnapshot[]>([["a", [metricSnap({ content_item_id: "a", views: 100, reach: 80 })]]]);
    const series = buildDailyReachViewsSeries([itemA], snapshotsByItemId, "2026-09-01", "2026-09-03");

    expect(series).toEqual([
      { date: "2026-09-01", views: null, reach: null },
      { date: "2026-09-02", views: 100, reach: 80 },
      { date: "2026-09-03", views: null, reach: null },
    ]);
  });

  it("soma múltiplos conteúdos publicados no mesmo dia", () => {
    const itemA = item({ id: "a", published_at: "2026-09-01T10:00:00.000Z" });
    const itemB = item({ id: "b", published_at: "2026-09-01T18:00:00.000Z" });
    const snapshotsByItemId = new Map<string, MetricSnapshot[]>([
      ["a", [metricSnap({ content_item_id: "a", views: 100, reach: 80 })]],
      ["b", [metricSnap({ content_item_id: "b", views: 50, reach: null })]],
    ]);
    const series = buildDailyReachViewsSeries([itemA, itemB], snapshotsByItemId, "2026-09-01", "2026-09-01");
    // reach só tem valor de "a" -> soma só o disponível (80), não trata "b" como 0.
    expect(series).toEqual([{ date: "2026-09-01", views: 150, reach: 80 }]);
  });
});

describe("buildPlannedVsPublishedSeries", () => {
  it("conta por dia (nunca null — ausência é 0 conteúdo)", () => {
    const planned = [item({ id: "p1", scheduled_at: "2026-09-01T10:00:00.000Z" }), item({ id: "p2", scheduled_at: "2026-09-01T15:00:00.000Z" })];
    const published = [item({ id: "a", published_at: "2026-09-02T10:00:00.000Z" })];
    const series = buildPlannedVsPublishedSeries(planned, published, "2026-09-01", "2026-09-02");
    expect(series).toEqual([
      { date: "2026-09-01", planned: 2, published: 0 },
      { date: "2026-09-02", planned: 0, published: 1 },
    ]);
  });
});

describe("buildFollowersSeries", () => {
  it("soma seguidores de todas as contas por dia; dia sem leitura fica null", () => {
    const series = buildFollowersSeries(
      [
        { snapshot_date: "2026-09-01", followers: 1000 },
        { snapshot_date: "2026-09-01", followers: 500 },
      ],
      "2026-09-01",
      "2026-09-02",
    );
    expect(series).toEqual([
      { date: "2026-09-01", followers: 1500 },
      { date: "2026-09-02", followers: null },
    ]);
  });
});

describe("computeGroupPerformance", () => {
  it("índice médio por grupo, ordenado do melhor para o pior, ignorando conteúdos sem índice calculável", () => {
    const itemA = item({ id: "a", format: "reel" });
    const itemB = item({ id: "b", format: "reel" });
    const itemC = item({ id: "c", format: "carrossel" });
    const itemD = item({ id: "d", format: "carrossel" }); // sem índice -> ignorado.
    const indexByItemId = new Map<string, PerformanceIndexResult>([
      ["a", okIndex(100)],
      ["b", okIndex(80)],
      ["c", okIndex(200)],
    ]);
    const result = computeGroupPerformance([itemA, itemB, itemC, itemD], indexByItemId, (i) => i.format);
    expect(result).toEqual([
      { key: "carrossel", averageIndex: 200, sampleSize: 1 },
      { key: "reel", averageIndex: 90, sampleSize: 2 },
    ]);
  });

  it("sem nenhum conteúdo com índice calculável, devolve lista vazia", () => {
    expect(computeGroupPerformance([item({ id: "a" })], new Map(), (i) => i.format)).toEqual([]);
  });
});

describe("topContentByFollowersGained", () => {
  it("top N por seguidores ganhos (bruto), ordenado do maior para o menor", () => {
    const itemA = item({ id: "a" });
    const itemB = item({ id: "b" });
    const itemC = item({ id: "c" }); // sem followers_gained -> fora do ranking.
    const snapshotsByItemId = new Map<string, MetricSnapshot[]>([
      ["a", [metricSnap({ content_item_id: "a", followers_gained: 10 })]],
      ["b", [metricSnap({ content_item_id: "b", followers_gained: 50 })]],
    ]);
    const top = topContentByFollowersGained([itemA, itemB, itemC], snapshotsByItemId, 1);
    expect(top).toEqual([{ item: itemB, followersGained: 50 }]);
  });
});

describe("selectGoalsOverlappingPeriod", () => {
  it("mantém só metas cujo período se sobrepõe ao período selecionado", () => {
    const overlapping = goal({ id: "g1", period_start: "2026-09-01", period_end: "2026-09-07" });
    const before = goal({ id: "g2", period_start: "2026-08-01", period_end: "2026-08-07" });
    const after = goal({ id: "g3", period_start: "2026-10-01", period_end: "2026-10-07" });
    const result = selectGoalsOverlappingPeriod([overlapping, before, after], "2026-09-05", "2026-09-20");
    expect(result.map((g) => g.id)).toEqual(["g1"]);
  });
});

describe("totalFollowersAsOf", () => {
  it("soma a leitura mais recente de cada conta até a data (inclusive), ignorando leituras futuras", () => {
    const snapshots = [
      { account_id: "acc-1", snapshot_date: "2026-08-30", followers: 900 },
      { account_id: "acc-1", snapshot_date: "2026-09-01", followers: 1000 },
      { account_id: "acc-1", snapshot_date: "2026-09-10", followers: 2000 }, // futuro -> ignorado.
      { account_id: "acc-2", snapshot_date: "2026-09-02", followers: 500 },
    ];
    expect(totalFollowersAsOf(snapshots, "2026-09-05")).toBe(1500);
  });

  it("sem nenhuma leitura até a data, devolve null (não 0)", () => {
    expect(totalFollowersAsOf([{ account_id: "acc-1", snapshot_date: "2026-09-10", followers: 100 }], "2026-09-01")).toBeNull();
    expect(totalFollowersAsOf([], "2026-09-01")).toBeNull();
  });
});
