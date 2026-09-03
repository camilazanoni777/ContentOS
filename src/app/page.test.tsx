import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import Home from "./page";

describe("Página inicial", () => {
  it("mostra o nome do produto e as etapas do fluxo de produção", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "Cami Content OS" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Capturar ideia")).toBeInTheDocument();
    expect(screen.getByText("Reaproveitar")).toBeInTheDocument();
  });
});
