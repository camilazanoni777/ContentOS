import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { StatCard } from "./stat-card";

describe("StatCard", () => {
  it("mostra o valor quando presente", () => {
    render(<StatCard label="Publicações" value={12} />);
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("regra crítica: mostra travessão, nunca 0, quando o valor é null", () => {
    render(<StatCard label="Alcance médio" value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("regra crítica: mostra travessão quando o valor é undefined", () => {
    render(<StatCard label="Seguidores ganhos" value={undefined} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
