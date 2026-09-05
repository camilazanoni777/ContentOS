import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const markAsRecordedMock = vi.fn();
const saveRecordingChecklistMock = vi.fn();
const addItemsToSessionMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("@/lib/actions/recording", () => ({
  markAsRecorded: (...args: unknown[]) => markAsRecordedMock(...args),
  saveRecordingChecklist: (...args: unknown[]) => saveRecordingChecklistMock(...args),
  addItemsToSession: (...args: unknown[]) => addItemsToSessionMock(...args),
  removeItemFromSession: vi.fn(),
  reorderSessionItems: vi.fn(),
  createSession: vi.fn(),
  updateSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import { GravacaoWorkspace } from "./gravacao-workspace";
import type { ContentItem } from "@/types/domain";

function makeItem(overrides: Partial<ContentItem> = {}): ContentItem {
  return {
    id: "item-1",
    user_id: "user-1",
    account_id: null,
    title: "Reel sobre rotina matinal",
    hook: "Gancho forte",
    summary: null,
    script: null,
    caption: null,
    format: "reel",
    pillar: "Rotina",
    objective: "engajamento",
    cta: null,
    priority: "alta",
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
    recording_notes: "Gravar perto da janela.",
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

describe("GravacaoWorkspace", () => {
  beforeEach(() => {
    markAsRecordedMock.mockReset();
    saveRecordingChecklistMock.mockReset().mockResolvedValue({ success: true, item: makeItem() });
    addItemsToSessionMock.mockReset();
    refreshMock.mockReset();
  });

  it("modo lista mostra as notas de gravação do item", () => {
    render(<GravacaoWorkspace initialItems={[makeItem()]} initialSessions={[]} initialSessionItems={[]} />);
    expect(screen.getByText("Gravar perto da janela.")).toBeInTheDocument();
  });

  it("alterna para o modo cards", async () => {
    const user = userEvent.setup();
    render(<GravacaoWorkspace initialItems={[makeItem()]} initialSessions={[]} initialSessionItems={[]} />);
    await user.click(screen.getByRole("button", { name: /Cards/ }));
    // No modo cards o hook aparece (não aparece no modo lista).
    expect(screen.getByText("Gancho forte")).toBeInTheDocument();
  });

  it("marcar como gravado chama a action e atualiza o item para 'Gravado'", async () => {
    markAsRecordedMock.mockResolvedValue({ success: true, item: makeItem({ status: "recorded" }) });
    const user = userEvent.setup();
    render(<GravacaoWorkspace initialItems={[makeItem()]} initialSessions={[]} initialSessionItems={[]} />);

    await user.click(screen.getByRole("button", { name: "Marcar como gravado" }));

    await waitFor(() => expect(markAsRecordedMock).toHaveBeenCalledWith("item-1"));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Marcar como gravado" })).not.toBeInTheDocument());
  });

  it("expandir o checklist de gravação e marcar um item salva via saveRecordingChecklist", async () => {
    const user = userEvent.setup();
    render(<GravacaoWorkspace initialItems={[makeItem()]} initialSessions={[]} initialSessionItems={[]} />);

    await user.click(screen.getByRole("button", { name: /Checklist 0\/8/ }));
    const checklistLabel = screen.getByText("Cenário pronto");
    const checkbox = within(checklistLabel.closest("label")!).getByRole("checkbox");
    await user.click(checkbox);

    await waitFor(() =>
      expect(saveRecordingChecklistMock).toHaveBeenCalledWith("item-1", expect.objectContaining({ scenario: true })),
    );
  });

  it("busca filtra a lista por título", async () => {
    const user = userEvent.setup();
    render(
      <GravacaoWorkspace
        initialItems={[makeItem({ id: "a", title: "Reel manhã" }), makeItem({ id: "b", title: "Carrossel receita" })]}
        initialSessions={[]}
        initialSessionItems={[]}
      />,
    );
    await user.type(screen.getByPlaceholderText("Buscar por título, gancho, pilar..."), "receita");
    expect(screen.queryByText("Reel manhã")).not.toBeInTheDocument();
    expect(screen.getByText("Carrossel receita")).toBeInTheDocument();
  });
});
