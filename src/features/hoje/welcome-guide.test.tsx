import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WelcomeGuide } from "./welcome-guide";

describe("WelcomeGuide", () => {
  it("mostra os 3 cartões de ação quando o usuário ainda não fez nada", () => {
    render(<WelcomeGuide hasCheckinToday={false} hasIdeas={false} hasPlanned={false} />);

    expect(screen.getByText("Seu Content OS está pronto. Por onde começar hoje?")).toBeInTheDocument();
    expect(screen.getByText("1. Fazer Check-in do Dia")).toBeInTheDocument();
    expect(screen.getByText("2. Capturar Ideias")).toBeInTheDocument();
    expect(screen.getByText("3. Planejar a Semana")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /fazer check-in/i })).toHaveAttribute("href", "/checkin");
    expect(screen.getByRole("link", { name: /ver banco de ideias/i })).toHaveAttribute("href", "/ideias");
  });

  it("indica check-in concluído quando o usuário já fez check-in hoje", () => {
    render(<WelcomeGuide hasCheckinToday={true} hasIdeas={true} hasPlanned={false} />);

    expect(screen.getByText("Concluído hoje")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /fazer check-in/i })).not.toBeInTheDocument();
  });
});
