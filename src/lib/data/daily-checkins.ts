import type { DbClient } from "./types";
import { unwrap, unwrapNullable } from "./errors";
import type { DailyCheckin, DailyCheckinInsert, DailyCheckinUpdate } from "@/types/domain";

export async function getDailyCheckin(db: DbClient, date: string): Promise<DailyCheckin | null> {
  const result = await db.from("daily_checkins").select("*").eq("checkin_date", date).maybeSingle();
  return unwrapNullable(result);
}

export async function listDailyCheckins(
  db: DbClient,
  range: { from: string; to: string },
): Promise<DailyCheckin[]> {
  const result = await db
    .from("daily_checkins")
    .select("*")
    .gte("checkin_date", range.from)
    .lte("checkin_date", range.to)
    .order("checkin_date", { ascending: true });
  return unwrap(result);
}

export async function upsertDailyCheckin(
  db: DbClient,
  input: DailyCheckinInsert,
): Promise<DailyCheckin> {
  const result = await db
    .from("daily_checkins")
    .upsert(input, { onConflict: "user_id,checkin_date" })
    .select()
    .single();
  return unwrap(result);
}

export async function updateDailyCheckin(
  db: DbClient,
  id: string,
  patch: DailyCheckinUpdate,
): Promise<DailyCheckin> {
  const result = await db.from("daily_checkins").update(patch).eq("id", id).select().single();
  return unwrap(result);
}
