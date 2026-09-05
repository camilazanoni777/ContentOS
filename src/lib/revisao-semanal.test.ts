import { describe, expect, it } from "vitest";

import {
  buildAutoSummary,
  compareWeeks,
  computeWeekHighlights,
  computeWeekStats,
  WEEKDAY_LABELS,
  type WeekWindowSources,
} from "./revisao-semanal";
import type { PerformanceIndexResult } from "./metricas";
import type { ContentItem, MetricSnapshot, ProfileSnapshot } from "@/types/domain";

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

function profileSnap(overrides: Partial<ProfileSnapshot> = {}): ProfileSnapshot {
  return {
    id: "psnap-1",
    account_id: "acc-1",
    user_id: "user-1",
    snapshot_date: "2026-09-01",
    followers: null,
    following: null,
    posts_count: null,
    profile_visits: null,
    reach: null,
    impressions: null,
    website_clicks: null,
    views: null,
    accounts_engaged: null,
    interactions: null,
    messages: null,
    leads: null,
    sales: null,
    revenue: null,
    stories_count: null,
    hours_invested: null,
    notes: null,
    created_at: "2026-09-01T12:00:00.000Z",
    ...overrides,
  };
}

function emptySources(overrides: Partial<WeekWindowSources> = {}): WeekWindowSources {
  return {
    plannedItems: [],
    publishedItems: [],
    metricSnapshotsByItemId: new Map(),
    profileSnapshots: [],
    followersBeforeWeek: null,
    followersEndOfWeek: null,
    ...overrides,
  };
}

function okIndex(index: number): PerformanceIndexResult {
  return { state: "ok", index, tier: null, breakdown: [] };
}

describe("computeWeekStats", () => {
  it("com nenhum dado, tudo fica null (nunca 0 fabricado) exceto os contadores", () => {
    const stats = computeWeekStats(emptySources());
    expect(stats.plannedCount).toBe(0);
    expect(stats.publishedCount).toBe(0);
    expect(stats.executionPercent).toBeNull();
    expect(stats.views).toBeNull();
    expect(stats.reach).toBeNull();
    expect(stats.totalEngagement).toBeNull();
    expect(stats.engagementRate).toBeNull();
    expect(stats.followersGained).toBeNull();
    expect(stats.revenue).toBeNull();
    expect(stats.hoursInvested).toBeNull();
    expect(stats.resultPerHour).toBeNull();
  });

  it("soma métricas dos conteúdos publicados a partir da leitura mais recente de cada um", () => {
    const itemA = item({ id: "a" });
    const itemB = item({ id: "b" });
    const snapshotsByItemId = new Map<string, MetricSnapshot[]>([
      [
        "a",
        [
          metricSnap({ id: "a-old", content_item_id: "a", captured_at: "2026-09-01T00:00:00.000Z", views: 100, reach: 80, likes: 5 }),
          metricSnap({ id: "a-new", content_item_id: "a", captured_at: "2026-09-03T00:00:00.000Z", views: 200, reach: 150, likes: 10, comments: 2, shares: 3, saves: 4 }),
        ],
      ],
      ["b", [metricSnap({ id: "b-1", content_item_id: "b", captured_at: "2026-09-02T00:00:00.000Z", views: 50, reach: 40, likes: 1, comments: 1 })]],
    ]);

    const stats = computeWeekStats(
      emptySources({
        plannedItems: [itemA, itemB, item({ id: "c" })],
        publishedItems: [itemA, itemB],
        metricSnapshotsByItemId: snapshotsByItemId,
      }),
    );

    // Usa a leitura MAIS RECENTE de "a" (views: 200), não a antiga (100).
    expect(stats.views).toBe(250);
    expect(stats.reach).toBe(190);
    expect(stats.totalEngagement).toBe(10 + 2 + 3 + 4 + 1 + 1); // likes+comments+shares+saves de a(nova) + b
    expect(stats.engagementRate).toBeCloseTo((21 / 190) * 100, 5);
    expect(stats.plannedCount).toBe(3);
    expect(stats.publishedCount).toBe(2);
    expect(stats.executionPercent).toBe(67); // round(2/3 * 100)
  });

  it("ganho de seguidores é a diferença entre fim e início da semana, só quando ambos existem", () => {
    expect(computeWeekStats(emptySources({ followersBeforeWeek: 1000, followersEndOfWeek: 1050 })).followersGained).toBe(50);
    expect(computeWeekStats(emptySources({ followersBeforeWeek: 1000, followersEndOfWeek: null })).followersGained).toBeNull();
    expect(computeWeekStats(emptySources({ followersBeforeWeek: null, followersEndOfWeek: 1050 })).followersGained).toBeNull();
  });

  it("receita e horas vêm dos profile_snapshots da semana; resultado por hora só com horas > 0", () => {
    const stats = computeWeekStats(
      emptySources({
        profileSnapshots: [
          profileSnap({ id: "p1", revenue: 1000, hours_invested: 5, profile_visits: 20, website_clicks: 3, leads: 1, sales: 2 }),
          profileSnap({ id: "p2", revenue: 500, hours_invested: 5 }),
        ],
      }),
    );
    expect(stats.revenue).toBe(1500);
    expect(stats.hoursInvested).toBe(10);
    expect(stats.resultPerHour).toBe(150);
    expect(stats.profileVisits).toBe(20);
    expect(stats.websiteClicks).toBe(3);
    expect(stats.leads).toBe(1);
    expect(stats.sales).toBe(2);

    const noHours = computeWeekStats(emptySources({ profileSnapshots: [profileSnap({ id: "p3", revenue: 100, hours_invested: 0 })] }));
    expect(noHours.resultPerHour).toBeNull();
  });
});

describe("compareWeeks", () => {
  it("delta é null quando qualquer um dos lados é null, e current - previous quando os dois existem", () => {
    const current = emptySources({
      publishedItems: [item({ id: "a" })],
      metricSnapshotsByItemId: new Map([["a", [metricSnap({ content_item_id: "a", views: 300, reach: 100 })]]]),
    });
    const previous = emptySources({
      publishedItems: [item({ id: "b" })],
      metricSnapshotsByItemId: new Map([["b", [metricSnap({ content_item_id: "b", views: 100, reach: 100 })]]]),
    });

    const comparison = compareWeeks(current, previous);
    expect(comparison.deltas.views).toBe(200);
    expect(comparison.deltas.reach).toBe(0);
    // Sem dado de seguidores em nenhuma das semanas -> delta null, não 0.
    expect(comparison.deltas.followersGained).toBeNull();
    expect(comparison.current.views).toBe(300);
    expect(comparison.previous.views).toBe(100);
  });
});

describe("computeWeekHighlights", () => {
  it("sem conteúdos publicados, tudo fica null/vazio", () => {
    const highlights = computeWeekHighlights([], new Map(), new Map());
    expect(highlights.bestContent).toBeNull();
    expect(highlights.mostViews).toBeNull();
    expect(highlights.bestFormat).toBeNull();
    expect(highlights.bestWeekday).toBeNull();
    expect(highlights.bestHour).toBeNull();
    expect(highlights.formatWithMostFollowers).toBeNull();
    expect(highlights.belowAverageContent).toEqual([]);
  });

  it("encontra os campeões por valor bruto (mais views/compartilhamentos/salvamentos/seguidores/receita)", () => {
    const itemA = item({ id: "a", title: "Vídeo A" });
    const itemB = item({ id: "b", title: "Vídeo B" });
    const snapshotsByItemId = new Map<string, MetricSnapshot[]>([
      ["a", [metricSnap({ content_item_id: "a", views: 1000, shares: 5, saves: 2, followers_gained: 3, revenue: 10 })]],
      ["b", [metricSnap({ content_item_id: "b", views: 500, shares: 20, saves: 30, followers_gained: 40, revenue: 999 })]],
    ]);

    const highlights = computeWeekHighlights([itemA, itemB], new Map(), snapshotsByItemId);
    expect(highlights.mostViews?.item.id).toBe("a");
    expect(highlights.mostShares?.item.id).toBe("b");
    expect(highlights.mostSaves?.item.id).toBe("b");
    expect(highlights.mostFollowersGained?.item.id).toBe("b");
    expect(highlights.mostRevenue?.item.id).toBe("b");
  });

  it("melhor conteúdo/formato/pilar/dia/horário usam o índice de performance externo (base histórica), não valor bruto", () => {
    // Publicado numa quinta (weekday 4) às 12h local (15:00 UTC), formato reel/pilar educativo.
    const itemA = item({ id: "a", format: "reel", pillar: "educativo", published_at: "2026-09-03T15:00:00.000Z" });
    // Publicado numa sexta (weekday 5) às 20h local (23:00 UTC), formato carrossel/pilar bastidores.
    const itemB = item({ id: "b", format: "carrossel", pillar: "bastidores", published_at: "2026-09-04T23:00:00.000Z" });

    const indexByItemId = new Map<string, PerformanceIndexResult>([
      ["a", okIndex(90)],
      ["b", okIndex(30)],
    ]);

    const highlights = computeWeekHighlights([itemA, itemB], indexByItemId, new Map());
    expect(highlights.bestContent?.item.id).toBe("a");
    expect(highlights.bestFormat?.key).toBe("reel");
    expect(highlights.bestPillar?.key).toBe("educativo");
    expect(highlights.bestWeekday).toEqual({ key: "4", averageIndex: 90, sampleSize: 1, weekday: 4 });
    expect(highlights.bestHour).toEqual({ key: "12", averageIndex: 90, sampleSize: 1, hour: 12 });
    // b fica abaixo da média (90+30)/2=60 -> só b(30) < 60.
    expect(highlights.belowAverageContent.map((i) => i.id)).toEqual(["b"]);
  });

  it("formato que trouxe mais seguidores soma followers_gained por formato (bruto, não índice)", () => {
    const itemA = item({ id: "a", format: "reel" });
    const itemB = item({ id: "b", format: "reel" });
    const itemC = item({ id: "c", format: "carrossel" });
    const snapshotsByItemId = new Map<string, MetricSnapshot[]>([
      ["a", [metricSnap({ content_item_id: "a", followers_gained: 10 })]],
      ["b", [metricSnap({ content_item_id: "b", followers_gained: 15 })]],
      ["c", [metricSnap({ content_item_id: "c", followers_gained: 100 })]],
    ]);
    const highlights = computeWeekHighlights([itemA, itemB, itemC], new Map(), snapshotsByItemId);
    expect(highlights.formatWithMostFollowers).toEqual({ format: "carrossel", totalFollowersGained: 100 });
  });

  it("WEEKDAY_LABELS tem 7 posições, domingo primeiro (mesma convenção de getWeekdayLocal)", () => {
    expect(WEEKDAY_LABELS).toHaveLength(7);
    expect(WEEKDAY_LABELS[0]).toBe("domingo");
    expect(WEEKDAY_LABELS[4]).toBe("quinta");
  });
});

describe("buildAutoSummary", () => {
  it("sem nenhum dado calculável, devolve a frase neutra (nunca fabrica número)", () => {
    const comparison = compareWeeks(emptySources(), emptySources());
    const highlights = computeWeekHighlights([], new Map(), new Map());
    expect(buildAutoSummary(comparison, highlights)).toBe("Ainda não há dados suficientes desta semana para um resumo automático.");
  });

  it("monta a frase só com os trechos calculáveis, sempre terminando com ponto final", () => {
    const currentSources = emptySources({
      plannedItems: [item({ id: "p1" }), item({ id: "p2" })],
      publishedItems: [item({ id: "a", title: "Reel campeão" })],
      metricSnapshotsByItemId: new Map([["a", [metricSnap({ content_item_id: "a", views: 12345 })]]]),
      followersBeforeWeek: 1000,
      followersEndOfWeek: 1100,
    });
    const previousSources = emptySources({ followersBeforeWeek: 1000, followersEndOfWeek: 1050 });
    const comparison = compareWeeks(currentSources, previousSources);
    const highlights = computeWeekHighlights(
      currentSources.publishedItems,
      new Map([["a", okIndex(80)]]),
      currentSources.metricSnapshotsByItemId,
    );

    const summary = buildAutoSummary(comparison, highlights);
    expect(summary).toContain("publicou 1 de 2 conteúdos planejados");
    expect(summary).toContain("50% de execução");
    expect(summary).toContain("ganhou 100 seguidores");
    expect(summary).toContain("crescendo em relação à semana passada");
    expect(summary).toContain("Reel campeão");
    expect(summary.endsWith(".")).toBe(true);
    expect(summary.charAt(0)).toBe(summary.charAt(0).toUpperCase());
  });

  it("sinaliza queda em relação à semana passada quando o ganho de seguidores foi menor", () => {
    const currentSources = emptySources({ followersBeforeWeek: 1000, followersEndOfWeek: 1020 });
    const previousSources = emptySources({ followersBeforeWeek: 1000, followersEndOfWeek: 1100 });
    const comparison = compareWeeks(currentSources, previousSources);
    const highlights = computeWeekHighlights([], new Map(), new Map());
    expect(buildAutoSummary(comparison, highlights)).toContain("menos que a semana passada");
  });
});
