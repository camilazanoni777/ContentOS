import { describe, expect, it } from "vitest";

import {
  EMPTY_PUBLICADOS_FILTERS,
  buildRepurposeComparison,
  filterPublicadosItems,
  getCapturePendencies,
  hasAnyCapturePendency,
  isMissingPublishedUrl,
  sortPublicadosItems,
} from "./publicados";
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

describe("getCapturePendencies / hasAnyCapturePendency", () => {
  const publishedAt = "2026-09-01T12:00:00.000Z";

  it("sem published_at, não há pendências (item ainda nem foi publicado)", () => {
    expect(getCapturePendencies(item({ id: "x", published_at: null }), [])).toEqual([]);
  });

  it("logo após publicar, nenhuma janela venceu ainda", () => {
    const now = new Date("2026-09-01T13:00:00.000Z"); // 1h depois
    const pendencies = getCapturePendencies(item({ id: "x", published_at: publishedAt }), [], now);
    expect(pendencies.every((p) => !p.due)).toBe(true);
  });

  it("24h vencida e sem snapshot -> pendente; com snapshot -> não pendente", () => {
    const now = new Date("2026-09-02T13:00:00.000Z"); // 25h depois
    const withoutSnapshot = getCapturePendencies(item({ id: "x", published_at: publishedAt }), [], now);
    expect(withoutSnapshot.find((p) => p.window === "24h")?.due).toBe(true);

    const withSnapshot = getCapturePendencies(
      item({ id: "x", published_at: publishedAt }),
      [snapshot({ content_item_id: "x", window_type: "24h" })],
      now,
    );
    expect(withSnapshot.find((p) => p.window === "24h")?.due).toBe(false);
  });

  it("7d e 30d vencem em momentos diferentes de 24h", () => {
    const now = new Date("2026-09-09T12:00:00.000Z"); // exatamente 8 dias depois
    const pendencies = getCapturePendencies(item({ id: "x", published_at: publishedAt }), [], now);
    expect(pendencies.find((p) => p.window === "24h")?.due).toBe(true);
    expect(pendencies.find((p) => p.window === "7d")?.due).toBe(true);
    expect(pendencies.find((p) => p.window === "30d")?.due).toBe(false);
  });

  it("hasAnyCapturePendency resume as três janelas", () => {
    const now = new Date("2026-09-02T13:00:00.000Z");
    expect(hasAnyCapturePendency(item({ id: "x", published_at: publishedAt }), [], now)).toBe(true);
    expect(
      hasAnyCapturePendency(
        item({ id: "x", published_at: "2026-09-02T12:59:00.000Z" }),
        [],
        now,
      ),
    ).toBe(false);
  });
});

describe("isMissingPublishedUrl", () => {
  it("só sinaliza quando publicado e sem URL", () => {
    expect(isMissingPublishedUrl(item({ status: "published", published_url: null }))).toBe(true);
    expect(isMissingPublishedUrl(item({ status: "published", published_url: "https://x" }))).toBe(false);
    expect(isMissingPublishedUrl(item({ status: "repurpose", published_url: null }))).toBe(false);
  });
});

describe("filterPublicadosItems / sortPublicadosItems", () => {
  const snapshotsByItem = new Map<string, MetricSnapshot[]>();

  it("busca por texto e filtra por formato/pilar", () => {
    const items = [
      item({ id: "a", title: "Reel de rotina", format: "reel", pillar: "Rotina" }),
      item({ id: "b", title: "Carrossel de vendas", format: "carousel", pillar: "Vendas" }),
    ];
    expect(filterPublicadosItems(items, { ...EMPTY_PUBLICADOS_FILTERS, search: "vendas" }, snapshotsByItem).map((i) => i.id)).toEqual(["b"]);
    expect(filterPublicadosItems(items, { ...EMPTY_PUBLICADOS_FILTERS, format: "reel" }, snapshotsByItem).map((i) => i.id)).toEqual(["a"]);
  });

  it("filtra por 'sem URL'", () => {
    const items = [
      item({ id: "a", published_url: "https://x" }),
      item({ id: "b", published_url: null }),
    ];
    expect(filterPublicadosItems(items, { ...EMPTY_PUBLICADOS_FILTERS, missingUrl: true }, snapshotsByItem).map((i) => i.id)).toEqual(["b"]);
  });

  it("ordena por published_at mais recente primeiro; sem data por último", () => {
    const items = [
      item({ id: "sem-data", published_at: null }),
      item({ id: "mais-antigo", published_at: "2026-08-01T12:00:00.000Z" }),
      item({ id: "mais-recente", published_at: "2026-09-01T12:00:00.000Z" }),
    ];
    expect(sortPublicadosItems(items).map((i) => i.id)).toEqual(["mais-recente", "mais-antigo", "sem-data"]);
  });
});

describe("buildRepurposeComparison", () => {
  it("compara campos entre original e reaproveitado, sinalizando o que mudou", () => {
    const original = item({ id: "orig", title: "Título original", caption: "Legenda A", format: "reel" });
    const repurposed = item({ id: "rep", title: "Título original (reaproveitado)", caption: "Legenda B", format: "reel" });

    const fields = buildRepurposeComparison(original, repurposed);
    const title = fields.find((f) => f.key === "title");
    const caption = fields.find((f) => f.key === "caption");
    const format = fields.find((f) => f.key === "format");

    expect(title?.changed).toBe(true);
    expect(caption?.changed).toBe(true);
    expect(format?.changed).toBe(false);
  });
});
