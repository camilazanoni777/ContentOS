import { addDays, differenceInCalendarDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";

export const APP_TIMEZONE = "America/Sao_Paulo";

/**
 * Offset fixo do timezone padrão do produto. O Brasil aboliu o horário de
 * verão em 2019, então America/Sao_Paulo é UTC-03:00 o ano inteiro — usar
 * o offset fixo evita depender de uma biblioteca de timezone só para isso.
 * Se o produto vier a suportar outro timezone por usuária, substituir por
 * um cálculo real de offset (ex.: via Intl) nesse momento.
 */
const APP_TIMEZONE_OFFSET = "-03:00";

/** Mesmo offset fixo acima, em horas — usado pela aritmética direta de getWeekdayLocal/getHourLocal. */
const APP_TIMEZONE_OFFSET_HOURS = 3;

/**
 * Data de "hoje" (YYYY-MM-DD) no timezone do produto, não no timezone do
 * servidor. Importante: perto da meia-noite, `new Date().toISOString()`
 * pode apontar para o dia errado se o servidor rodar em UTC — o locale
 * "en-CA" do Intl formata datas como YYYY-MM-DD diretamente.
 */
export function todayISODate(timeZone: string = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

/** Converte "YYYY-MM-DD" num Date à meia-noite local — só para aritmética de calendário (semana/mês), nunca para exibir hora. */
export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Semana de segunda a domingo (convenção usada em weekly_reviews.week_start). */
export function getWeekRange(iso: string): { start: string; end: string } {
  const date = parseISODate(iso);
  return {
    start: toISODate(startOfWeek(date, { weekStartsOn: 1 })),
    end: toISODate(endOfWeek(date, { weekStartsOn: 1 })),
  };
}

export function getMonthStart(iso: string): string {
  return toISODate(startOfMonth(parseISODate(iso)));
}

export function getMonthEnd(iso: string): string {
  return toISODate(endOfMonth(parseISODate(iso)));
}

export function addDaysISO(iso: string, amount: number): string {
  return toISODate(addDays(parseISODate(iso), amount));
}

/**
 * Período anterior de mesmo tamanho (em dias), imediatamente antes de
 * start..end (ambos inclusive) — generaliza "semana anterior de mesmo
 * tamanho" (Revisão Semanal) para qualquer período/janela de análise
 * escolhido (Dashboard).
 */
export function getPreviousEquivalentRange(start: string, end: string): { start: string; end: string } {
  const dayCount = differenceInCalendarDays(parseISODate(end), parseISODate(start)) + 1;
  const previousEnd = addDaysISO(start, -1);
  const previousStart = addDaysISO(previousEnd, -(dayCount - 1));
  return { start: previousStart, end: previousEnd };
}

/**
 * Limites (início inclusivo, fim exclusivo) de um dia de calendário no
 * timezone do produto, como instantes timestamptz — para comparar contra
 * colunas timestamptz (planned_at, published_at etc.) sem depender do
 * timezone da sessão do Postgres.
 */
export function dayInstantRange(iso: string): { startInstant: string; endInstant: string } {
  return {
    startInstant: `${iso}T00:00:00${APP_TIMEZONE_OFFSET}`,
    endInstant: `${addDaysISO(iso, 1)}T00:00:00${APP_TIMEZONE_OFFSET}`,
  };
}

/** Mesma ideia, para um intervalo [fromISO, toISO] de dias (inclusive nos dois extremos). */
export function rangeInstantBounds(fromISO: string, toISO: string): { startInstant: string; endInstant: string } {
  return {
    startInstant: `${fromISO}T00:00:00${APP_TIMEZONE_OFFSET}`,
    endInstant: `${addDaysISO(toISO, 1)}T00:00:00${APP_TIMEZONE_OFFSET}`,
  };
}

/**
 * Troca só a data (YYYY-MM-DD) de um instante timestamptz, preservando a
 * hora local no timezone do produto — usado pelo arrastar-e-soltar do
 * Calendário: mover um conteúdo para outro dia não deve mudar o horário
 * planejado. Se `instantISO` for null/vazio, assume meio-dia local (padrão
 * razoável para um conteúdo agendado sem horário definido ainda).
 */
export function changeInstantDate(instantISO: string | null | undefined, newDateISO: string): string {
  const time = instantISO
    ? new Intl.DateTimeFormat("en-GB", {
        timeZone: APP_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(instantISO))
    : "12:00";
  return `${newDateISO}T${time}:00${APP_TIMEZONE_OFFSET}`;
}

/** Data (YYYY-MM-DD) local de um instante timestamptz, no timezone do produto. */
export function instantToISODate(instantISO: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(new Date(instantISO));
}

/**
 * Converte um instante timestamptz para o formato de um
 * `<input type="datetime-local">` (YYYY-MM-DDTHH:mm), no timezone do
 * produto — não no timezone do navegador, para o horário exibido/editado
 * sempre significar "hora de Brasília", independente de onde a usuária
 * estiver fisicamente.
 */
export function toDateTimeLocalInput(instantISO: string | null | undefined): string {
  if (!instantISO) return "";
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(new Date(instantISO));
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(instantISO));
  return `${date}T${time}`;
}

/** Inverso de toDateTimeLocalInput: interpreta o valor do input como hora local do produto (não do navegador) e devolve um instante timestamptz. */
export function fromDateTimeLocalInput(value: string | null | undefined): string | null {
  if (!value || !value.trim()) return null;
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  return `${withSeconds}${APP_TIMEZONE_OFFSET}`;
}

/**
 * Formata um instante timestamptz (ou uma data YYYY-MM-DD) como data pt-BR
 * no timezone do produto — nunca no timezone do navegador/servidor, para
 * não arriscar mostrar o dia errado perto da virada da meia-noite. Use
 * sempre isto (nunca `new Date(x).toLocaleDateString("pt-BR")` sem
 * `timeZone`) para exibir uma data já armazenada.
 */
export function formatDateBR(value: string | null | undefined): string {
  if (!value) return "—";
  const iso = value.length === 10 ? `${value}T12:00:00${APP_TIMEZONE_OFFSET}` : value;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: APP_TIMEZONE, day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
}

/** Mesma ideia de formatDateBR, incluindo hora — para instantes timestamptz com hora relevante (published_at, captured_at etc.). */
export function formatDateTimeBR(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/** Dia da semana local (0=domingo...6=sábado, convenção de Date#getDay) de um instante timestamptz, no timezone do produto — usado para achar o "melhor dia" de publicação (Revisão Semanal). */
export function getWeekdayLocal(instantISO: string): number {
  const shifted = new Date(new Date(instantISO).getTime() - APP_TIMEZONE_OFFSET_HOURS * 3_600_000);
  return shifted.getUTCDay();
}

/** Hora local (0-23) de um instante timestamptz, no timezone do produto — usado para achar o "melhor horário" de publicação (Revisão Semanal). */
export function getHourLocal(instantISO: string): number {
  const shifted = new Date(new Date(instantISO).getTime() - APP_TIMEZONE_OFFSET_HOURS * 3_600_000);
  return shifted.getUTCHours();
}
