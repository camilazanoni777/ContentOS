import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyFocus } from "./daily-focus";
import type { CheckinPriority, ContentItem, DailyAction, Goal } from "@/types/domain";

describe("DailyFocus", () => {
  const mockContent = new Map<string, ContentItem>([
    [
      "item-1",
      {
        id: "item-1",
        user_id: "u1",
        account_id: "a1",
        campaign_id: null,
        format: "reels",
        pillar: "Autoridade",
        title: "Reel Estratégico",
        hook: "Gancho",
        cta: null,
        notes: null,
        status: "scripting",
        planned_at: null,
        recorded_at: null,
        published_at: null,
        published_url: null,
        archived_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as ContentItem,
    ],
  ]);

  const mockGoals = new Map<string, Goal>([
    [
      "g1",
      {
        id: "g1",
        user_id: "u1",
        metric: "10k seguidores",
        period_type: "monthly",
        period_start: "2026-09-01",
        period_end: "2026-09-30",
        target_value: 10000,
        initial_value: 8000,
        achieved_value: 8500,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  ]);

  const mockActions: DailyAction[] = [
    {
      id: "a1",
      user_id: "u1",
      checkin_id: null,
      checklist_item_id: null,
      action_date: "2026-09-05",
      title: "Publicar stories da manhã",
      is_done: true,
      is_active: true,
      sort_order: 1,
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "a2",
      user_id: "u1",
      checkin_id: null,
      checklist_item_id: null,
      action_date: "2026-09-05",
      title: "Responder comentários",
      is_done: false,
      is_active: true,
      sort_order: 2,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it("exibe o objetivo do dia e as prioridades vinculadas", () => {
    const priorities: CheckinPriority[] = [
      { label: "Gravar e revisar roteiro", contentItemId: "item-1", goalId: "g1" },
    ];

    render(
      <DailyFocus
        todayObjective="Atingir meta de 3 Reels na semana"
        priorities={priorities}
        contentById={mockContent}
        goalById={mockGoals}
        monthlyGoal={mockGoals.get("g1")!}
        actions={mockActions}
        hasCheckin={true}
        nightClosed={false}
        nightClosedAt={null}
      />,
    );

    expect(screen.getByText(/Atingir meta de 3 Reels na semana/)).toBeInTheDocument();
    expect(screen.getByText("Gravar e revisar roteiro")).toBeInTheDocument();
    expect(screen.getByText(/Etapa: Reel Estratégico/)).toBeInTheDocument();
    expect(screen.getByText(/Meta: 10k seguidores/)).toBeInTheDocument();
    expect(screen.getByText("1/2 (50%)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /continuar check-in/i })).toBeInTheDocument();
  });

  it("mostra botão para iniciar check-in quando ainda não foi feito", () => {
    render(
      <DailyFocus
        todayObjective={null}
        priorities={[]}
        contentById={new Map()}
        goalById={new Map()}
        monthlyGoal={null}
        actions={[]}
        hasCheckin={false}
        nightClosed={false}
        nightClosedAt={null}
      />,
    );

    expect(screen.getByText(/nenhum objetivo definido ainda/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /fazer check-in do dia/i })).toBeInTheDocument();
  });

  it("mostra badge de dia concluído quando o fechamento noturno foi realizado", () => {
    render(
      <DailyFocus
        todayObjective="Finalizar edições"
        priorities={[]}
        contentById={new Map()}
        goalById={new Map()}
        monthlyGoal={null}
        actions={mockActions}
        hasCheckin={true}
        nightClosed={true}
        nightClosedAt="2026-09-05T21:30:00Z"
      />,
    );

    expect(screen.getByText(/Dia concluído/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver resumo do check-in/i })).toBeInTheDocument();
  });
});
