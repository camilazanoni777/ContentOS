import { describe, expect, it } from "vitest";

import {
  EMPTY_GRAVACAO_FILTERS,
  filterGravacaoItems,
  formatAvailableMinutes,
  formatStopwatch,
  isRecordingChecklistComplete,
  parseRecordingChecklist,
  recordingChecklistProgress,
  reorderSessionItemIds,
  sortSessionItems,
} from "./recording";
import type { ContentItem, RecordingSessionItem } from "@/types/domain";

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
    status: "ready_to_record",
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

describe("parseRecordingChecklist", () => {
  it("preenche as 8 chaves com false quando o jsonb está vazio", () => {
    const checklist = parseRecordingChecklist({});
    expect(Object.keys(checklist)).toHaveLength(8);
    expect(Object.values(checklist).every((value) => value === false)).toBe(true);
  });

  it("lê só chaves conhecidas e ignora lixo", () => {
    const checklist = parseRecordingChecklist({ scenario: true, lixo: true, audio: "sim" });
    expect(checklist.scenario).toBe(true);
    expect(checklist.audio).toBe(false);
    expect((checklist as Record<string, unknown>).lixo).toBeUndefined();
  });

  it("json que não é objeto vira checklist vazio", () => {
    expect(parseRecordingChecklist(null)).toEqual(parseRecordingChecklist({}));
    expect(parseRecordingChecklist([1, 2])).toEqual(parseRecordingChecklist({}));
  });
});

describe("recordingChecklistProgress / isRecordingChecklistComplete", () => {
  it("conta itens marcados", () => {
    const checklist = parseRecordingChecklist({ scenario: true, audio: true });
    expect(recordingChecklistProgress(checklist)).toEqual({ checked: 2, total: 8 });
    expect(isRecordingChecklistComplete(checklist)).toBe(false);
  });

  it("completo quando as 8 chaves estão true", () => {
    const checklist = parseRecordingChecklist({
      script_open: true,
      scenario: true,
      lighting: true,
      audio: true,
      main_take: true,
      broll: true,
      cover: true,
      backup: true,
    });
    expect(isRecordingChecklistComplete(checklist)).toBe(true);
  });
});

describe("filterGravacaoItems", () => {
  const items = [
    item({ id: "a", title: "Reel manhã", status: "ready_to_record", format: "reel", pillar: "Rotina" }),
    item({ id: "b", title: "Carrossel receita", status: "recorded", format: "carousel", pillar: "Receitas" }),
  ];

  it("sem filtro devolve tudo", () => {
    expect(filterGravacaoItems(items, EMPTY_GRAVACAO_FILTERS)).toHaveLength(2);
  });

  it("filtra por status", () => {
    const result = filterGravacaoItems(items, { ...EMPTY_GRAVACAO_FILTERS, status: "recorded" });
    expect(result.map((i) => i.id)).toEqual(["b"]);
  });

  it("filtra por formato (normaliza acentuação/caixa)", () => {
    const result = filterGravacaoItems(items, { ...EMPTY_GRAVACAO_FILTERS, format: "REEL" });
    expect(result.map((i) => i.id)).toEqual(["a"]);
  });

  it("busca no título", () => {
    const result = filterGravacaoItems(items, { ...EMPTY_GRAVACAO_FILTERS, search: "receita" });
    expect(result.map((i) => i.id)).toEqual(["b"]);
  });
});

function sessionItem(overrides: Partial<RecordingSessionItem> = {}): RecordingSessionItem {
  return {
    id: "si-1",
    user_id: "user-1",
    session_id: "session-1",
    content_item_id: "item-1",
    sort_order: 0,
    created_at: "2026-09-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("sortSessionItems", () => {
  it("ordena por sort_order, depois por created_at", () => {
    const items = [
      sessionItem({ id: "b", sort_order: 1 }),
      sessionItem({ id: "a", sort_order: 0 }),
      sessionItem({ id: "c", sort_order: 1, created_at: "2026-09-01T11:00:00.000Z" }),
    ];
    expect(sortSessionItems(items).map((i) => i.id)).toEqual(["a", "c", "b"]);
  });
});

describe("reorderSessionItemIds", () => {
  it("move um id de uma posição para outra e recalcula sort_order 0..n", () => {
    const result = reorderSessionItemIds(["a", "b", "c"], 0, 2);
    expect(result).toEqual([
      { id: "b", sortOrder: 0 },
      { id: "c", sortOrder: 1 },
      { id: "a", sortOrder: 2 },
    ]);
  });

  it("índices inválidos devolvem a ordem original recalculada", () => {
    const result = reorderSessionItemIds(["a", "b"], 5, 0);
    expect(result).toEqual([
      { id: "a", sortOrder: 0 },
      { id: "b", sortOrder: 1 },
    ]);
  });

  it("fromIndex igual a toIndex não muda a ordem", () => {
    const result = reorderSessionItemIds(["a", "b", "c"], 1, 1);
    expect(result.map((r) => r.id)).toEqual(["a", "b", "c"]);
  });
});

describe("formatAvailableMinutes", () => {
  it("formata minutos, horas e combinações", () => {
    expect(formatAvailableMinutes(45)).toBe("45 min");
    expect(formatAvailableMinutes(60)).toBe("1 h");
    expect(formatAvailableMinutes(90)).toBe("1 h 30 min");
  });

  it("null/undefined vira string vazia", () => {
    expect(formatAvailableMinutes(null)).toBe("");
    expect(formatAvailableMinutes(undefined)).toBe("");
  });
});

describe("formatStopwatch", () => {
  it("formata segundos como mm:ss", () => {
    expect(formatStopwatch(5)).toBe("00:05");
    expect(formatStopwatch(65)).toBe("01:05");
  });

  it("formata horas quando passa de 60 minutos", () => {
    expect(formatStopwatch(3665)).toBe("1:01:05");
  });

  it("nunca fica negativo", () => {
    expect(formatStopwatch(-10)).toBe("00:00");
  });
});
