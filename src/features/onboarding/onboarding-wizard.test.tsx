import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardingWizard } from "./onboarding-wizard";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

const createInstagramAccountActionMock = vi.fn();
const saveSettingsActionMock = vi.fn();
const createQuickContentIdeaMock = vi.fn();

vi.mock("@/lib/actions/configuracoes", () => ({
  createInstagramAccountAction: (...args: unknown[]) => createInstagramAccountActionMock(...args),
  saveSettingsAction: (...args: unknown[]) => saveSettingsActionMock(...args),
}));

vi.mock("@/lib/actions/content-items", () => ({
  createQuickContentIdea: (...args: unknown[]) => createQuickContentIdeaMock(...args),
}));

describe("OnboardingWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza a etapa inicial de boas-vindas com explicações do fluxo", () => {
    render(<OnboardingWizard />);

    expect(screen.getByText("Boas-vindas ao Cami Content OS")).toBeInTheDocument();
    expect(screen.getByText("Primeiro Acesso")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /começar configuração/i }),
    ).toBeInTheDocument();
  });

  it("avança para a etapa 2 e permite cadastrar a conta do Instagram", async () => {
    const user = userEvent.setup();
    createInstagramAccountActionMock.mockResolvedValueOnce({ success: true });

    render(<OnboardingWizard />);

    // Passo 1 -> Passo 2
    await user.click(screen.getByRole("button", { name: /começar configuração/i }));
    expect(screen.getByText("Conecte seu perfil do Instagram")).toBeInTheDocument();

    // Preenche formulário de conta
    const handleInput = screen.getByLabelText(/@ do instagram/i);
    await user.type(handleInput, "camilazanoni");

    const displayNameInput = screen.getByLabelText(/nome de exibição/i);
    await user.type(displayNameInput, "Camila Zanoni");

    // Submete
    await user.click(screen.getByRole("button", { name: /próximo: pilares editoriais/i }));

    await waitFor(() => {
      expect(createInstagramAccountActionMock).toHaveBeenCalledTimes(1);
      // Deve avançar para Passo 3 (Pilares)
      expect(screen.getByText("Defina seus pilares de conteúdo")).toBeInTheDocument();
    });
  });

  it("exibe erro se tentar avançar o passo 2 sem preencher o @", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);

    await user.click(screen.getByRole("button", { name: /começar configuração/i }));

    // Clica no botão de avançar com o handle vazio
    await user.click(screen.getByRole("button", { name: /próximo: pilares editoriais/i }));

    // Não deve chamar a Server Action
    expect(createInstagramAccountActionMock).not.toHaveBeenCalled();
  });

  it("permite salvar pilares e avançar para primeira ideia e conclusão", async () => {
    const user = userEvent.setup();
    createInstagramAccountActionMock.mockResolvedValueOnce({ success: true });
    saveSettingsActionMock.mockResolvedValueOnce({ success: true });
    createQuickContentIdeaMock.mockResolvedValueOnce({ success: true });

    render(<OnboardingWizard />);

    // Passo 1 -> Passo 2
    await user.click(screen.getByRole("button", { name: /começar configuração/i }));
    await user.type(screen.getByLabelText(/@ do instagram/i), "camilazanoni");
    await user.click(screen.getByRole("button", { name: /próximo: pilares editoriais/i }));

    // Passo 3 (Pilares)
    const proximaIdeiaBtn = await screen.findByRole("button", { name: /próximo: primeira ideia/i });
    await user.click(proximaIdeiaBtn);

    // Passo 4 (Ideia)
    await waitFor(() => {
      expect(screen.getByText("Cadastre sua primeira ideia")).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/título da ideia/i), "3 segredos de engajamento");
    await user.click(screen.getByRole("button", { name: /concluir configuração/i }));

    // Passo 5 (Pronto)
    await waitFor(() => {
      expect(createQuickContentIdeaMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "3 segredos de engajamento",
        }),
      );
      expect(screen.getByText("Tudo pronto para começar!")).toBeInTheDocument();
    });

    // Finalizar direciona para /hoje
    await user.click(screen.getByRole("button", { name: /ir para o painel hoje/i }));
    expect(pushMock).toHaveBeenCalledWith("/hoje");
    expect(refreshMock).toHaveBeenCalled();
  });
});
