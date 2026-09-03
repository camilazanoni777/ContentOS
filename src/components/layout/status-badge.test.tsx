import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";

describe("StatusBadge", () => {
  it("mostra o rótulo em texto de cada status (nunca só a cor)", () => {
    render(<StatusBadge status="published" />);
    expect(screen.getByText("Publicado")).toBeInTheDocument();
  });

  it("renderiza um ícone junto do texto (status identificável por texto + cor + ícone)", () => {
    const { container } = render(<StatusBadge status="idea" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("Ideia")).toBeInTheDocument();
  });
});

describe("PriorityBadge", () => {
  it("mostra o rótulo conhecido para um valor de prioridade padrão", () => {
    render(<PriorityBadge priority="alta" />);
    expect(screen.getByText("Alta prioridade")).toBeInTheDocument();
  });

  it("não quebra com um valor de prioridade fora da convenção padrão", () => {
    render(<PriorityBadge priority="urgentíssimo" />);
    expect(screen.getByText("urgentíssimo")).toBeInTheDocument();
  });

  it("não renderiza nada quando a prioridade é null", () => {
    const { container } = render(<PriorityBadge priority={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
