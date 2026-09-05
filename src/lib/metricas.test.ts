import { describe, expect, it } from "vitest";

import {
  DEFAULT_OBJECTIVE_WEIGHTS,
  DEFAULT_PERFORMANCE_TIER_THRESHOLDS,
  EMPTY_METRICAS_FILTERS,
  PERFORMANCE_COMPONENT_KEYS,
  averageRetention,
  buildPerformanceBaselines,
  clickToSaleConversion,
  commentRate,
  completionRate,
  computePerformanceIndex,
  computePerformanceIndexForWindow,
  ctr,
  engagementRateByReach,
  engagementRateByViews,
  filterMetricasItems,
  followerConversionRate,
  getPerformanceIndexThresholds,
  getPerformanceTier,
  getSnapshotByWindow,
  likeRate,
  mostRecentSnapshot,
  rankByPerformanceIndex,
  rpmPer1000Views,
  saveRate,
  shareRate,
  sortMetricasItems,
  sumAvailable,
  totalEngagement,
  viewsGrowth24hTo7d,
} from "./metricas";
import type { ContentItem, MetricSnapshot } from "@/types/domain";

function item(overrides: Partial<ContentItem> = {}): ContentItem {
  return {
    id: "item-1",
    user_id: "user-1",
    account_id: null,
    title: "Reel de rotina",
    hook: "Gancho forte",
    summary: null,
    script: null,
    caption: null,
    format: "reel",
    pillar: "Rotina",
    objective: "engajamento",
    cta: null,
    priority: "media",
    status: "published",
    potential: "medio",
    production_ease: "media",
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

function snapshot(overrides: Partial<MetricSnapshot> = {}): MetricSnapshot {
  return {
    id: "snap-1",
    content_item_id: "item-1",
    user_id: "user-1",
    window_type: "24h",
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

// ---------------------------------------------------------------------------
// Helpers null-safe: null vs. zero, divisão por zero
// ---------------------------------------------------------------------------

describe("sumAvailable", () => {
  it("null quando todos os valores são null (nunca vira zero)", () => {
    expect(sumAvailable(null, null, null)).toBeNull();
  });

  it("soma só os valores disponíveis, ignorando os null", () => {
    expect(sumAvailable(10, null, 5, null, 2)).toBe(17);
  });

  it("um único zero real (informado) conta normalmente — zero não é null", () => {
    expect(sumAvailable(0, null, 5)).toBe(5);
    expect(sumAvailable(0, 0)).toBe(0);
  });
});

describe("totalEngagement", () => {
  it("null quando nenhum campo de engajamento foi informado", () => {
    expect(totalEngagement(snapshot())).toBeNull();
  });

  it("soma os campos disponíveis mesmo com alguns ausentes", () => {
    expect(totalEngagement(snapshot({ likes: 100, comments: null, shares: 10, saves: 5, replies: null }))).toBe(115);
  });
});

describe("divisões null-safe (engagementRateByReach e afins)", () => {
  it("denominador ausente (null) produz null, não Infinity/NaN", () => {
    expect(engagementRateByReach(snapshot({ likes: 10, reach: null }))).toBeNull();
  });

  it("denominador zero (informado) produz null, não Infinity", () => {
    expect(engagementRateByReach(snapshot({ likes: 10, reach: 0 }))).toBeNull();
  });

  it("numerador ausente produz null mesmo com denominador presente", () => {
    expect(engagementRateByReach(snapshot({ reach: 1000 }))).toBeNull();
  });

  it("calcula corretamente quando ambos estão presentes", () => {
    // engajamento = 50 (likes) + 10 (comments) = 60; reach = 1000 -> 6%
    expect(engagementRateByReach(snapshot({ likes: 50, comments: 10, reach: 1000 }))).toBeCloseTo(6, 5);
  });

  it("engagementRateByViews usa views, não reach", () => {
    expect(engagementRateByViews(snapshot({ likes: 40, views: 2000 }))).toBeCloseTo(2, 5);
    expect(engagementRateByViews(snapshot({ likes: 40, views: null }))).toBeNull();
  });
});

describe("likeRate/commentRate/shareRate/saveRate — base alcance com fallback para views", () => {
  it("usa alcance quando disponível", () => {
    expect(likeRate(snapshot({ likes: 25, reach: 500, views: 9999 }))).toBeCloseTo(5, 5);
  });

  it("cai para views quando alcance ausente", () => {
    expect(likeRate(snapshot({ likes: 25, reach: null, views: 500 }))).toBeCloseTo(5, 5);
  });

  it("null quando nem alcance nem views estão disponíveis", () => {
    expect(commentRate(snapshot({ comments: 5 }))).toBeNull();
  });

  it("shareRate e saveRate seguem a mesma regra", () => {
    expect(shareRate(snapshot({ shares: 10, reach: 200 }))).toBeCloseTo(5, 5);
    expect(saveRate(snapshot({ saves: 4, reach: 200 }))).toBeCloseTo(2, 5);
  });
});

describe("followerConversionRate", () => {
  it("prioriza visitas ao perfil sobre alcance/views", () => {
    expect(followerConversionRate(snapshot({ followers_gained: 3, profile_visits: 60, reach: 999999 }))).toBeCloseTo(5, 5);
  });

  it("cai para alcance quando não há visitas ao perfil", () => {
    expect(followerConversionRate(snapshot({ followers_gained: 3, profile_visits: null, reach: 60 }))).toBeCloseTo(5, 5);
  });

  it("null sem nenhuma base disponível", () => {
    expect(followerConversionRate(snapshot({ followers_gained: 3 }))).toBeNull();
  });
});

describe("ctr", () => {
  it("prioriza impressões", () => {
    expect(ctr(snapshot({ link_clicks: 20, impressions: 1000, reach: 1 }))).toBeCloseTo(2, 5);
  });

  it("cai para alcance e depois views", () => {
    expect(ctr(snapshot({ link_clicks: 20, impressions: null, reach: 1000 }))).toBeCloseTo(2, 5);
    expect(ctr(snapshot({ link_clicks: 20, impressions: null, reach: null, views: 1000 }))).toBeCloseTo(2, 5);
  });
});

describe("clickToSaleConversion", () => {
  it("null quando não há cliques (não divide por zero)", () => {
    expect(clickToSaleConversion(snapshot({ sales: 2, link_clicks: 0 }))).toBeNull();
  });

  it("calcula normalmente com cliques > 0", () => {
    expect(clickToSaleConversion(snapshot({ sales: 5, link_clicks: 100 }))).toBeCloseTo(5, 5);
  });
});

describe("rpmPer1000Views", () => {
  it("null sem views", () => {
    expect(rpmPer1000Views(snapshot({ revenue: 100 }))).toBeNull();
  });

  it("calcula receita a cada 1.000 views", () => {
    expect(rpmPer1000Views(snapshot({ revenue: 50, views: 10000 }))).toBeCloseTo(5, 5);
  });
});

describe("completionRate", () => {
  it("null sem views totais", () => {
    expect(completionRate(snapshot({ completed_views: 10 }))).toBeNull();
  });

  it("calcula normalmente", () => {
    expect(completionRate(snapshot({ completed_views: 30, views: 100 }))).toBeCloseTo(30, 5);
  });
});

describe("averageRetention", () => {
  it("null quando nenhuma leitura tem retenção informada", () => {
    expect(averageRetention([snapshot({ retention_rate: null }), snapshot({ retention_rate: null })])).toBeNull();
  });

  it("média só das leituras com retenção informada — as demais não viram zero", () => {
    expect(
      averageRetention([snapshot({ retention_rate: 40 }), snapshot({ retention_rate: null }), snapshot({ retention_rate: 60 })]),
    ).toBeCloseTo(50, 5);
  });
});

describe("viewsGrowth24hTo7d", () => {
  it("null quando falta uma das duas leituras", () => {
    expect(viewsGrowth24hTo7d(null, snapshot({ views: 100 }))).toBeNull();
    expect(viewsGrowth24hTo7d(snapshot({ views: 100 }), undefined)).toBeNull();
  });

  it("null quando views de 24h é zero (divisão por zero)", () => {
    expect(viewsGrowth24hTo7d(snapshot({ views: 0 }), snapshot({ views: 500 }))).toBeNull();
  });

  it("null quando falta o campo views em alguma das duas", () => {
    expect(viewsGrowth24hTo7d(snapshot({ views: null }), snapshot({ views: 500 }))).toBeNull();
  });

  it("calcula o crescimento percentual corretamente", () => {
    expect(viewsGrowth24hTo7d(snapshot({ views: 1000 }), snapshot({ views: 1500 }))).toBeCloseTo(50, 5);
  });

  it("suporta queda (crescimento negativo)", () => {
    expect(viewsGrowth24hTo7d(snapshot({ views: 1000 }), snapshot({ views: 800 }))).toBeCloseTo(-20, 5);
  });
});

describe("mostRecentSnapshot / getSnapshotByWindow", () => {
  it("null com lista vazia", () => {
    expect(mostRecentSnapshot([])).toBeNull();
  });

  it("retorna a leitura com captured_at mais recente", () => {
    const older = snapshot({ id: "a", captured_at: "2026-09-01T00:00:00.000Z" });
    const newer = snapshot({ id: "b", captured_at: "2026-09-05T00:00:00.000Z" });
    expect(mostRecentSnapshot([older, newer])?.id).toBe("b");
  });

  it("getSnapshotByWindow encontra a janela certa e null quando ausente", () => {
    const s24h = snapshot({ id: "a", window_type: "24h" });
    const s7d = snapshot({ id: "b", window_type: "7d" });
    expect(getSnapshotByWindow([s24h, s7d], "7d")?.id).toBe("b");
    expect(getSnapshotByWindow([s24h], "30d")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Índice de performance
// ---------------------------------------------------------------------------

describe("DEFAULT_OBJECTIVE_WEIGHTS", () => {
  it("cada perfil de pesos soma exatamente 1.0", () => {
    for (const [objective, weights] of Object.entries(DEFAULT_OBJECTIVE_WEIGHTS)) {
      const sum = PERFORMANCE_COMPONENT_KEYS.reduce((total, key) => total + weights[key], 0);
      expect(sum, `pesos de "${objective}" devem somar 1.0`).toBeCloseTo(1, 5);
    }
  });
});

describe("getPerformanceTier", () => {
  it("classifica conforme as faixas padrão", () => {
    expect(getPerformanceTier(69)).toBe("below_average");
    expect(getPerformanceTier(70)).toBe("average");
    expect(getPerformanceTier(119)).toBe("average");
    expect(getPerformanceTier(120)).toBe("above_average");
    expect(getPerformanceTier(299)).toBe("above_average");
    expect(getPerformanceTier(300)).toBe("viral");
  });

  it("aceita faixas customizadas (configurável)", () => {
    expect(getPerformanceTier(50, { averageMin: 40, aboveAverageMin: 80, viralMin: 200 })).toBe("average");
  });
});

describe("getPerformanceIndexThresholds", () => {
  it("usa os padrões quando extra não tem thresholds válidos", () => {
    expect(getPerformanceIndexThresholds(null)).toEqual(DEFAULT_PERFORMANCE_TIER_THRESHOLDS);
    expect(getPerformanceIndexThresholds({})).toEqual(DEFAULT_PERFORMANCE_TIER_THRESHOLDS);
    expect(getPerformanceIndexThresholds({ performance_index_thresholds: { averageMin: "x" } })).toEqual(
      DEFAULT_PERFORMANCE_TIER_THRESHOLDS,
    );
  });

  it("lê thresholds válidos de app_settings.extra", () => {
    const extra = { performance_index_thresholds: { averageMin: 60, aboveAverageMin: 100, viralMin: 250 } };
    expect(getPerformanceIndexThresholds(extra)).toEqual({ averageMin: 60, aboveAverageMin: 100, viralMin: 250 });
  });

  it("rejeita thresholds fora de ordem (não confiáveis)", () => {
    const extra = { performance_index_thresholds: { averageMin: 100, aboveAverageMin: 50, viralMin: 10 } };
    expect(getPerformanceIndexThresholds(extra)).toEqual(DEFAULT_PERFORMANCE_TIER_THRESHOLDS);
  });
});

describe("buildPerformanceBaselines", () => {
  const values = (shareRateValue: number) => ({
    shareRate: shareRateValue,
    saveRate: null,
    engagementRate: null,
    followerConversion: null,
    ctr: null,
    salesPerBase: null,
  });

  it("compara por formato+conta quando a amostra é suficiente", () => {
    const baselines = buildPerformanceBaselines(
      [
        { accountId: "acc-1", format: "reel", values: values(10) },
        { accountId: "acc-1", format: "reel", values: values(20) },
        { accountId: "acc-1", format: "reel", values: values(30) },
      ],
      { minSample: 3 },
    );
    const described = baselines.describe("acc-1", "reel", "shareRate");
    expect(described).toEqual({ scope: "account_format", average: 20, sampleSize: 3 });
  });

  it("cai para a conta inteira quando o grupo formato+conta é pequeno demais", () => {
    const baselines = buildPerformanceBaselines(
      [
        { accountId: "acc-1", format: "reel", values: values(10) },
        { accountId: "acc-1", format: "carousel", values: values(20) },
        { accountId: "acc-1", format: "photo", values: values(30) },
      ],
      { minSample: 3 },
    );
    const described = baselines.describe("acc-1", "reel", "shareRate");
    expect(described?.scope).toBe("account");
    expect(described?.sampleSize).toBe(3);
  });

  it("cai para global quando nem a conta tem amostra suficiente", () => {
    const baselines = buildPerformanceBaselines(
      [
        { accountId: "acc-1", format: "reel", values: values(10) },
        { accountId: "acc-2", format: "reel", values: values(20) },
        { accountId: "acc-3", format: "reel", values: values(30) },
      ],
      { minSample: 3 },
    );
    const described = baselines.describe("acc-1", "reel", "shareRate");
    expect(described?.scope).toBe("global");
    expect(described?.sampleSize).toBe(3);
  });

  it("null (estado sem base histórica suficiente) quando nem global tem amostra", () => {
    const baselines = buildPerformanceBaselines([{ accountId: "acc-1", format: "reel", values: values(10) }], { minSample: 3 });
    expect(baselines.describe("acc-1", "reel", "shareRate")).toBeNull();
  });
});

describe("computePerformanceIndex", () => {
  const baselineInputs = Array.from({ length: 3 }, () => ({
    accountId: "acc-1",
    format: "reel",
    values: { shareRate: 4, saveRate: 6, engagementRate: 10, followerConversion: 2, ctr: 1, salesPerBase: 0.5 },
  }));
  const baselines = buildPerformanceBaselines(baselineInputs, { minSample: 3 });
  const context = { accountId: "acc-1", format: "reel", objective: "engajamento" };

  it("state 'no_capture' quando não há leitura para a janela", () => {
    const result = computePerformanceIndex(null, context, baselines);
    expect(result).toEqual({ state: "no_capture", index: null, tier: null, breakdown: [] });
  });

  it("index 100 quando os valores do conteúdo são exatamente a média histórica", () => {
    const s = snapshot({
      shares: 4,
      saves: 6,
      likes: 0,
      comments: 0,
      replies: 0,
      reach: 100,
      followers_gained: 2,
      profile_visits: 100,
      link_clicks: 1,
      impressions: 100,
      sales: 0.5,
    });
    const result = computePerformanceIndex(s, context, baselines);
    expect(result.state).toBe("ok");
    expect(result.index).toBe(100);
    expect(result.tier).toBe("average");
  });

  it("limita cada componente a 3x a média (outlier não distorce o índice)", () => {
    // shareRate = 40 (10x a média de 4) -> deveria contar como só 3x (300)
    const s = snapshot({ shares: 40, reach: 100 });
    const result = computePerformanceIndex(s, context, baselines);
    const shareComponent = result.breakdown.find((c) => c.key === "shareRate")!;
    expect(shareComponent.ratio).toBe(3);
    expect(shareComponent.score).toBe(300);
  });

  it("redistribui o peso de um componente sem valor informado entre os disponíveis", () => {
    // só link_clicks/impressions informados -> só ctr é calculável (os outros
    // componentes não têm nenhum campo que dependa deles, nem indiretamente —
    // diferente de engagementRate, que reaproveita shares/saves em totalEngagement)
    // -> ctr deveria absorver 100% do peso.
    const s = snapshot({ link_clicks: 1, impressions: 100 });
    const result = computePerformanceIndex(s, context, baselines);
    const ctrComponent = result.breakdown.find((c) => c.key === "ctr")!;
    expect(ctrComponent.available).toBe(true);
    expect(ctrComponent.redistributedWeight).toBeCloseTo(1, 5);
    expect(result.index).toBe(100); // ctr = 1 = média -> score 100, único componente -> índice 100
    const unavailable = result.breakdown.filter((c) => !c.available);
    expect(unavailable.length).toBe(5);
    for (const component of unavailable) {
      expect(component.redistributedWeight).toBeNull();
      expect(component.unavailableReason).toBe("missing_value");
    }
  });

  it("state 'insufficient_data' quando nenhum componente tem base histórica (mas não é 'no_capture', pois há leitura)", () => {
    const emptyBaselines = buildPerformanceBaselines([]);
    const s = snapshot({ shares: 4, reach: 100 });
    const result = computePerformanceIndex(s, context, emptyBaselines);
    expect(result.state).toBe("insufficient_data");
    expect(result.index).toBeNull();
    // mesmo sem índice, o breakdown mostra o valor bruto coletado — não é caixa-preta
    const shareComponent = result.breakdown.find((c) => c.key === "shareRate")!;
    expect(shareComponent.value).toBeCloseTo(4, 5);
    expect(shareComponent.unavailableReason).toBe("insufficient_baseline");
  });

  it("baseline com média zero também não é calculável (divisão por zero), mesmo com amostra suficiente", () => {
    const zeroBaselines = buildPerformanceBaselines(
      Array.from({ length: 3 }, () => ({
        accountId: "acc-1",
        format: "reel",
        values: { shareRate: 0, saveRate: null, engagementRate: null, followerConversion: null, ctr: null, salesPerBase: null },
      })),
      { minSample: 3 },
    );
    const s = snapshot({ shares: 4, reach: 100 });
    const result = computePerformanceIndex(s, context, zeroBaselines);
    const shareComponent = result.breakdown.find((c) => c.key === "shareRate")!;
    expect(shareComponent.available).toBe(false);
  });
});

describe("computePerformanceIndexForWindow / rankByPerformanceIndex", () => {
  function buildItem(id: string, format: string) {
    return item({ id, account_id: "acc-1", format, objective: "engajamento" });
  }

  it("nunca mistura leituras de janelas diferentes na base histórica", () => {
    const items = [buildItem("a", "reel"), buildItem("b", "reel"), buildItem("c", "reel"), buildItem("d", "reel")];
    const snapshotsByItem = new Map<string, MetricSnapshot[]>([
      ["a", [snapshot({ content_item_id: "a", window_type: "7d", shares: 10, reach: 100 })]],
      ["b", [snapshot({ content_item_id: "b", window_type: "7d", shares: 10, reach: 100 })]],
      ["c", [snapshot({ content_item_id: "c", window_type: "7d", shares: 10, reach: 100 })]],
      // "d" só tem leitura de 24h com um valor bem diferente — não deve entrar na base de 7d.
      ["d", [snapshot({ content_item_id: "d", window_type: "24h", shares: 1000, reach: 100 })]],
    ]);
    const results = computePerformanceIndexForWindow(items, snapshotsByItem, "7d");
    expect(results.get("d")!.state).toBe("no_capture");
    expect(results.get("a")!.state).toBe("ok");
    // a média de shareRate entre a/b/c é 10% (todas iguais) -> índice 100 para cada uma.
    expect(results.get("a")!.index).toBe(100);
  });

  it("ranking só inclui conteúdos com índice calculável, do maior para o menor", () => {
    const items = [buildItem("a", "reel"), buildItem("b", "reel"), buildItem("c", "reel"), buildItem("no-capture", "reel")];
    const snapshotsByItem = new Map<string, MetricSnapshot[]>([
      ["a", [snapshot({ content_item_id: "a", window_type: "7d", shares: 30, reach: 100 })]],
      ["b", [snapshot({ content_item_id: "b", window_type: "7d", shares: 10, reach: 100 })]],
      ["c", [snapshot({ content_item_id: "c", window_type: "7d", shares: 20, reach: 100 })]],
      ["no-capture", []],
    ]);
    const results = computePerformanceIndexForWindow(items, snapshotsByItem, "7d");
    const ranked = rankByPerformanceIndex(items, results);
    expect(ranked.map((entry) => entry.item.id)).toEqual(["a", "c", "b"]);
    expect(ranked.every((entry) => entry.result.state === "ok")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Filtros e ordenação
// ---------------------------------------------------------------------------

describe("filterMetricasItems", () => {
  const items = [
    item({ id: "a", format: "reel", pillar: "Rotina", objective: "engajamento", account_id: "acc-1", campaign_id: "camp-1" }),
    item({ id: "b", format: "carousel", pillar: "Educação", objective: "vendas", account_id: "acc-2", campaign_id: null }),
  ];
  const emptySnapshots = new Map<string, MetricSnapshot[]>();
  const emptyIndex = new Map();

  it("sem filtros, retorna todos os itens", () => {
    expect(filterMetricasItems(items, EMPTY_METRICAS_FILTERS, emptySnapshots, emptyIndex)).toHaveLength(2);
  });

  it("filtra por formato", () => {
    const result = filterMetricasItems(items, { ...EMPTY_METRICAS_FILTERS, format: "carousel" }, emptySnapshots, emptyIndex);
    expect(result.map((i) => i.id)).toEqual(["b"]);
  });

  it("filtra por objetivo e por conta", () => {
    expect(
      filterMetricasItems(items, { ...EMPTY_METRICAS_FILTERS, objective: "vendas" }, emptySnapshots, emptyIndex).map((i) => i.id),
    ).toEqual(["b"]);
    expect(
      filterMetricasItems(items, { ...EMPTY_METRICAS_FILTERS, accountId: "acc-1" }, emptySnapshots, emptyIndex).map((i) => i.id),
    ).toEqual(["a"]);
  });

  it("filtra por faixa do índice usando o resultado já calculado", () => {
    const indexByItem = new Map([
      ["a", { state: "ok" as const, index: 150, tier: "above_average" as const, breakdown: [] }],
      ["b", { state: "ok" as const, index: 50, tier: "below_average" as const, breakdown: [] }],
    ]);
    expect(
      filterMetricasItems(items, { ...EMPTY_METRICAS_FILTERS, tier: "above_average" }, emptySnapshots, indexByItem).map((i) => i.id),
    ).toEqual(["a"]);
  });

  it("busca por texto ignora acentos e maiúsculas", () => {
    const result = filterMetricasItems(items, { ...EMPTY_METRICAS_FILTERS, search: "EDUCACAO" }, emptySnapshots, emptyIndex);
    expect(result.map((i) => i.id)).toEqual(["b"]);
  });
});

describe("sortMetricasItems", () => {
  const items = [
    item({ id: "a", published_at: "2026-09-01T00:00:00.000Z" }),
    item({ id: "b", published_at: "2026-09-03T00:00:00.000Z" }),
  ];
  const emptySnapshots = new Map<string, MetricSnapshot[]>();

  it("index_desc ordena pelo índice, maior primeiro", () => {
    const indexByItem = new Map([
      ["a", { state: "ok" as const, index: 50, tier: "below_average" as const, breakdown: [] }],
      ["b", { state: "ok" as const, index: 150, tier: "above_average" as const, breakdown: [] }],
    ]);
    expect(sortMetricasItems(items, "index_desc", indexByItem, emptySnapshots).map((i) => i.id)).toEqual(["b", "a"]);
  });

  it("published_desc ordena por data de publicação, mais recente primeiro", () => {
    expect(sortMetricasItems(items, "published_desc", new Map(), emptySnapshots).map((i) => i.id)).toEqual(["b", "a"]);
  });
});
