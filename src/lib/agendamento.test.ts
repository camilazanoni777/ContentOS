import { describe, expect, it } from "vitest";

import {
  EMPTY_AGENDAMENTO_FILTERS,
  canMarkAsPublished,
  filterAgendamentoItems,
  formatHashtagsForInput,
  isMissingPublishedUrl,
  isSchedulingChecklistComplete,
  parseHashtagsInput,
  parseSchedulingChecklist,
  schedulingChecklistProgress,
  sortAgendamentoItems,
} from "./agendamento";
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

describe("parseSchedulingChecklist / schedulingChecklistProgress / isSchedulingChecklistComplete", () => {
  it("json vazio vira checklist com as 6 chaves fixas, tudo false", () => {
    const checklist = parseSchedulingChecklist({});
    expect(Object.keys(checklist)).toHaveLength(6);
    expect(Object.values(checklist).every((value) => value === false)).toBe(true);
    expect(schedulingChecklistProgress(checklist)).toEqual({ checked: 0, total: 6 });
    expect(isSchedulingChecklistComplete(checklist)).toBe(false);
  });

  it("ignora chaves desconhecidas e lê só as fixas", () => {
    const checklist = parseSchedulingChecklist({ caption_final: true, chave_desconhecida: true });
    expect(checklist.caption_final).toBe(true);
    expect(schedulingChecklistProgress(checklist).checked).toBe(1);
  });

  it("completo quando todas as 6 chaves são true", () => {
    const checklist = parseSchedulingChecklist({
      caption_final: true,
      hashtags_definidas: true,
      cta_presente: true,
      capa_definida: true,
      horario_conferido: true,
      campanha_vinculada: true,
    });
    expect(isSchedulingChecklistComplete(checklist)).toBe(true);
  });

  it("json inválido (array/null) vira checklist vazio, nunca quebra", () => {
    expect(schedulingChecklistProgress(parseSchedulingChecklist(null)).checked).toBe(0);
    expect(schedulingChecklistProgress(parseSchedulingChecklist([1, 2, 3])).checked).toBe(0);
  });
});

describe("canMarkAsPublished", () => {
  it("exige uma data/hora real e não vazia — regra central de 'não publicar sem data real'", () => {
    expect(canMarkAsPublished("2026-09-10T14:30")).toBe(true);
    expect(canMarkAsPublished("")).toBe(false);
    expect(canMarkAsPublished("   ")).toBe(false);
    expect(canMarkAsPublished(null)).toBe(false);
    expect(canMarkAsPublished(undefined)).toBe(false);
  });
});

describe("isMissingPublishedUrl", () => {
  it("só sinaliza pendência quando já publicado e sem URL — URL pode ser adicionada depois", () => {
    expect(isMissingPublishedUrl(item({ status: "published", published_url: null }))).toBe(true);
    expect(isMissingPublishedUrl(item({ status: "published", published_url: "https://instagram.com/p/x" }))).toBe(false);
    expect(isMissingPublishedUrl(item({ status: "scheduled", published_url: null }))).toBe(false);
  });
});

describe("parseHashtagsInput / formatHashtagsForInput", () => {
  it("separa por espaço e/ou vírgula, remove #, ignora vazios e duplicatas (case-insensitive)", () => {
    expect(parseHashtagsInput("#rotina, #Rotina #vendas,,  #foco")).toEqual(["rotina", "vendas", "foco"]);
  });

  it("texto vazio/nulo vira array vazio", () => {
    expect(parseHashtagsInput("")).toEqual([]);
    expect(parseHashtagsInput(null)).toEqual([]);
    expect(parseHashtagsInput(undefined)).toEqual([]);
  });

  it("formatHashtagsForInput é o inverso (com # reaplicado)", () => {
    expect(formatHashtagsForInput(["rotina", "vendas"])).toBe("#rotina #vendas");
    expect(formatHashtagsForInput([])).toBe("");
    expect(formatHashtagsForInput(null)).toBe("");
  });
});

describe("filterAgendamentoItems", () => {
  const items = [
    item({ id: "a", title: "Reel de rotina matinal", campaign_id: "camp-1", product_id: null, scheduling_checklist: { caption_final: true, hashtags_definidas: true, cta_presente: true, capa_definida: true, horario_conferido: true, campanha_vinculada: true } }),
    item({ id: "b", title: "Carrossel de vendas", campaign_id: "camp-2", product_id: "prod-1", scheduling_checklist: {} }),
  ];

  it("busca por texto (título, gancho, legenda, cta, hashtags)", () => {
    expect(filterAgendamentoItems(items, { ...EMPTY_AGENDAMENTO_FILTERS, search: "vendas" }).map((i) => i.id)).toEqual(["b"]);
  });

  it("filtra por campanha e produto", () => {
    expect(filterAgendamentoItems(items, { ...EMPTY_AGENDAMENTO_FILTERS, campaignId: "camp-1" }).map((i) => i.id)).toEqual(["a"]);
    expect(filterAgendamentoItems(items, { ...EMPTY_AGENDAMENTO_FILTERS, productId: "prod-1" }).map((i) => i.id)).toEqual(["b"]);
  });

  it("filtra por checklist incompleto", () => {
    expect(filterAgendamentoItems(items, { ...EMPTY_AGENDAMENTO_FILTERS, checklistIncomplete: true }).map((i) => i.id)).toEqual(["b"]);
  });
});

describe("sortAgendamentoItems", () => {
  it("ordena por data planejada mais próxima primeiro; sem data fica por último", () => {
    const items = [
      item({ id: "sem-data", scheduled_at: null }),
      item({ id: "mais-distante", scheduled_at: "2026-09-20T12:00:00.000Z" }),
      item({ id: "mais-proximo", scheduled_at: "2026-09-05T12:00:00.000Z" }),
    ];
    expect(sortAgendamentoItems(items).map((i) => i.id)).toEqual(["mais-proximo", "mais-distante", "sem-data"]);
  });
});
