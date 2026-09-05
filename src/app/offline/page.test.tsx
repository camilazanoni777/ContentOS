import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import OfflinePage from "./page";
import * as diagnosticModule from "@/lib/connection-diagnostic";

describe("OfflinePage — renderização e recuperação", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    pushMock.mockReset();
  });

  it("renderiza a identidade do produto, título sans-serif e aviso de que não salva rascunhos", () => {
    render(<OfflinePage />);

    expect(screen.getByText("Cami Content OS")).toBeInTheDocument();
    expect(screen.getByText("Você está offline")).toBeInTheDocument();
    expect(
      screen.getByText(/nenhuma alteração é salva offline/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Tentar novamente/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Acessar tela de login/i }),
    ).toBeInTheDocument();
  });

  it("ao clicar em 'Tentar novamente' executa teste e exibe feedback de sucesso quando conectado", async () => {
    vi.spyOn(diagnosticModule, "testConnection").mockResolvedValue({
      state: "online",
      title: "Conectado",
      message: "Conexão restabelecida",
      actionText: "Prosseguir",
      canRetry: false,
    });

    render(<OfflinePage />);

    const retryBtn = screen.getByRole("button", { name: /Tentar novamente/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Conexão restabelecida!/i),
      ).toBeInTheDocument();
    });
  });

  it("ao clicar em 'Tentar novamente' e falhar, exibe mensagem diagnóstica clara", async () => {
    vi.spyOn(diagnosticModule, "testConnection").mockResolvedValue({
      state: "server_unreachable",
      title: "Servidor indisponível",
      message: "O servidor local não está respondendo na porta 3001.",
      actionText: "Tentar novamente",
      canRetry: true,
    });

    render(<OfflinePage />);

    const retryBtn = screen.getByRole("button", { name: /Tentar novamente/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText(/Servidor indisponível/i)).toBeInTheDocument();
      expect(
        screen.getByText(/não está respondendo na porta 3001/i),
      ).toBeInTheDocument();
    });
  });
});
