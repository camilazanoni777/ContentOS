import { describe, expect, it } from "vitest";

import {
  EMPTY_IDEA_FILTERS,
  calculateIdeaScore,
  canTransitionContentStatus,
  filterIdeas,
  getIdeaAlerts,
  isReadyToRecord,
} from "@/lib/content-pipeline";
import type { ContentItem, ContentStatusHistory } from "@/types/domain";

function item(patch: Partial<ContentItem> = {}): ContentItem {
  return {
    id: "1",
    user_id: "user",
    account_id: null,
    title: "Ideia teste",
    hook: "Você já reparou nisso?",
    summary: null,
    script: null,
    caption: null,
    format: "reel",
    pillar: "Estratégia",
    objective: "alcance",
    cta: null,
    priority: "media",
    status: "idea",
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
    created_at: "2026-07-01T12:00:00.000Z",
    updated_at: "2026-07-01T12:00:00.000Z",
    archived_at: null,
    ...patch,
  };
}

const history: ContentStatusHistory[] = [{
  id: "h1",
  content_item_id: "1",
  user_id: "user",
  previous_status: null,
  new_status: "idea",
  changed_at: "2026-07-01T12:00:00.000Z",
}];

describe("score recomendado", () => {
  it("aplica base potencial x 2 + facilidade e multiplicador de prioridade", () => {
    expect(calculateIdeaScore(item({ potential: "alto", production_ease: "alta", priority: "alta" }))).toBe(10.8);
    expect(calculateIdeaScore(item({ potential: "medio", production_ease: "baixa", priority: "media" }))).toBe(5);
    expect(calculateIdeaScore(item({ potential: "baixo", production_ease: "baixa", priority: "baixa" }))).toBe(2.4);
  });

  it("não inventa score quando potencial ou facilidade estão ausentes", () => {
    expect(calculateIdeaScore(item({ potential: null }))).toBeNull();
  });
});

describe("alertas e prontidão", () => {
  it("sinaliza parada, alta prioridade sem ação e campos essenciais ausentes", () => {
    expect(getIdeaAlerts(item({ priority: "alta", pillar: null, hook: null }), history, new Date("2026-09-01"))).toEqual([
      "stalled",
      "high_priority",
      "missing_pillar",
      "missing_hook",
    ]);
  });

  it("só marca pronta para gravar no status compatível, com gancho e formato", () => {
    expect(isReadyToRecord(item({ status: "ready_to_record" }))).toBe(true);
    expect(isReadyToRecord(item({ status: "scripting" }))).toBe(false);
    expect(isReadyToRecord(item({ status: "ready_to_record", hook: null }))).toBe(false);
  });
});

describe("filtros combináveis", () => {
  it("combina busca, pilar, formato, prioridade e alerta", () => {
    const matching = item({ id: "1", title: "Reel de lançamento", priority: "alta", hook: null });
    const other = item({ id: "2", title: "Bastidor", pillar: "Bastidores", format: "stories" });
    const filtered = filterIdeas(
      [matching, other],
      history,
      {
        ...EMPTY_IDEA_FILTERS,
        search: "lançamento",
        pillar: "Estratégia",
        format: "reel",
        priority: "alta",
        alert: "missing_hook",
      },
      new Date("2026-09-01"),
    );
    expect(filtered.map((entry) => entry.id)).toEqual(["1"]);
  });
});

describe("transições de pipeline", () => {
  it("permite avançar, voltar ou pular etapa, mas ignora transição para o mesmo status", () => {
    expect(canTransitionContentStatus("idea", "scripting")).toBe(true);
    expect(canTransitionContentStatus("editing", "researching")).toBe(true);
    expect(canTransitionContentStatus("idea", "published")).toBe(true);
    expect(canTransitionContentStatus("idea", "idea")).toBe(false);
  });
});
