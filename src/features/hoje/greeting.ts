import { APP_TIMEZONE } from "@/lib/dates";

/**
 * Saudação por horário do dia, sempre no timezone do produto — não no
 * timezone do servidor (que em produção normalmente é UTC, o que daria
 * "Boa noite" às 9h de São Paulo se usássemos a hora local do processo).
 */
export function getGreeting(now: Date = new Date(), timeZone: string = APP_TIMEZONE): string {
  const rawHour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false }).format(now),
  );
  // Alguns runtimes retornam "24" para meia-noite com hour12:false.
  const hour = rawHour === 24 ? 0 : rawHour;
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}
