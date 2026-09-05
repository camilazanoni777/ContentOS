import { describe, expect, it, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TeleprompterView } from "./teleprompter-view";
import {
  TELEPROMPTER_FONT_SIZE_DEFAULT,
  TELEPROMPTER_FONT_SIZE_STEP,
  TELEPROMPTER_SPEED_DEFAULT,
  TELEPROMPTER_SPEED_STEP,
} from "@/lib/teleprompter";

describe("TeleprompterView", () => {
  afterEach(() => {
    // Pausa qualquer teste que tenha deixado a rolagem automática ligada,
    // antes do cleanup desmontar o componente (evita warnings de act()).
    cleanup();
  });

  it("mostra o texto do roteiro e o botão para iniciar a leitura", () => {
    render(<TeleprompterView title="Reel de rotina" text="Fala 1. Fala 2." backHref="/roteiros/item-1" />);
    expect(screen.getByText("Fala 1. Fala 2.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar" })).toBeInTheDocument();
  });

  it("mostra estado vazio quando não há roteiro escrito ainda", () => {
    render(<TeleprompterView title="Reel de rotina" text="" backHref="/roteiros/item-1" />);
    expect(screen.getByText("Nenhum roteiro escrito ainda.")).toBeInTheDocument();
  });

  it('alterna entre "Iniciar" e "Pausar" ao clicar no botão de reprodução', async () => {
    const user = userEvent.setup();
    render(<TeleprompterView title="Reel de rotina" text="Texto" backHref="/roteiros/item-1" />);

    await user.click(screen.getByRole("button", { name: "Iniciar" }));
    expect(screen.getByRole("button", { name: "Pausar" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Pausar" }));
    expect(screen.getByRole("button", { name: "Iniciar" })).toBeInTheDocument();
  });

  it("ajusta a fonte com os botões de aumentar/diminuir, respeitando os limites configurados", async () => {
    const user = userEvent.setup();
    render(<TeleprompterView title="Reel de rotina" text="Texto" backHref="/roteiros/item-1" />);

    expect(screen.getByText(`${TELEPROMPTER_FONT_SIZE_DEFAULT}px`)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Aumentar fonte" }));
    expect(screen.getByText(`${TELEPROMPTER_FONT_SIZE_DEFAULT + TELEPROMPTER_FONT_SIZE_STEP}px`)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Diminuir fonte" }));
    expect(screen.getByText(`${TELEPROMPTER_FONT_SIZE_DEFAULT}px`)).toBeInTheDocument();
  });

  it("ajusta a velocidade com os botões de aumentar/diminuir", async () => {
    const user = userEvent.setup();
    render(<TeleprompterView title="Reel de rotina" text="Texto" backHref="/roteiros/item-1" />);

    expect(screen.getByText(`${TELEPROMPTER_SPEED_DEFAULT}px/s`)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Aumentar velocidade" }));
    expect(screen.getByText(`${TELEPROMPTER_SPEED_DEFAULT + TELEPROMPTER_SPEED_STEP}px/s`)).toBeInTheDocument();
  });

  it("espelha o texto ao clicar em Espelhar texto", async () => {
    const user = userEvent.setup();
    render(<TeleprompterView title="Reel de rotina" text="Texto espelhável" backHref="/roteiros/item-1" />);

    const mirrorButton = screen.getByRole("button", { name: "Espelhar texto" });
    expect(mirrorButton).toHaveAttribute("aria-pressed", "false");

    await user.click(mirrorButton);
    expect(mirrorButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Texto espelhável")).toHaveStyle({ transform: "scaleX(-1)" });
  });

  it('o botão "Fechar teleprompter" volta para o workspace do roteiro', () => {
    render(<TeleprompterView title="Reel de rotina" text="Texto" backHref="/roteiros/item-42" />);
    expect(screen.getByRole("link", { name: "Fechar teleprompter" })).toHaveAttribute("href", "/roteiros/item-42");
  });
});
