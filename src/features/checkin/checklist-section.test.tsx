import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const toggleChecklistActionMock = vi.fn();
const setChecklistActionActiveMock = vi.fn();
const addCustomChecklistItemMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("@/lib/actions/checkin", () => ({
  toggleChecklistAction: (...args: unknown[]) => toggleChecklistActionMock(...args),
  setChecklistActionActive: (...args: unknown[]) => setChecklistActionActiveMock(...args),
  addCustomChecklistItem: (...args: unknown[]) => addCustomChecklistItemMock(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import { ChecklistSection } from "./checklist-section";
import type { DailyAction } from "@/types/domain";

function makeAction(overrides: Partial<DailyAction> = {}): DailyAction {
  return {
    id: overrides.id ?? "action-1",
    user_id: "user-1",
    checkin_id: null,
    checklist_item_id: "item-1",
    action_date: "2026-09-03",
    title: overrides.title ?? "Gravei conteúdo",
    is_done: overrides.is_done ?? false,
    is_active: overrides.is_active ?? true,
    sort_order: overrides.sort_order ?? 0,
    completed_at: null,
    created_at: "2026-09-03T10:00:00Z",
    updated_at: "2026-09-03T10:00:00Z",
    ...overrides,
  };
}

describe("ChecklistSection", () => {
  beforeEach(() => {
    toggleChecklistActionMock.mockReset();
    setChecklistActionActiveMock.mockReset();
    addCustomChecklistItemMock.mockReset();
    refreshMock.mockReset();
  });

  it("mostra o percentual considerando apenas ações ativas", () => {
    const actions = [
      makeAction({ id: "a", title: "Gravei conteúdo", is_done: true }),
      makeAction({ id: "b", title: "Postei stories", is_done: false }),
      makeAction({ id: "c", title: "Trabalhei em campanha", is_done: false, is_active: false }),
    ];
    render(<ChecklistSection initialActions={actions} />);
    expect(screen.getByText("1/2 · 50%")).toBeInTheDocument();
  });

  it("marca um item otimisticamente antes da resposta do servidor", async () => {
    toggleChecklistActionMock.mockImplementation(() => new Promise(() => {})); // nunca resolve nesse teste
    const user = userEvent.setup();
    const actions = [makeAction({ id: "a", title: "Gravei conteúdo", is_done: false })];
    render(<ChecklistSection initialActions={actions} />);

    const checkbox = screen.getByLabelText("Gravei conteúdo");
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(toggleChecklistActionMock).toHaveBeenCalledWith("a", true);
  });

  it("desfaz a marcação (rollback) se o servidor recusar a mudança", async () => {
    toggleChecklistActionMock.mockResolvedValueOnce({ error: "Não foi possível salvar essa ação." });
    const user = userEvent.setup();
    const actions = [makeAction({ id: "a", title: "Gravei conteúdo", is_done: false })];
    render(<ChecklistSection initialActions={actions} />);

    const checkbox = screen.getByLabelText("Gravei conteúdo");
    await user.click(checkbox);

    // A chamada otimista aconteceu com o valor "marcado"...
    expect(toggleChecklistActionMock).toHaveBeenCalledWith("a", true);
    // ...mas como o servidor recusou, o estado final é desfeito (rollback).
    await waitFor(() => expect(checkbox).not.toBeChecked());
  });

  it("desativar um item some do denominador do percentual imediatamente (otimista)", async () => {
    setChecklistActionActiveMock.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    const actions = [
      makeAction({ id: "a", title: "Gravei conteúdo", is_done: true }),
      makeAction({ id: "b", title: "Trabalhei em campanha", is_done: false }),
    ];
    render(<ChecklistSection initialActions={actions} />);

    expect(screen.getByText("1/2 · 50%")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /Não se aplica hoje/i })[1]);

    expect(screen.getByText("1/1 · 100%")).toBeInTheDocument();
    expect(setChecklistActionActiveMock).toHaveBeenCalledWith("b", false);
  });

  it("adiciona um item personalizado e atualiza a rota", async () => {
    addCustomChecklistItemMock.mockResolvedValueOnce({ success: true });
    const user = userEvent.setup();
    render(<ChecklistSection initialActions={[]} />);

    await user.type(screen.getByLabelText("Adicionar item personalizado"), "Responder e-mails de parceria");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() =>
      expect(addCustomChecklistItemMock).toHaveBeenCalledWith({ label: "Responder e-mails de parceria" }),
    );
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });
});
