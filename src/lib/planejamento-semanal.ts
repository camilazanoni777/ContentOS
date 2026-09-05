import { instantToISODate } from "@/lib/dates";
import type { ContentItem } from "@/types/domain";

/**
 * Lógica pura da página Planejamento Semanal: grade diária (segunda a
 * domingo) e percentual de execução. Nada aqui toca o Supabase — a
 * agregação de seguidores/vendas/receita/horas mora na camada de dados
 * (src/lib/data/weekly-plan.ts), pois depende de várias tabelas
 * (profile_snapshots, metric_snapshots) e não faz sentido buscar tudo
 * client-side só para exibir a semana.
 */

export interface WeeklyPlanDay {
  /** YYYY-MM-DD. */
  date: string;
  scheduled: ContentItem[];
  published: ContentItem[];
}

/**
 * Agrupa conteúdos por dia da semana (segunda a domingo, a partir de
 * `weekStart`): "agendado" quando scheduled_at cai no dia, "publicado"
 * quando published_at cai no dia. Um conteúdo pode aparecer nas duas
 * listas de dias diferentes (agendado numa data, publicado de fato em
 * outra) — é assim que o produto sinaliza atraso/adiantamento na grade.
 */
export function buildWeeklyDailyGrid(weekStart: string, items: ContentItem[]): WeeklyPlanDay[] {
  const days: WeeklyPlanDay[] = Array.from({ length: 7 }, (_, index) => {
    const [year, month, day] = weekStart.split("-").map(Number);
    const date = new Date(year, month - 1, day + index);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return { date: iso, scheduled: [], published: [] };
  });
  const byDate = new Map(days.map((day) => [day.date, day]));

  for (const item of items) {
    if (item.scheduled_at) {
      const day = byDate.get(instantToISODate(item.scheduled_at));
      if (day) day.scheduled.push(item);
    }
    if (item.published_at) {
      const day = byDate.get(instantToISODate(item.published_at));
      if (day) day.published.push(item);
    }
  }

  return days;
}

/** Percentual de execução da semana (publicados / planejados). Null sem base (nada planejado ainda). */
export function computeExecutionPercent(plannedCount: number, publishedCount: number): number | null {
  if (plannedCount <= 0) return null;
  return Math.round((publishedCount / plannedCount) * 100);
}
