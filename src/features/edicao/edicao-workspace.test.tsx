import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

const saveEditingDraftMock = vi.fn();
const advanceEditingStatusMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("@/lib/actions/editing", () => ({
  saveEditingDraft: (...args: unknown[]) => saveEditingDraftMock(...args),
  advanceEditingStatus: (...args: unknown[]) => advanceEditingStatusMock(...args),
  addReviewComment: vi.fn(),
  setReviewCommentStatus: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import { EdicaoWorkspace } from "./edicao-workspace";
import type { ContentItem } from "@/types/domain";

function makeItem(overrides: Partial<ContentItem> = {}): ContentItem {
  return {
    id: "item-1",
    user_id: "user-1",
    account_id: null,
    title: "Reel sobre rotina matinal",
    hook: "Gancho forte",
    summary: null,
    script: "Roteiro completo",
    caption: null,
    format: "reel",
    pillar: "Rotina",
    objective: "engajamento",
    cta: null,
    priority: "media",
    status: "recorded",
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

describe("EdicaoWorkspace", () => {
  beforeEach(() => {
    saveEditingDraftMock.mockReset().mockResolvedValue({ success: true, item: makeItem() });
    advanceEditingStatusMock.mockReset();
    refreshMock.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renderiza as seções principais do workspace", () => {
    render(<EdicaoWorkspace item={makeItem()} comments={[]} />);
    expect(screen.getByText("Arquivos")).toBeInTheDocument();
    expect(screen.getByText("Instruções de edição")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar referência" })).toBeInTheDocument();
    expect(screen.getByText("Gancho nos primeiros segundos")).toBeInTheDocument();
    expect(screen.getByText("Comentários / revisões")).toBeInTheDocument();
  });

  it("mostra o botão certo por status: recorded -> Iniciar edição", () => {
    render(<EdicaoWorkspace item={makeItem({ status: "recorded" })} comments={[]} />);
    expect(screen.getByRole("button", { name: "Iniciar edição" })).toBeInTheDocument();
  });

  it("mostra o botão certo por status: editing -> Enviar para aprovação", () => {
    render(<EdicaoWorkspace item={makeItem({ status: "editing" })} comments={[]} />);
    expect(screen.getByRole("button", { name: "Enviar para aprovação" })).toBeInTheDocument();
  });

  it("mostra o botão certo por status: awaiting_approval -> Aprovar", () => {
    render(<EdicaoWorkspace item={makeItem({ status: "awaiting_approval" })} comments={[]} />);
    expect(screen.getByRole("button", { name: "Aprovar" })).toBeInTheDocument();
  });

  it("clicar em avançar chama advanceEditingStatus e atualiza o status exibido", async () => {
    advanceEditingStatusMock.mockResolvedValue({ success: true, item: makeItem({ status: "editing" }) });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<EdicaoWorkspace item={makeItem({ status: "recorded" })} comments={[]} />);

    await user.click(screen.getByRole("button", { name: "Iniciar edição" }));

    await waitFor(() => expect(advanceEditingStatusMock).toHaveBeenCalledWith("item-1", "recorded", expect.any(Object)));
    expect(screen.getByText("Status atual: Editando")).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("erro ao avançar mantém o status atual e mostra a mensagem", async () => {
    advanceEditingStatusMock.mockResolvedValue({ error: "Não foi possível avançar a etapa." });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<EdicaoWorkspace item={makeItem({ status: "recorded" })} comments={[]} />);

    await user.click(screen.getByRole("button", { name: "Iniciar edição" }));

    await waitFor(() => expect(screen.getByText("Não foi possível avançar a etapa.")).toBeInTheDocument());
    expect(screen.getByText("Status atual: Gravado")).toBeInTheDocument();
  });

  it("salva rascunho automaticamente (debounce) ao editar as instruções de edição", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<EdicaoWorkspace item={makeItem()} comments={[]} />);

    await user.type(document.getElementById("editInstructions")!, "Cortar pausas longas");
    expect(saveEditingDraftMock).not.toHaveBeenCalled();

    await advance(1000);
    await waitFor(() => expect(saveEditingDraftMock).toHaveBeenCalledTimes(1));
    expect(saveEditingDraftMock.mock.calls[0][0]).toBe("item-1");
    expect(saveEditingDraftMock.mock.calls[0][1]).toMatchObject({ editInstructions: "Cortar pausas longas" });
  });

  it("sem próxima etapa (published) não mostra botão de avançar", () => {
    render(<EdicaoWorkspace item={makeItem({ status: "published" })} comments={[]} />);
    expect(screen.queryByRole("button", { name: /Iniciar edição|Enviar para aprovação|Aprovar/ })).not.toBeInTheDocument();
  });
});
