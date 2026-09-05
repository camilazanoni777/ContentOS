import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const getSearchParamsMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
  useSearchParams: () => ({
    get: (key: string) => getSearchParamsMock(key),
  }),
}));

const signInMock = vi.fn();
const signUpMock = vi.fn();

vi.mock("@/lib/auth/actions", () => ({
  signInWithPassword: (...args: unknown[]) => signInMock(...args),
  signUpWithPassword: (...args: unknown[]) => signUpMock(...args),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSearchParamsMock.mockReturnValue(null);
  });

  it("renderiza os campos de e-mail e senha no modo login", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar na plataforma" })).toBeInTheDocument();
  });

  it("permite alternar entre os modos 'Entrar' e 'Criar conta'", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const criarContaTab = screen.getByRole("button", { name: "Criar conta" });
    await user.click(criarContaTab);

    expect(screen.getByRole("button", { name: "Criar minha conta" })).toBeInTheDocument();
    expect(screen.getByText("Mínimo 8 caracteres")).toBeInTheDocument();
  });

  it("alterna a visibilidade da senha ao clicar no botão de olho", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText("Senha");
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = screen.getByRole("button", { name: "Ver senha" });
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ocultar senha" })).toBeInTheDocument();
  });

  it("submete com sucesso e redireciona para /hoje", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValueOnce({ success: true });

    render(<LoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "cami@exemplo.com");
    await user.type(screen.getByLabelText("Senha"), "senha12345");
    await user.click(screen.getByRole("button", { name: "Entrar na plataforma" }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith({
        email: "cami@exemplo.com",
        password: "senha12345",
      });
      expect(pushMock).toHaveBeenCalledWith("/hoje");
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("exibe mensagem de erro quando o login falha", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValueOnce({ error: "Credenciais inválidas." });

    render(<LoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "errado@exemplo.com");
    await user.type(screen.getByLabelText("Senha"), "senhaerrada");
    await user.click(screen.getByRole("button", { name: "Entrar na plataforma" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Credenciais inválidas.");
    });
  });
});
