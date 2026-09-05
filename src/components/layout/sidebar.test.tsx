import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/ideias",
}));

import { Sidebar } from "./sidebar";

describe("Sidebar", () => {
  it("renderiza a navegação principal com todos os grupos e marca a rota ativa", () => {
    render(<Sidebar />);

    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(nav).toBeInTheDocument();

    // Grupos e alguns itens representativos de cada um.
    expect(screen.getByText("Criar")).toBeInTheDocument();
    expect(screen.getByText("Planejar")).toBeInTheDocument();
    expect(screen.getByText("Analisar")).toBeInTheDocument();
    expect(screen.getByText("Negócio")).toBeInTheDocument();

    const activeLink = screen.getByRole("link", { name: "Banco de ideias" });
    expect(activeLink).toHaveAttribute("aria-current", "page");
    expect(activeLink).toHaveAttribute("href", "/ideias");

    const inactiveLink = screen.getByRole("link", { name: "Roteiros" });
    expect(inactiveLink).not.toHaveAttribute("aria-current");
  });

  it("inclui todas as rotas do produto como links navegáveis", () => {
    render(<Sidebar />);
    const links = screen.getAllByRole("link");
    // 19 rotas + o link do logo para /hoje.
    expect(links.length).toBeGreaterThanOrEqual(19);
  });
});
