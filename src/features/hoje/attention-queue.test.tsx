import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AttentionQueue } from "./attention-queue";
import type { HojeActionableItem } from "@/lib/data/hoje";

describe("AttentionQueue", () => {
  it("renderiza estado positivo de celebração quando não há pendências", () => {
    render(<AttentionQueue items={[]} />);

    expect(screen.getByText("Tudo em dia!")).toBeInTheDocument();
    expect(screen.getByText("Zero pendências")).toBeInTheDocument();
  });

  it("renderiza itens atrasados e pendências de métricas com links", () => {
    const items: HojeActionableItem[] = [
      { id: "i1", title: "Reel atrasado para gravação", type: "atrasado", status: "ready_to_record" },
      { id: "i2", title: "Carrossel sem métricas de 48h", type: "metrica_pendente", status: null },
    ];

    render(<AttentionQueue items={items} />);

    expect(screen.getByText("Reel atrasado para gravação")).toBeInTheDocument();
    expect(screen.getByText("Atrasado")).toBeInTheDocument();
    expect(screen.getByText("Carrossel sem métricas de 48h")).toBeInTheDocument();
    expect(screen.getByText("Métricas pendentes")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /resolver/i })).toHaveLength(2);
  });
});
