import { addDaysISO, getMonthEnd, getMonthStart, getWeekRange, instantToISODate } from "@/lib/dates";
import type { CalendarImportantDate, ContentItem, ContentStatus } from "@/types/domain";

/**
 * Lógica pura da página Calendário: grade mensal (semanas completas,
 * incluindo dias de meses vizinhos para fechar a semana), indicadores de
 * dias vazios/com excesso de publicações, resumo do mês por formato e
 * pilar, e filtros. O reagendamento em si (mudar só a data, preservando o
 * horário) usa changeInstantDate de src/lib/dates.ts. Nada aqui toca o
 * Supabase.
 */

export const CALENDAR_VISIBLE_STATUSES: ContentStatus[] = ["scheduled", "published"];

/** Só itens "scheduled" podem ser arrastados — published_at é um fato consumado, não se reagenda por drag. */
export function isDraggable(item: Pick<ContentItem, "status">): boolean {
  return item.status === "scheduled";
}

export interface CalendarDay {
  /** YYYY-MM-DD. */
  date: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  items: ContentItem[];
  importantDates: CalendarImportantDate[];
}

/** Início/fim da grade visual do mês — semanas completas (segunda a domingo) cobrindo o mês inteiro. */
export function getMonthGridRange(monthISO: string): { start: string; end: string } {
  const monthStart = getMonthStart(monthISO);
  const monthEnd = getMonthEnd(monthISO);
  return {
    start: getWeekRange(monthStart).start,
    end: getWeekRange(monthEnd).end,
  };
}

/**
 * Monta a grade do mês: um item aparece no dia do seu scheduled_at
 * (conteúdo ainda não publicado) ou, se já publicado, no dia do
 * published_at (a data real substitui a planejada na exibição — evita
 * mostrar o mesmo conteúdo em dois dias diferentes do calendário).
 */
export function buildMonthGrid(
  monthISO: string,
  items: ContentItem[],
  importantDates: CalendarImportantDate[] = [],
  today: string | null = null,
): CalendarDay[] {
  const monthStart = getMonthStart(monthISO);
  const monthEnd = getMonthEnd(monthISO);
  const range = getMonthGridRange(monthISO);

  const days: CalendarDay[] = [];
  let cursor = range.start;
  while (cursor <= range.end) {
    days.push({
      date: cursor,
      inCurrentMonth: cursor >= monthStart && cursor <= monthEnd,
      isToday: cursor === today,
      items: [],
      importantDates: [],
    });
    cursor = addDaysISO(cursor, 1);
  }
  const byDate = new Map(days.map((day) => [day.date, day]));

  for (const item of items) {
    const relevantInstant = item.status === "published" ? item.published_at : item.scheduled_at;
    if (!relevantInstant) continue;
    const day = byDate.get(instantToISODate(relevantInstant));
    if (day) day.items.push(item);
  }

  for (const important of importantDates) {
    const day = byDate.get(important.event_date);
    if (day) day.importantDates.push(important);
  }

  return days;
}

/** Threshold de "excesso" de publicações num mesmo dia — acima disso, sinaliza sobrecarga visualmente. */
export const CALENDAR_EXCESS_THRESHOLD = 3;

export function isEmptyDay(day: CalendarDay): boolean {
  return day.inCurrentMonth && day.items.length === 0;
}

export function isExcessDay(day: CalendarDay): boolean {
  return day.items.length > CALENDAR_EXCESS_THRESHOLD;
}

export interface CalendarFilters {
  format: string;
  pillar: string;
  objective: string;
  status: string;
  campaignId: string;
}

export const EMPTY_CALENDAR_FILTERS: CalendarFilters = {
  format: "",
  pillar: "",
  objective: "",
  status: "",
  campaignId: "",
};

function normalized(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function filterCalendarItems(items: ContentItem[], filters: CalendarFilters): ContentItem[] {
  return items.filter((item) => {
    if (filters.format && normalized(item.format) !== normalized(filters.format)) return false;
    if (filters.pillar && item.pillar !== filters.pillar) return false;
    if (filters.objective && normalized(item.objective) !== normalized(filters.objective)) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.campaignId && item.campaign_id !== filters.campaignId) return false;
    return true;
  });
}

export interface MonthSummary {
  byFormat: { key: string; count: number }[];
  byPillar: { key: string; count: number }[];
  total: number;
}

/** Resumo do mês (só itens dentro do mês corrente da grade) por formato e pilar, ordenado do mais frequente ao menos. */
export function summarizeMonth(days: CalendarDay[]): MonthSummary {
  const currentMonthItems = days.filter((day) => day.inCurrentMonth).flatMap((day) => day.items);
  const byFormat = new Map<string, number>();
  const byPillar = new Map<string, number>();

  for (const item of currentMonthItems) {
    const format = item.format?.trim() || "Sem formato";
    const pillar = item.pillar?.trim() || "Sem pilar";
    byFormat.set(format, (byFormat.get(format) ?? 0) + 1);
    byPillar.set(pillar, (byPillar.get(pillar) ?? 0) + 1);
  }

  const toSorted = (map: Map<string, number>) =>
    [...map.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key, "pt-BR"));

  return { byFormat: toSorted(byFormat), byPillar: toSorted(byPillar), total: currentMonthItems.length };
}
