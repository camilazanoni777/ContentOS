import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TodayContentList } from "./today-content-list";
import type { ContentItem } from "@/types/domain";

describe("TodayContentList", () => {
  it("renderiza estado vazio com ações para ideias e calendário", () => {
    render(<TodayContentList items={[]} />);

    expect(screen.getByText("Nada na pauta para hoje")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /banco de ideias/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver calendário/i })).toBeInTheDocument();
  });

  it("renderiza conteúdos com seus botões de ação contextuais", () => {
    const items: ContentItem[] = [
      {
        id: "c1",
        user_id: "u1",
        account_id: "a1",
        campaign_id: null,
        format: "reels",
        pillar: "Autoridade",
        title: "Reel de Posicionamento",
        hook: null,
        cta: null,
        notes: null,
        status: "ready_to_record",
        planned_at: "2026-09-05T10:00:00Z",
        recorded_at: null,
        published_at: null,
        published_url: null,
        archived_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as ContentItem,
      {
        id: "c2",
        user_id: "u1",
        account_id: "a1",
        campaign_id: null,
        format: "carousel",
        pillar: "Educação",
        title: "Carrossel de Dicas",
        hook: null,
        cta: null,
        notes: null,
        status: "published",
        planned_at: "2026-09-05T14:00:00Z",
        recorded_at: null,
        published_at: "2026-09-05T14:30:00Z",
        published_url: null,
        archived_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as ContentItem,
    ];

    render(<TodayContentList items={items} />);

    expect(screen.getByText("Reel de Posicionamento")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gravar agora/i })).toHaveAttribute("href", "/gravacao?item=c1");

    expect(screen.getByText("Carrossel de Dicas")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /registrar métricas/i })).toHaveAttribute("href", "/metricas/conteudos");
  });
});
