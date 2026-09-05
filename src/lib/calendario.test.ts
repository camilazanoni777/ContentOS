import { describe, expect, it } from "vitest";

import {
  CALENDAR_EXCESS_THRESHOLD,
  EMPTY_CALENDAR_FILTERS,
  buildMonthGrid,
  filterCalendarItems,
  getMonthGridRange,
  isDraggable,
  isEmptyDay,
  isExcessDay,
  summarizeMonth,
} from "./calendario";
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

describe("isDraggable", () => {
  it("só conteúdos agendados (scheduled) podem ser arrastados — published_at é um fato consumado", () => {
    expect(isDraggable(item({ status: "scheduled" }))).toBe(true);
    expect(isDraggable(item({ status: "published" }))).toBe(false);
    expect(isDraggable(item({ status: "idea" }))).toBe(false);
  });
});

describe("getMonthGridRange", () => {
  it("cobre semanas completas (segunda a domingo) ao redor do mês", () => {
    // Setembro/2026 começa numa terça (01/09) e termina numa quarta (30/09).
    expect(getMonthGridRange("2026-09-05")).toEqual({ start: "2026-08-31", end: "2026-10-04" });
  });
});

describe("buildMonthGrid", () => {
  it("posiciona itens agendados pelo scheduled_at e publicados pelo published_at", () => {
    const scheduled = item({ id: "sched", status: "scheduled", scheduled_at: "2026-09-10T15:00:00.000Z" });
    const published = item({
      id: "pub",
      status: "published",
      scheduled_at: "2026-09-05T15:00:00.000Z", // data planejada original, não deve valer mais
      published_at: "2026-09-12T15:00:00.000Z",
    });
    const days = buildMonthGrid("2026-09-01", [scheduled, published]);

    const schedDay = days.find((day) => day.items.some((i) => i.id === "sched"));
    const pubDay = days.find((day) => day.items.some((i) => i.id === "pub"));
    expect(schedDay?.date).toBe("2026-09-10");
    expect(pubDay?.date).toBe("2026-09-12");
  });

  it("marca dias fora do mês corrente (padding de semana) como inCurrentMonth: false", () => {
    const days = buildMonthGrid("2026-09-01", []);
    const augustPadding = days.find((day) => day.date === "2026-08-31");
    const septFirst = days.find((day) => day.date === "2026-09-01");
    expect(augustPadding?.inCurrentMonth).toBe(false);
    expect(septFirst?.inCurrentMonth).toBe(true);
  });

  it("posiciona datas importantes pelo event_date", () => {
    const days = buildMonthGrid("2026-09-01", [], [{ id: "imp-1", user_id: "u", event_date: "2026-09-15", label: "Lançamento", notes: null, created_at: "", updated_at: "" }]);
    const day = days.find((d) => d.date === "2026-09-15");
    expect(day?.importantDates).toHaveLength(1);
  });
});

describe("isEmptyDay / isExcessDay", () => {
  it("dia vazio: dentro do mês corrente e sem itens", () => {
    const days = buildMonthGrid("2026-09-01", []);
    const inMonth = days.find((day) => day.date === "2026-09-10")!;
    const padding = days.find((day) => day.date === "2026-08-31")!;
    expect(isEmptyDay(inMonth)).toBe(true);
    // Dia de padding (fora do mês) não conta como "vazio" para o indicador do mês.
    expect(isEmptyDay(padding)).toBe(false);
  });

  it(`excesso: mais de ${CALENDAR_EXCESS_THRESHOLD} publicações no mesmo dia`, () => {
    const many = Array.from({ length: CALENDAR_EXCESS_THRESHOLD + 1 }, (_, index) =>
      item({ id: `item-${index}`, scheduled_at: "2026-09-10T15:00:00.000Z" }),
    );
    const days = buildMonthGrid("2026-09-01", many);
    const day = days.find((d) => d.date === "2026-09-10")!;
    expect(isExcessDay(day)).toBe(true);

    const few = many.slice(0, CALENDAR_EXCESS_THRESHOLD);
    const daysFew = buildMonthGrid("2026-09-01", few);
    expect(isExcessDay(daysFew.find((d) => d.date === "2026-09-10")!)).toBe(false);
  });
});

describe("filterCalendarItems", () => {
  it("filtra por formato, pilar, objetivo, status e campanha", () => {
    const items = [
      item({ id: "a", format: "reel", pillar: "Rotina", objective: "engajamento", status: "scheduled", campaign_id: "camp-1" }),
      item({ id: "b", format: "carousel", pillar: "Vendas", objective: "vendas", status: "published", campaign_id: "camp-2" }),
    ];
    expect(filterCalendarItems(items, { ...EMPTY_CALENDAR_FILTERS, format: "reel" }).map((i) => i.id)).toEqual(["a"]);
    expect(filterCalendarItems(items, { ...EMPTY_CALENDAR_FILTERS, status: "published" }).map((i) => i.id)).toEqual(["b"]);
    expect(filterCalendarItems(items, { ...EMPTY_CALENDAR_FILTERS, campaignId: "camp-1" }).map((i) => i.id)).toEqual(["a"]);
  });
});

describe("summarizeMonth", () => {
  it("resume só os itens do mês corrente (ignora padding), por formato e pilar", () => {
    const inMonth = item({ id: "in", format: "reel", pillar: "Rotina", scheduled_at: "2026-09-10T15:00:00.000Z" });
    // Item de padding: agendado no fim de agosto, que aparece na grade de setembro mas não é "do mês".
    const padding = item({ id: "pad", format: "carousel", pillar: "Vendas", scheduled_at: "2026-08-31T15:00:00.000Z" });
    const days = buildMonthGrid("2026-09-01", [inMonth, padding]);
    const summary = summarizeMonth(days);
    expect(summary.total).toBe(1);
    expect(summary.byFormat).toEqual([{ key: "reel", count: 1 }]);
    expect(summary.byPillar).toEqual([{ key: "Rotina", count: 1 }]);
  });
});
