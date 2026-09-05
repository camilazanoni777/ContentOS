import { describe, expect, it } from "vitest";

import {
  computeProfileSnapshotDerived,
  contentPublishedOnDate,
  cumulativeRevenueForMonth,
  fieldDelta,
  fieldGrowthPercent,
  findPreviousSnapshot,
  movingAverage,
  resultPerHour,
  sortSnapshotsByDate,
} from "./perfil";
import type { ContentItem, ProfileSnapshot } from "@/types/domain";

function snap(overrides: Partial<ProfileSnapshot> = {}): ProfileSnapshot {
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

describe("sortSnapshotsByDate / findPreviousSnapshot", () => {
  it("ordena por data crescente independentemente da ordem de entrada", () => {
    const a = snap({ id: "a", snapshot_date: "2026-09-03" });
    const b = snap({ id: "b", snapshot_date: "2026-09-01" });
    const c = snap({ id: "c", snapshot_date: "2026-09-02" });
    const sorted = sortSnapshotsByDate([a, b, c]);
    expect(sorted.map((s) => s.id)).toEqual(["b", "c", "a"]);
  });

  it("registro anterior é null para o primeiro registro da lista", () => {
    const a = snap({ id: "a", snapshot_date: "2026-09-01" });
    const b = snap({ id: "b", snapshot_date: "2026-09-02" });
    const sorted = sortSnapshotsByDate([a, b]);
    expect(findPreviousSnapshot(sorted, "a")).toBeNull();
    expect(findPreviousSnapshot(sorted, "b")?.id).toBe("a");
  });
});

describe("fieldDelta / fieldGrowthPercent (registros anteriores)", () => {
  it("calcula seguidores ganhos e crescimento percentual em cima do registro anterior", () => {
    const previous = snap({ id: "p", snapshot_date: "2026-09-01", followers: 1000 });
    const current = snap({ id: "c", snapshot_date: "2026-09-02", followers: 1050 });
    expect(fieldDelta(current, previous, "followers")).toBe(50);
    expect(fieldGrowthPercent(current, previous, "followers")).toBeCloseTo(5, 5);
  });

  it("retorna null quando não há registro anterior", () => {
    const current = snap({ followers: 1050 });
    expect(fieldDelta(current, null, "followers")).toBeNull();
    expect(fieldGrowthPercent(current, null, "followers")).toBeNull();
  });

  it("retorna null (nunca 0) quando o campo está ausente em algum dos dois lados — valores nulos", () => {
    const previous = snap({ followers: null });
    const current = snap({ followers: 1050 });
    expect(fieldDelta(current, previous, "followers")).toBeNull();
    expect(fieldGrowthPercent(current, previous, "followers")).toBeNull();

    const previous2 = snap({ followers: 1000 });
    const current2 = snap({ followers: null });
    expect(fieldDelta(current2, previous2, "followers")).toBeNull();
  });

  it("crescimento percentual é null quando o valor anterior é zero (divisão por zero)", () => {
    const previous = snap({ followers: 0 });
    const current = snap({ followers: 10 });
    expect(fieldGrowthPercent(current, previous, "followers")).toBeNull();
  });
});

describe("movingAverage", () => {
  const sorted = sortSnapshotsByDate([
    snap({ id: "d1", snapshot_date: "2026-09-01", reach: 100 }),
    snap({ id: "d2", snapshot_date: "2026-09-02", reach: null }),
    snap({ id: "d3", snapshot_date: "2026-09-03", reach: 200 }),
    snap({ id: "d4", snapshot_date: "2026-09-04", reach: 300 }),
  ]);

  it("média móvel de 7 dias ignora valores nulos (média dos disponíveis, não dos dias)", () => {
    // janela de 7d terminando em 04/09 inclui os 4 registros; reach null de d2 é ignorado.
    expect(movingAverage(sorted, "2026-09-04", 7, "reach")).toBeCloseTo((100 + 200 + 300) / 3, 5);
  });

  it("média móvel de 30 dias com a mesma janela de dados (poucos registros) dá o mesmo resultado", () => {
    expect(movingAverage(sorted, "2026-09-04", 30, "reach")).toBeCloseTo((100 + 200 + 300) / 3, 5);
  });

  it("é null (nunca 0) quando nenhum registro da janela tem o campo preenchido", () => {
    const onlyNulls = sortSnapshotsByDate([snap({ id: "n1", snapshot_date: "2026-09-01", reach: null })]);
    expect(movingAverage(onlyNulls, "2026-09-01", 7, "reach")).toBeNull();
  });

  it("janela de 7 dias exclui registros fora do intervalo", () => {
    const wide = sortSnapshotsByDate([
      snap({ id: "old", snapshot_date: "2026-08-01", reach: 999 }),
      snap({ id: "recent", snapshot_date: "2026-09-04", reach: 50 }),
    ]);
    expect(movingAverage(wide, "2026-09-04", 7, "reach")).toBe(50);
  });
});

describe("contentPublishedOnDate (cruzamento com content_items)", () => {
  it("conta só conteúdos publicados na mesma data (comparação por data local)", () => {
    const items = [
      item({ id: "i1", published_at: "2026-09-02T10:00:00.000Z" }),
      item({ id: "i2", published_at: "2026-09-02T23:00:00.000Z" }),
      item({ id: "i3", published_at: "2026-09-03T01:00:00.000Z" }),
      item({ id: "i4", published_at: null }),
    ];
    expect(contentPublishedOnDate(items, "2026-09-02", null)).toBe(2);
    expect(contentPublishedOnDate(items, "2026-09-03", null)).toBe(1);
  });

  it("filtra por conta quando accountId é informado", () => {
    const items = [
      item({ id: "i1", account_id: "acc-1", published_at: "2026-09-02T10:00:00.000Z" }),
      item({ id: "i2", account_id: "acc-2", published_at: "2026-09-02T10:00:00.000Z" }),
    ];
    expect(contentPublishedOnDate(items, "2026-09-02", "acc-1")).toBe(1);
  });

  it("é 0 (não null) quando não há nenhum conteúdo publicado na data — é uma contagem, não um dado ausente", () => {
    expect(contentPublishedOnDate([], "2026-09-02", null)).toBe(0);
  });
});

describe("cumulativeRevenueForMonth", () => {
  it("soma receita do mês até a data, ignorando meses diferentes", () => {
    const sorted = sortSnapshotsByDate([
      snap({ id: "a", snapshot_date: "2026-08-30", revenue: 500 }),
      snap({ id: "b", snapshot_date: "2026-09-01", revenue: 100 }),
      snap({ id: "c", snapshot_date: "2026-09-02", revenue: 150 }),
      snap({ id: "d", snapshot_date: "2026-09-05", revenue: null }),
    ]);
    expect(cumulativeRevenueForMonth(sorted, "2026-09-02")).toBe(250);
  });

  it("é null quando nenhum registro do mês tem receita informada", () => {
    const sorted = sortSnapshotsByDate([snap({ snapshot_date: "2026-09-01", revenue: null })]);
    expect(cumulativeRevenueForMonth(sorted, "2026-09-01")).toBeNull();
  });
});

describe("resultPerHour", () => {
  it("divide receita do dia pelas horas investidas no dia", () => {
    expect(resultPerHour(snap({ revenue: 400, hours_invested: 2 }))).toBe(200);
  });

  it("é null quando falta receita, falta horas, ou horas é zero", () => {
    expect(resultPerHour(snap({ revenue: null, hours_invested: 2 }))).toBeNull();
    expect(resultPerHour(snap({ revenue: 400, hours_invested: null }))).toBeNull();
    expect(resultPerHour(snap({ revenue: 400, hours_invested: 0 }))).toBeNull();
  });
});

describe("computeProfileSnapshotDerived (integração)", () => {
  it("combina todos os derivados de um registro com histórico e conteúdos publicados", () => {
    const sorted = sortSnapshotsByDate([
      snap({ id: "d1", snapshot_date: "2026-09-01", followers: 1000, reach: 500, views: 300, revenue: 100 }),
      snap({ id: "d2", snapshot_date: "2026-09-02", followers: 1030, reach: 600, views: 350, revenue: 50, hours_invested: 2 }),
    ]);
    const items = [item({ id: "i1", published_at: "2026-09-02T10:00:00.000Z", account_id: "acc-1" })];

    const derived = computeProfileSnapshotDerived(sorted, "d2", items);

    expect(derived.followersGained).toBe(30);
    expect(derived.followersGrowthPercent).toBeCloseTo(3, 5);
    expect(derived.reachVariation).toBe(100);
    expect(derived.viewsVariation).toBe(50);
    expect(derived.contentPublishedOnDate).toBe(1);
    expect(derived.cumulativeRevenueMonth).toBe(150);
    expect(derived.resultPerHour).toBe(25);
  });

  it("lança um erro claro quando o snapshotId não está na lista fornecida", () => {
    const sorted = sortSnapshotsByDate([snap({ id: "d1" })]);
    expect(() => computeProfileSnapshotDerived(sorted, "inexistente", [])).toThrow();
  });
});
