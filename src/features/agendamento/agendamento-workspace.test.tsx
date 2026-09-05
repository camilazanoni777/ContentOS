import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

const saveSchedulingDraftMock = vi.fn();
const markAsPublishedMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("@/lib/actions/agendamento", () => ({
  saveSchedulingDraft: (...args: unknown[]) => saveSchedulingDraftMock(...args),
  markAsPublished: (...args: unknown[]) => markAsPublishedMock(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import { AgendamentoWorkspace } from "./agendamento-workspace";
import type { Campaign, ContentItem, Product } from "@/types/domain";

function makeItem(overrides: Partial<ContentItem> = {}): ContentItem {
  return {
    id: "item-1",
    user_id: "user-1",
    account_id: null,
    title: "Reel de rotina matinal",
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

const campaigns: Campaign[] = [];
const products: Product[] = [];

describe("AgendamentoWorkspace", () => {
  beforeEach(() => {
    saveSchedulingDraftMock.mockReset().mockResolvedValue({ success: true, item: makeItem() });
    markAsPublishedMock.mockReset();
    refreshMock.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renderiza as seções principais do workspace", () => {
    render(<AgendamentoWorkspace item={makeItem()} campaigns={campaigns} products={products} />);
    expect(screen.getByText("Agendamento")).toBeInTheDocument();
    expect(screen.getByText("Legenda final")).toBeInTheDocument();
    expect(screen.getByText("Palavras-chave / hashtags")).toBeInTheDocument();
    expect(screen.getByText("Legenda final revisada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar como publicado" })).toBeInTheDocument();
  });

  it("salva rascunho automaticamente (debounce) ao editar o CTA", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<AgendamentoWorkspace item={makeItem()} campaigns={campaigns} products={products} />);

    await user.type(document.getElementById("cta")!, "Arraste para saber mais");
    expect(saveSchedulingDraftMock).not.toHaveBeenCalled();

    await advance(1000);
    await waitFor(() => expect(saveSchedulingDraftMock).toHaveBeenCalledTimes(1));
    expect(saveSchedulingDraftMock.mock.calls[0][0]).toBe("item-1");
    expect(saveSchedulingDraftMock.mock.calls[0][1]).toMatchObject({ cta: "Arraste para saber mais" });
  });

  it("abre o diálogo de 'marcar como publicado' e exige data/hora real", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<AgendamentoWorkspace item={makeItem()} campaigns={campaigns} products={products} />);

    await user.click(screen.getByRole("button", { name: "Marcar como publicado" }));
    expect(screen.getByText("Marcar como publicado", { selector: "h2, [role=heading]" })).toBeInTheDocument();

    const dateInput = document.getElementById("publishedAt") as HTMLInputElement;
    expect(dateInput).toBeRequired();
  });

  it("publicar com sucesso atualiza o status exibido e mostra alerta se faltar URL", async () => {
    markAsPublishedMock.mockResolvedValue({
      success: true,
      item: makeItem({ status: "published", published_at: "2026-09-05T18:00:00.000Z", published_url: null }),
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<AgendamentoWorkspace item={makeItem()} campaigns={campaigns} products={products} />);

    await user.click(screen.getByRole("button", { name: "Marcar como publicado" }));
    await user.click(screen.getByRole("button", { name: "Marcar como publicado" }));

    await waitFor(() => expect(markAsPublishedMock).toHaveBeenCalledWith("item-1", expect.any(Object)));
    await waitFor(() => expect(screen.getByText(/^Publicado em/)).toBeInTheDocument());
    expect(screen.getByText("Publicado sem URL do post — adicione o link assim que possível.")).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("erro ao publicar mantém o botão de publicar visível e mostra a mensagem", async () => {
    markAsPublishedMock.mockResolvedValue({ error: "Informe a data e hora reais de publicação." });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<AgendamentoWorkspace item={makeItem()} campaigns={campaigns} products={products} />);

    await user.click(screen.getByRole("button", { name: "Marcar como publicado" }));
    await user.click(screen.getByRole("button", { name: "Marcar como publicado" }));

    await waitFor(() => expect(screen.getByText("Informe a data e hora reais de publicação.")).toBeInTheDocument());
    expect(screen.queryByText(/^Publicado/)).not.toBeInTheDocument();
  });
});
