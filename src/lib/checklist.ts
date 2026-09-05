import type { DailyAction } from "@/types/domain";

/**
 * Percentual de conclusão do checklist do dia. Regra do produto: usa
 * apenas ações ativas para aquele dia (is_active) — uma ação desativada
 * (ex.: "trabalhei em campanha" quando não há campanha hoje) não conta nem
 * no numerador nem no denominador. Sem ações ativas, retorna null (não faz
 * sentido mostrar "0%" quando não há nada para medir — mesma regra de
 * "ausência de dado é null, nunca zero" usada no resto do produto).
 */
export function calculateChecklistCompletion(actions: Pick<DailyAction, "is_active" | "is_done">[]): {
  active: number;
  done: number;
  percent: number | null;
} {
  const active = actions.filter((action) => action.is_active);
  const done = active.filter((action) => action.is_done).length;
  const percent = active.length === 0 ? null : Math.round((done / active.length) * 100);
  return { active: active.length, done, percent };
}
