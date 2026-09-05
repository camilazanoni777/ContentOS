import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const saveMetricSnapshotMock = vi.fn();
const removeMetricSnapshotMock = vi.fn();

vi.mock("@/lib/actions/metricas", () => ({
  saveMetricSnapshot: (...args: unknown[]) => saveMetricSnapshotMock(...args),
  removeMetricSnapshot: (...args: unknown[]) => removeMetricSnapshotMock(...args),
}));

import { MetricasWorkspace } from "./metricas-workspace";
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
    published_at: "2026-08-20T12:00:00.000Z",
    published_url: "https://instagram.com/p/abc",
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
    created_at: "2026-08-20T12:00:00.000Z",
    updated_at: "2026-08-20T12:00:00.000Z",
    archived_at: null,
    ...overrides,
  };
}

function snapshot(overrides: Partial<MetricSnapshot> = {}): MetricSnapshot {
  return {
    id: "snap-1",
    content_item_id: "item-1",
    user_id: "user-1",
    window_type: "7d",
    window_start: null,
    window_end: null,
    captured_at: "2026-08-27T12:00:00.000Z",
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
    created_at: "2026-08-27T12:00:00.000Z",
    ...overrides,
  };
}

describe("MetricasWorkspace", () => {
  beforeEach(() => {
    saveMetricSnapshotMock.mockReset();
    removeMetricSnapshotMock.mockReset();
  });

  it("lista os conteúdos publicados na tabela", () => {
    render(
      <MetricasWorkspace
        initialItems={[item({ id: "a", title: "Reel A" }), item({ id: "b", title: "Reel B" })]}
        metricSnapshots={[]}
        campaigns={[]}
        accounts={[]}
      />,
    );
    expect(screen.getByRole("link", { name: "Reel A" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reel B" })).toBeInTheDocument();
  });

  it("mostra estado sem base histórica quando nenhum conteúdo tem leitura na janela comparada", () => {
    render(
      <MetricasWorkspace
        initialItems={[item({ id: "a", title: "Reel A" })]}
        metricSnapshots={[]}
        campaigns={[]}
        accounts={[]}
      />,
    );
    expect(screen.getByText("Sem captura")).toBeInTheDocument();
  });

  it("alerta de métricas pendentes aparece quando uma janela já venceu sem leitura", () => {
    const publishedLongAgo = item({ id: "a", title: "Reel antigo", published_at: "2020-01-01T00:00:00.000Z" });
    render(<MetricasWorkspace initialItems={[publishedLongAgo]} metricSnapshots={[]} campaigns={[]} accounts={[]} />);
    expect(screen.getByText(/captura de métrica pendente/)).toBeInTheDocument();
  });

  it("filtra por formato", async () => {
    const user = userEvent.setup();
    render(
      <MetricasWorkspace
        initialItems={[
          item({ id: "a", title: "Reel A", format: "reel" }),
          item({ id: "b", title: "Carrossel B", format: "carousel" }),
        ]}
        metricSnapshots={[]}
        campaigns={[]}
        accounts={[]}
      />,
    );
    await user.selectOptions(screen.getByLabelText("Filtrar por formato"), "carousel");
    expect(screen.queryByRole("link", { name: "Reel A" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Carrossel B" })).toBeInTheDocument();
  });

  it("mostra o ranking quando há conteúdos com índice calculável", () => {
    const items = [
      item({ id: "a", title: "Reel A", account_id: "acc-1", format: "reel" }),
      item({ id: "b", title: "Reel B", account_id: "acc-1", format: "reel" }),
      item({ id: "c", title: "Reel C", account_id: "acc-1", format: "reel" }),
    ];
    const snapshots = [
      snapshot({ id: "s-a", content_item_id: "a", shares: 30, reach: 100 }),
      snapshot({ id: "s-b", content_item_id: "b", shares: 10, reach: 100 }),
      snapshot({ id: "s-c", content_item_id: "c", shares: 20, reach: 100 }),
    ];
    render(<MetricasWorkspace initialItems={items} metricSnapshots={snapshots} campaigns={[]} accounts={[]} />);
    expect(screen.getByText("Ranking — 7 dias")).toBeInTheDocument();
  });

  it("abre o drawer de captura ao clicar em Registrar", async () => {
    const user = userEvent.setup();
    render(
      <MetricasWorkspace initialItems={[item({ id: "a", title: "Reel A" })]} metricSnapshots={[]} campaigns={[]} accounts={[]} />,
    );
    await user.click(screen.getByRole("button", { name: /Registrar/ }));
    expect(screen.getByText("Registrar métricas", { selector: "h2, [role=heading]" })).toBeInTheDocument();
  });
});
