import { describe, expect, it } from "vitest";

import { buildWeeklyDailyGrid, computeExecutionPercent } from "./planejamento-semanal";
import type { ContentItem } from "@/types/domain";

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
    status: "scheduled",
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
    created_at: "2026-09-01T12:00:00.000Z",
    updated_at: "2026-09-01T12:00:00.000Z",
    archived_at: null,
    ...overrides,
  };
}

describe("buildWeeklyDailyGrid", () => {
  const weekStart = "2026-08-31"; // segunda-feira

  it("gera 7 dias, segunda a domingo, a partir de weekStart", () => {
    const days = buildWeeklyDailyGrid(weekStart, []);
    expect(days.map((day) => day.date)).toEqual([
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
      "2026-09-06",
    ]);
  });

  it("agrupa por scheduled_at e published_at, no timezone do produto", () => {
    const scheduled = item({ id: "sched", scheduled_at: "2026-09-03T15:00:00.000Z" });
    // 23:30 em UTC-03:00 no dia 02/09 -> instante UTC 2026-09-03T02:30 (não deve "vazar" para 03/09).
    const publishedLateNight = item({ id: "pub-late", status: "published", published_at: "2026-09-03T02:30:00.000Z" });
    const days = buildWeeklyDailyGrid(weekStart, [scheduled, publishedLateNight]);

    const day3 = days.find((day) => day.date === "2026-09-03")!;
    const day2 = days.find((day) => day.date === "2026-09-02")!;
    expect(day3.scheduled.map((i) => i.id)).toEqual(["sched"]);
    expect(day2.published.map((i) => i.id)).toEqual(["pub-late"]);
  });

  it("um item pode aparecer em dias diferentes de agendado e publicado (sinaliza atraso/adiantamento)", () => {
    const movedItem = item({
      id: "moved",
      status: "published",
      scheduled_at: "2026-09-01T15:00:00.000Z",
      published_at: "2026-09-03T15:00:00.000Z",
    });
    const days = buildWeeklyDailyGrid(weekStart, [movedItem]);
    expect(days.find((day) => day.date === "2026-09-01")!.scheduled.map((i) => i.id)).toEqual(["moved"]);
    expect(days.find((day) => day.date === "2026-09-03")!.published.map((i) => i.id)).toEqual(["moved"]);
  });

  it("itens fora da semana não aparecem em nenhum dia", () => {
    const outside = item({ id: "fora", scheduled_at: "2026-09-15T15:00:00.000Z" });
    const days = buildWeeklyDailyGrid(weekStart, [outside]);
    expect(days.every((day) => day.scheduled.length === 0)).toBe(true);
  });
});

describe("computeExecutionPercent", () => {
  it("publicados / planejados, arredondado", () => {
    expect(computeExecutionPercent(4, 3)).toBe(75);
    expect(computeExecutionPercent(3, 3)).toBe(100);
    expect(computeExecutionPercent(3, 4)).toBe(133);
  });

  it("sem planejados, retorna null (sem base para calcular)", () => {
    expect(computeExecutionPercent(0, 0)).toBeNull();
    expect(computeExecutionPercent(0, 2)).toBeNull();
  });
});
