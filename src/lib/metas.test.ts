import { describe, expect, it } from "vitest";

import {
  computeDaysRemaining,
  computeElapsedPercent,
  computeGoal,
  computeGoalCurrentValue,
  computeGoalStatus,
  computeProgressPercent,
  DEFAULT_GOAL_STATUS_THRESHOLDS,
  effectiveInitialValue,
  getDefaultGoalTargets,
  getGoalStatusThresholds,
  GOAL_METRICS,
  withDefaultGoalTargets,
  type GoalMetricSources,
} from "./metas";
import type { ContentItem, Goal, MetricSnapshot, ProfileSnapshot } from "@/types/domain";

function profileSnap(overrides: Partial<ProfileSnapshot> = {}): ProfileSnapshot {
  return {
    id: "snap-1",
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

const emptySources: GoalMetricSources = { profileSnapshots: [], contentItems: [], metricSnapshotsByItemId: new Map() };

describe("computeElapsedPercent", () => {
  it("0% antes do início, 100% depois do fim", () => {
    expect(computeElapsedPercent("2026-09-01", "2026-09-10", "2026-08-31")).toBe(0);
    expect(computeElapsedPercent("2026-09-01", "2026-09-10", "2026-09-11")).toBe(100);
  });

  it("50% no meio de um período de 10 dias", () => {
    expect(computeElapsedPercent("2026-09-01", "2026-09-10", "2026-09-05")).toBe(50);
  });

  it("período iniciado no meio da semana/mês: total de dias é o do período real, não da semana/mês inteiro", () => {
    // período de 8 dias (03 a 10), hoje é o 3º dia -> 3/8 = 37.5%
    expect(computeElapsedPercent("2026-09-03", "2026-09-10", "2026-09-05")).toBeCloseTo(37.5, 5);
  });
});

describe("computeDaysRemaining", () => {
  it("conta dias até o fim, 0 quando já passou", () => {
    expect(computeDaysRemaining("2026-09-10", "2026-09-05")).toBe(5);
    expect(computeDaysRemaining("2026-09-10", "2026-09-15")).toBe(0);
  });
});

describe("computeProgressPercent", () => {
  it("calcula (atual - inicial) / (alvo - inicial) * 100", () => {
    expect(computeProgressPercent(60, 100, 0)).toBe(60);
    expect(computeProgressPercent(1050, 1100, 1000)).toBe(50);
  });

  it("é null (nunca 0) quando falta atual ou alvo — valores nulos", () => {
    expect(computeProgressPercent(null, 100, 0)).toBeNull();
    expect(computeProgressPercent(50, null, 0)).toBeNull();
  });

  it("trata alvo igual ao inicial (divisão por zero) sem quebrar", () => {
    expect(computeProgressPercent(10, 5, 5)).toBe(100);
    expect(computeProgressPercent(0, 5, 5)).toBe(0);
  });

  it("inicial ausente vira 0 (métricas de fluxo partem do zero)", () => {
    expect(computeProgressPercent(25, 100, null)).toBe(25);
  });
});

describe("computeGoalStatus — todos os 6 status", () => {
  const start = "2026-09-01";

  it("não iniciada: hoje é antes do início do período", () => {
    expect(computeGoalStatus(start, "2026-08-31", null, 0)).toBe("not_started");
  });

  it("no ritmo: progresso >= tempo decorrido", () => {
    expect(computeGoalStatus(start, "2026-09-05", 60, 50)).toBe("on_pace");
  });

  it("em andamento: progresso um pouco atrás (70%-100% do ritmo esperado)", () => {
    expect(computeGoalStatus(start, "2026-09-05", 40, 50)).toBe("in_progress");
  });

  it("em risco: progresso muito atrás (< 70% do ritmo esperado)", () => {
    expect(computeGoalStatus(start, "2026-09-05", 20, 50)).toBe("at_risk");
  });

  it("atingida: progresso >= 100%", () => {
    expect(computeGoalStatus(start, "2026-09-05", 120, 50)).toBe("achieved");
  });

  it("superada: progresso >= 150%", () => {
    expect(computeGoalStatus(start, "2026-09-05", 160, 50)).toBe("exceeded");
  });

  it("respeita limites customizados (thresholds configuráveis)", () => {
    const custom = { atRiskBelowPaceRatio: 0.5, achievedAtPercent: 80, exceededAtPercent: 120 };
    // progresso 30, tempo decorrido 50 -> pace 0.6, que com o limite customizado (0.5) já não conta como risco.
    expect(computeGoalStatus(start, "2026-09-05", 30, 50, custom)).toBe("in_progress");
    // com o limite padrão (0.7), o mesmo pace de 0.6 já seria em risco.
    expect(computeGoalStatus(start, "2026-09-05", 30, 50)).toBe("at_risk");
  });
});

describe("computeGoalStatus — metas iniciadas no meio do período", () => {
  // período de 8 dias (03 a 10 de setembro), hoje é dia 05 -> elapsed = 3/8 = 37.5%
  const start = "2026-09-03";
  const elapsed = 37.5;

  it("no ritmo quando o progresso acompanha o tempo decorrido do período real (não da semana/mês inteiro)", () => {
    expect(computeGoalStatus(start, "2026-09-05", 40, elapsed)).toBe("on_pace");
  });

  it("em risco quando o progresso está bem abaixo do tempo decorrido do período real", () => {
    expect(computeGoalStatus(start, "2026-09-05", 5, elapsed)).toBe("at_risk");
  });

  it("não iniciada antes do início real da meta, mesmo estando dentro da semana/mês civil", () => {
    expect(computeGoalStatus(start, "2026-09-02", null, 0)).toBe("not_started");
  });

  it("atingida independentemente do tempo decorrido, quando o progresso já bateu 100%", () => {
    expect(computeGoalStatus(start, "2026-09-05", 100, elapsed)).toBe("achieved");
  });
});

describe("getGoalStatusThresholds / getDefaultGoalTargets / withDefaultGoalTargets (app_settings.extra)", () => {
  it("usa os padrões quando extra está vazio ou inválido", () => {
    expect(getGoalStatusThresholds(null)).toEqual(DEFAULT_GOAL_STATUS_THRESHOLDS);
    expect(getGoalStatusThresholds({ goal_status_thresholds: { atRiskBelowPaceRatio: 2 } })).toEqual(DEFAULT_GOAL_STATUS_THRESHOLDS);
  });

  it("lê limites customizados válidos de extra", () => {
    const custom = { atRiskBelowPaceRatio: 0.6, achievedAtPercent: 90, exceededAtPercent: 130 };
    expect(getGoalStatusThresholds({ goal_status_thresholds: custom })).toEqual(custom);
  });

  it("metas-padrão: só devolve métricas conhecidas e numéricas", () => {
    const targets = getDefaultGoalTargets({ default_goals: { weekly: { seguidores: 100, receita: -5, invalida: "x" } } }, "weekly");
    expect(targets).toEqual({ seguidores: 100 });
  });

  it("withDefaultGoalTargets preserva o restante de extra e só altera o tipo de período informado", () => {
    const extra = { performance_index_thresholds: { averageMin: 70 }, default_goals: { weekly: { seguidores: 50 } } };
    const next = withDefaultGoalTargets(extra, "monthly", { receita: 5000 });
    expect(next.performance_index_thresholds).toEqual({ averageMin: 70 });
    expect((next.default_goals as Record<string, unknown>).weekly).toEqual({ seguidores: 50 });
    expect((next.default_goals as Record<string, unknown>).monthly).toEqual({ receita: 5000 });
  });
});

describe("computeGoalCurrentValue", () => {
  it("seguidores: soma a leitura mais recente de cada conta até a data (métrica de estoque)", () => {
    const sources: GoalMetricSources = {
      profileSnapshots: [
        profileSnap({ account_id: "acc-1", snapshot_date: "2026-09-01", followers: 1000 }),
        profileSnap({ account_id: "acc-1", snapshot_date: "2026-09-05", followers: 1100 }),
        profileSnap({ account_id: "acc-2", snapshot_date: "2026-09-03", followers: 500 }),
      ],
      contentItems: [],
      metricSnapshotsByItemId: new Map(),
    };
    expect(computeGoalCurrentValue("seguidores", "2026-09-01", "2026-09-10", "2026-09-06", sources)).toBe(1600);
    // até dia 02: só a leitura de 01/09 da acc-1 conta (1000) + nenhuma da acc-2 ainda
    expect(computeGoalCurrentValue("seguidores", "2026-09-01", "2026-09-10", "2026-09-02", sources)).toBe(1000);
  });

  it("conteúdos publicados e consistência: contagens (0 quando não há nada, nunca null)", () => {
    const sources: GoalMetricSources = {
      profileSnapshots: [],
      contentItems: [
        item({ id: "i1", published_at: "2026-09-02T10:00:00.000Z" }),
        item({ id: "i2", published_at: "2026-09-02T20:00:00.000Z" }),
        item({ id: "i3", published_at: "2026-09-04T10:00:00.000Z" }),
      ],
      metricSnapshotsByItemId: new Map(),
    };
    expect(computeGoalCurrentValue("conteudos_publicados", "2026-09-01", "2026-09-07", "2026-09-07", sources)).toBe(3);
    expect(computeGoalCurrentValue("consistencia", "2026-09-01", "2026-09-07", "2026-09-07", sources)).toBe(2); // 2 dias distintos
    expect(computeGoalCurrentValue("conteudos_publicados", "2026-09-01", "2026-09-07", "2026-09-07", emptySources)).toBe(0);
  });

  it("compartilhamentos/salvamentos: soma a leitura mais recente de cada conteúdo publicado no período", () => {
    const map = new Map<string, MetricSnapshot[]>();
    map.set("i1", [metricSnap({ content_item_id: "i1", window_type: "7d", captured_at: "2026-09-05T00:00:00.000Z", shares: 10 })]);
    map.set("i2", [metricSnap({ content_item_id: "i2", window_type: "30d", captured_at: "2026-09-06T00:00:00.000Z", shares: 20 })]);
    const sources: GoalMetricSources = {
      profileSnapshots: [],
      contentItems: [item({ id: "i1", published_at: "2026-09-01T10:00:00.000Z" }), item({ id: "i2", published_at: "2026-09-02T10:00:00.000Z" })],
      metricSnapshotsByItemId: map,
    };
    expect(computeGoalCurrentValue("compartilhamentos", "2026-09-01", "2026-09-07", "2026-09-07", sources)).toBe(30);
  });

  it("views/alcance/receita etc.: soma o campo de profile_snapshots no período — null quando nenhum registro tem o campo", () => {
    const sources: GoalMetricSources = {
      profileSnapshots: [
        profileSnap({ snapshot_date: "2026-09-02", reach: 100, revenue: 50 }),
        profileSnap({ snapshot_date: "2026-09-03", reach: 200, revenue: null }),
      ],
      contentItems: [],
      metricSnapshotsByItemId: new Map(),
    };
    expect(computeGoalCurrentValue("alcance", "2026-09-01", "2026-09-07", "2026-09-07", sources)).toBe(300);
    expect(computeGoalCurrentValue("receita", "2026-09-01", "2026-09-07", "2026-09-07", sources)).toBe(50);
    expect(computeGoalCurrentValue("views", "2026-09-01", "2026-09-07", "2026-09-07", emptySources)).toBeNull();
  });

  it("é null antes do início do período (meta ainda não começou)", () => {
    expect(computeGoalCurrentValue("alcance", "2026-09-10", "2026-09-20", "2026-09-05", emptySources)).toBeNull();
  });

  it("considera só até hoje (ou até o fim, se o período já passou) — não soma o que ainda vai acontecer", () => {
    const sources: GoalMetricSources = {
      profileSnapshots: [
        profileSnap({ snapshot_date: "2026-09-02", reach: 100 }),
        profileSnap({ snapshot_date: "2026-09-09", reach: 999 }), // fora do período (que vai até 07)
      ],
      contentItems: [],
      metricSnapshotsByItemId: new Map(),
    };
    expect(computeGoalCurrentValue("alcance", "2026-09-01", "2026-09-07", "2026-09-07", sources)).toBe(100);
  });
});

describe("effectiveInitialValue", () => {
  it("usa o valor informado quando presente", () => {
    expect(effectiveInitialValue(goal({ initial_value: 500 }), emptySources)).toBe(500);
  });

  it("métricas de fluxo sem valor informado partem de 0", () => {
    expect(effectiveInitialValue(goal({ metric: "views", initial_value: null }), emptySources)).toBe(0);
  });

  it("seguidores sem valor informado usa a última leitura de perfil antes do início (métrica de estoque)", () => {
    const sources: GoalMetricSources = {
      profileSnapshots: [
        profileSnap({ account_id: "acc-1", snapshot_date: "2026-08-25", followers: 900 }),
        profileSnap({ account_id: "acc-1", snapshot_date: "2026-09-01", followers: 1000 }),
      ],
      contentItems: [],
      metricSnapshotsByItemId: new Map(),
    };
    expect(effectiveInitialValue(goal({ metric: "seguidores", period_start: "2026-09-01", initial_value: null }), sources)).toBe(1000);
  });
});

describe("computeGoal (integração)", () => {
  it("calcula todos os campos combinados para uma meta em andamento com registros disponíveis", () => {
    const sources: GoalMetricSources = {
      profileSnapshots: [],
      contentItems: [
        item({ id: "i1", published_at: "2026-09-02T10:00:00.000Z" }),
        item({ id: "i2", published_at: "2026-09-03T10:00:00.000Z" }),
      ],
      metricSnapshotsByItemId: new Map(),
    };
    const g = goal({ period_start: "2026-09-01", period_end: "2026-09-07", metric: "conteudos_publicados", target_value: 4 });
    const computed = computeGoal(g, sources, "2026-09-04");

    expect(computed.currentValue).toBe(2);
    expect(computed.progressPercent).toBe(50);
    expect(computed.elapsedPercent).toBeCloseTo((4 / 7) * 100, 5);
    expect(computed.missing).toBe(2);
    expect(computed.daysRemaining).toBe(3);
    // tempo decorrido ~57% > progresso 50%, mas pace ratio (50/57.1 ≈ 0.875) ainda está acima do limite de risco (0.7).
    expect(computed.status).toBe("in_progress");
  });

  it("meta sem nenhum registro ainda fica 'não iniciada' antes do início, mesmo com alvo definido", () => {
    const g = goal({ period_start: "2026-09-10", period_end: "2026-09-16", target_value: 10 });
    const computed = computeGoal(g, emptySources, "2026-09-05");
    expect(computed.status).toBe("not_started");
    expect(computed.currentValue).toBeNull();
    expect(computed.progressPercent).toBeNull();
  });
});

describe("GOAL_METRICS", () => {
  it("tem exatamente as 12 métricas do catálogo do prompt", () => {
    expect(GOAL_METRICS).toHaveLength(12);
    expect(new Set(GOAL_METRICS).size).toBe(12);
  });
});
