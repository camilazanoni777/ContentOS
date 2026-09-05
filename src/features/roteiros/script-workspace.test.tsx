import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

const saveScriptDraftMock = vi.fn();
const saveScriptVersionNowMock = vi.fn();
const moveScriptStatusMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("@/lib/actions/script", () => ({
  saveScriptDraft: (...args: unknown[]) => saveScriptDraftMock(...args),
  saveScriptVersionNow: (...args: unknown[]) => saveScriptVersionNowMock(...args),
  moveScriptStatus: (...args: unknown[]) => moveScriptStatusMock(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import { ScriptWorkspace } from "./script-workspace";
import type { ContentItem, ContentScriptVersion } from "@/types/domain";

function makeItem(overrides: Partial<ContentItem> = {}): ContentItem {
  return {
    id: "item-1",
    user_id: "user-1",
    account_id: null,
    title: "Reel sobre rotina matinal",
    hook: null,
    summary: null,
    script: null,
    caption: null,
    format: "reel",
    pillar: "Rotina",
    objective: "engajamento",
    cta: null,
    priority: "media",
    status: "scripting",
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

function makeVersion(overrides: Partial<ContentScriptVersion> = {}): ContentScriptVersion {
  return {
    id: "v1",
    user_id: "user-1",
    content_item_id: "item-1",
    snapshot: {
      hook: "Gancho salvo",
      hookVariations: [],
      script: "Roteiro da versão salva",
      scriptStructure: [],
      onScreenText: null,
      shotList: [],
      caption: null,
      estimatedDurationSeconds: null,
    },
    created_at: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("ScriptWorkspace", () => {
  beforeEach(() => {
    saveScriptDraftMock.mockReset().mockResolvedValue({ success: true, item: makeItem() });
    saveScriptVersionNowMock.mockReset().mockResolvedValue({ success: true, item: makeItem() });
    moveScriptStatusMock.mockReset().mockResolvedValue({ success: true, item: makeItem() });
    refreshMock.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renderiza as seções principais do workspace", () => {
    render(<ScriptWorkspace item={makeItem()} versions={[]} />);
    expect(screen.getByText("Briefing do conteúdo")).toBeInTheDocument();
    expect(screen.getByText("Ganchos")).toBeInTheDocument();
    expect(screen.getByLabelText(/Gancho escolhido/)).toBeInTheDocument();
    expect(screen.getByText("Promessa clara")).toBeInTheDocument();
  });

  it("salva rascunho automaticamente (debounce) ao editar o roteiro completo", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ScriptWorkspace item={makeItem()} versions={[]} />);

    await user.type(document.getElementById("script")!, "Fala 1");

    await advance(1000);

    await waitFor(() => expect(saveScriptDraftMock).toHaveBeenCalled());
    const [id, payload] = saveScriptDraftMock.mock.calls.at(-1) ?? [];
    expect(id).toBe("item-1");
    expect(payload).toMatchObject({ script: "Fala 1" });
  });

  it('"Voltar para Pesquisando" salva o rascunho e move o status para a etapa anterior', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ScriptWorkspace item={makeItem({ status: "scripting" })} versions={[]} />);

    await user.click(screen.getByRole("button", { name: "Voltar para Pesquisando" }));

    await waitFor(() => expect(moveScriptStatusMock).toHaveBeenCalledWith("item-1", "researching"));
    expect(saveScriptDraftMock).toHaveBeenCalled();
    expect(refreshMock).toHaveBeenCalled();
  });

  it('desabilita "Voltar etapa" quando já está no primeiro status do pipeline', () => {
    render(<ScriptWorkspace item={makeItem({ status: "idea" })} versions={[]} />);
    expect(screen.getByRole("button", { name: "Voltar etapa" })).toBeDisabled();
  });

  it('"Marcar como pronto para gravar" move o status para ready_to_record', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ScriptWorkspace item={makeItem({ status: "scripting" })} versions={[]} />);

    await user.click(screen.getByRole("button", { name: "Marcar como pronto para gravar" }));

    await waitFor(() => expect(moveScriptStatusMock).toHaveBeenCalledWith("item-1", "ready_to_record"));
  });

  it('o botão de status vira "Já está pronto para gravar" quando o conteúdo já está pronto para gravar', () => {
    render(<ScriptWorkspace item={makeItem({ status: "ready_to_record" })} versions={[]} />);
    expect(screen.getByRole("button", { name: "Já está pronto para gravar" })).toBeDisabled();
  });

  it('"Salvar rascunho" chama saveScriptVersionNow com os valores atuais da tela', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ScriptWorkspace item={makeItem()} versions={[]} />);

    await user.type(document.getElementById("hook")!, "Gancho novo");
    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    await waitFor(() => expect(saveScriptVersionNowMock).toHaveBeenCalled());
    const [id, payload] = saveScriptVersionNowMock.mock.calls.at(-1) ?? [];
    expect(id).toBe("item-1");
    expect(payload).toMatchObject({ hook: "Gancho novo" });
  });

  it("restaurar uma versão do histórico preenche o roteiro com o snapshot salvo", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ScriptWorkspace item={makeItem({ script: "Roteiro atual" })} versions={[makeVersion()]} />);

    await user.click(screen.getByRole("button", { name: "Restaurar esta versão" }));

    await waitFor(() => {
      expect((document.getElementById("script") as HTMLTextAreaElement).value).toBe("Roteiro da versão salva");
    });
    expect((document.getElementById("hook") as HTMLTextAreaElement).value).toBe("Gancho salvo");
  });

  it("link do modo teleprompter aponta para /roteiros/[id]/teleprompter", () => {
    render(<ScriptWorkspace item={makeItem()} versions={[]} />);
    expect(screen.getByRole("link", { name: /Abrir modo teleprompter/ })).toHaveAttribute(
      "href",
      "/roteiros/item-1/teleprompter",
    );
  });
});
