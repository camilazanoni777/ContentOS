import type { DbClient } from "./types";
import { unwrap } from "./errors";
import type {
  CalendarImportantDate,
  CalendarImportantDateInsert,
  CalendarImportantDateUpdate,
} from "@/types/domain";

export async function listCalendarImportantDates(
  db: DbClient,
  range?: { fromISO: string; toISO: string },
): Promise<CalendarImportantDate[]> {
  let query = db.from("calendar_important_dates").select("*").order("event_date", { ascending: true });
  if (range) {
    query = query.gte("event_date", range.fromISO).lte("event_date", range.toISO);
  }
  const result = await query;
  return unwrap(result);
}

export async function createCalendarImportantDate(
  db: DbClient,
  input: CalendarImportantDateInsert,
): Promise<CalendarImportantDate> {
  const result = await db.from("calendar_important_dates").insert(input).select().single();
  return unwrap(result);
}

export async function updateCalendarImportantDate(
  db: DbClient,
  id: string,
  patch: CalendarImportantDateUpdate,
): Promise<CalendarImportantDate> {
  const result = await db.from("calendar_important_dates").update(patch).eq("id", id).select().single();
  return unwrap(result);
}

export async function deleteCalendarImportantDate(db: DbClient, id: string): Promise<void> {
  const result = await db.from("calendar_important_dates").delete().eq("id", id);
  if (result.error) throw result.error;
}
