import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

const saveCheckinDraftMock = vi.fn();
const saveNightClosingMock = vi.fn();

vi.mock("@/lib/actions/checkin", () => ({
  saveCheckinDraft: (...args: unknown[]) => saveCheckinDraftMock(...args),
  saveNightClosing: (...args: unknown[]) => saveNightClosingMock(...args),
}));

import { CheckinForm } from "./checkin-form";
import type { DailyCheckin } from "@/types/domain";

function baseProps() {
  return { initialCheckin: null as DailyCheckin | null, contentItems: [], products: [], campaigns: [], goals: [] };
}

describe("CheckinForm", () => {
  beforeEach(() => {
    saveCheckinDraftMock.mockReset().mockResolvedValue({
      success: true,
      checkin: { id: "c1", night_closed_at: null } as unknown as DailyCheckin,
      savedAt: new Date().toISOString(),
    });
    saveNightClosingMock.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("não salva nada ao abrir a tela (só quando a usuária digita algo)", async () => {
    render(<CheckinForm {...baseProps()} />);
    await advance(2000);
    expect(saveCheckinDraftMock).not.toHaveBeenCalled();
  });

  it("salva automaticamente (com debounce) ao editar o objetivo do dia", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CheckinForm {...baseProps()} />);

    await user.type(screen.getByLabelText("Objetivo principal de hoje"), "Gravar reel");

    await advance(1000);

    await waitFor(() => expect(saveCheckinDraftMock).toHaveBeenCalled());
    const lastCall = saveCheckinDraftMock.mock.calls.at(-1)?.[0];
    expect(lastCall).toMatchObject({ objectiveMain: "Gravar reel" });
  });

  it('o botão "Concluir o dia" chama saveNightClosing com os valores atuais da tela', async () => {
    saveNightClosingMock.mockResolvedValue({
      success: true,
      checkin: { id: "c1", night_closed_at: "2026-09-03T22:00:00.000Z" } as unknown as DailyCheckin,
      savedAt: new Date().toISOString(),
    });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CheckinForm {...baseProps()} />);

    await user.type(screen.getByLabelText("Principal vitória do dia"), "Publiquei o reel");
    await user.click(screen.getByRole("button", { name: "Concluir o dia" }));

    await waitFor(() => expect(saveNightClosingMock).toHaveBeenCalled());
    expect(saveNightClosingMock.mock.calls.at(-1)?.[0]).toMatchObject({ eveningWins: "Publiquei o reel" });
    expect(await screen.findByText(/Fechamento concluído às/)).toBeInTheDocument();
  });

  it("mostra o erro do fechamento noturno sem travar a tela", async () => {
    saveNightClosingMock.mockResolvedValue({ error: "Não foi possível salvar o fechamento noturno." });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CheckinForm {...baseProps()} />);

    await user.click(screen.getByRole("button", { name: "Concluir o dia" }));

    expect(await screen.findByText("Não foi possível salvar o fechamento noturno.")).toBeInTheDocument();
  });

  it("permite alternar entre os modos Planejamento e Encerramento preservando os dados digitados", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CheckinForm {...baseProps()} />);

    // Digita no planejamento
    await user.type(screen.getByLabelText("Objetivo principal de hoje"), "Gravar 2 reels");

    // Alterna para encerramento
    await user.click(screen.getByRole("tab", { name: /encerramento \(noite\)/i }));
    await user.type(screen.getByLabelText("Principal vitória do dia"), "Tudo gravado!");

    // Volta para planejamento e verifica que o objetivo digitado continua lá
    await user.click(screen.getByRole("tab", { name: /planejamento \(manhã\)/i }));
    expect(screen.getByLabelText("Objetivo principal de hoje")).toHaveValue("Gravar 2 reels");
  });
});
