import { describe, expect, it } from "vitest";

import {
  EMPTY_EDICAO_FILTERS,
  editChecklistProgress,
  filterEdicaoItems,
  getNextEditingStatus,
  isEditChecklistComplete,
  isOverdue,
  listEditors,
  parseEditChecklist,
  parseEditVisualReferences,
} from "./editing";
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
    status: "editing",
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

describe("parseEditVisualReferences", () => {
  it("lê rótulo e link, ignora entradas sem os dois vazias", () => {
    const refs = parseEditVisualReferences([{ label: "Abertura", url: "https://x.com" }, { label: "", url: "" }, "lixo"]);
    expect(refs).toEqual([{ label: "Abertura", url: "https://x.com" }]);
  });

  it("json que não é array vira lista vazia", () => {
    expect(parseEditVisualReferences(null)).toEqual([]);
    expect(parseEditVisualReferences({})).toEqual([]);
  });
});

describe("parseEditChecklist / editChecklistProgress / isEditChecklistComplete", () => {
  it("preenche as 9 chaves com false por padrão", () => {
    const checklist = parseEditChecklist({});
    expect(Object.keys(checklist)).toHaveLength(9);
    expect(editChecklistProgress(checklist)).toEqual({ checked: 0, total: 9 });
  });

  it("completo quando todas as 9 chaves são true", () => {
    const checklist = parseEditChecklist({
      hook_first_seconds: true,
      pacing: true,
      cuts: true,
      audio: true,
      captions: true,
      safe_zones: true,
      brand_identity: true,
      cta: true,
      spelling_review: true,
    });
    expect(isEditChecklistComplete(checklist)).toBe(true);
  });
});

describe("getNextEditingStatus", () => {
  it("segue recorded -> editing -> awaiting_approval -> scheduled", () => {
    expect(getNextEditingStatus("recorded")).toBe("editing");
    expect(getNextEditingStatus("editing")).toBe("awaiting_approval");
    expect(getNextEditingStatus("awaiting_approval")).toBe("scheduled");
  });

  it("status fora do fluxo de edição não tem próxima etapa", () => {
    expect(getNextEditingStatus("idea")).toBeNull();
    expect(getNextEditingStatus("scheduled")).toBeNull();
    expect(getNextEditingStatus("published")).toBeNull();
  });
});

describe("isOverdue", () => {
  const now = new Date("2026-09-10T12:00:00.000Z");

  it("prazo no passado e status ativo é atrasado", () => {
    expect(isOverdue(item({ production_due_at: "2026-09-01T00:00:00.000Z", status: "editing" }), now)).toBe(true);
  });

  it("sem prazo nunca é atrasado", () => {
    expect(isOverdue(item({ production_due_at: null }), now)).toBe(false);
  });

  it("prazo no passado mas já publicado/agendado não conta como atrasado", () => {
    expect(isOverdue(item({ production_due_at: "2026-09-01T00:00:00.000Z", status: "published" }), now)).toBe(false);
    expect(isOverdue(item({ production_due_at: "2026-09-01T00:00:00.000Z", status: "scheduled" }), now)).toBe(false);
  });

  it("prazo no futuro não é atrasado", () => {
    expect(isOverdue(item({ production_due_at: "2026-12-01T00:00:00.000Z" }), now)).toBe(false);
  });
});

describe("filterEdicaoItems", () => {
  const now = new Date("2026-09-10T12:00:00.000Z");
  const items = [
    item({ id: "a", title: "Reel manhã", status: "editing", editor_name: "Bia", production_due_at: "2026-09-01T00:00:00.000Z" }),
    item({ id: "b", title: "Carrossel receita", status: "awaiting_approval", editor_name: "Ana", production_due_at: null }),
  ];

  it("sem filtro devolve tudo", () => {
    expect(filterEdicaoItems(items, EMPTY_EDICAO_FILTERS, now)).toHaveLength(2);
  });

  it("filtra por status", () => {
    expect(filterEdicaoItems(items, { ...EMPTY_EDICAO_FILTERS, status: "awaiting_approval" }, now).map((i) => i.id)).toEqual(["b"]);
  });

  it("filtra por editor", () => {
    expect(filterEdicaoItems(items, { ...EMPTY_EDICAO_FILTERS, editor: "Ana" }, now).map((i) => i.id)).toEqual(["b"]);
  });

  it("filtra só atrasados", () => {
    expect(filterEdicaoItems(items, { ...EMPTY_EDICAO_FILTERS, overdue: true }, now).map((i) => i.id)).toEqual(["a"]);
  });

  it("busca por título", () => {
    expect(filterEdicaoItems(items, { ...EMPTY_EDICAO_FILTERS, search: "receita" }, now).map((i) => i.id)).toEqual(["b"]);
  });
});

describe("listEditors", () => {
  it("lista nomes únicos, ordenados, ignorando vazios", () => {
    const items = [item({ editor_name: "Bia" }), item({ editor_name: "Ana" }), item({ editor_name: "Bia" }), item({ editor_name: null })];
    expect(listEditors(items)).toEqual(["Ana", "Bia"]);
  });
});
