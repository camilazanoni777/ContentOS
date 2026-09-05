import { describe, expect, it } from "vitest";
import { calculateChecklistCompletion } from "./checklist";

function action(overrides: { is_active?: boolean; is_done?: boolean } = {}) {
  return { is_active: overrides.is_active ?? true, is_done: overrides.is_done ?? false };
}

describe("calculateChecklistCompletion", () => {
  it("retorna null (não zero) quando não há nenhuma ação ativa", () => {
    expect(calculateChecklistCompletion([])).toEqual({ active: 0, done: 0, percent: null });
    expect(
      calculateChecklistCompletion([action({ is_active: false }), action({ is_active: false, is_done: true })]),
    ).toEqual({ active: 0, done: 0, percent: null });
  });

  it("calcula o percentual usando apenas ações ativas", () => {
    const actions = [
      action({ is_done: true }),
      action({ is_done: true }),
      action({ is_done: false }),
      action({ is_done: false, is_active: false }), // desativada: não conta no denominador
    ];
    expect(calculateChecklistCompletion(actions)).toEqual({ active: 3, done: 2, percent: 67 });
  });

  it("100% quando todas as ações ativas estão concluídas", () => {
    const actions = [action({ is_done: true }), action({ is_done: true })];
    expect(calculateChecklistCompletion(actions)).toEqual({ active: 2, done: 2, percent: 100 });
  });

  it("0% quando nenhuma ação ativa está concluída", () => {
    const actions = [action({ is_done: false }), action({ is_done: false })];
    expect(calculateChecklistCompletion(actions)).toEqual({ active: 2, done: 0, percent: 0 });
  });

  it("arredonda o percentual para o inteiro mais próximo", () => {
    const actions = [action({ is_done: true }), action(), action(), action()];
    // 1/4 = 25% exato; testa também um caso que arredonda (1/3 ≈ 33%)
    expect(calculateChecklistCompletion(actions).percent).toBe(25);
    expect(calculateChecklistCompletion(actions.slice(0, 3)).percent).toBe(33);
  });
});
