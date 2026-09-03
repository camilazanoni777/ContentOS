import type { DbClient } from "./types";
import { unwrap } from "./errors";
import type { DailyAction, DailyActionInsert, DailyActionUpdate } from "@/types/domain";

export async function listDailyActions(db: DbClient, date: string): Promise<DailyAction[]> {
  const result = await db
    .from("daily_actions")
    .select("*")
    .eq("action_date", date)
    .order("created_at", { ascending: true });
  return unwrap(result);
}

export async function createDailyAction(
  db: DbClient,
  input: DailyActionInsert,
): Promise<DailyAction> {
  const result = await db.from("daily_actions").insert(input).select().single();
  return unwrap(result);
}

export async function updateDailyAction(
  db: DbClient,
  id: string,
  patch: DailyActionUpdate,
): Promise<DailyAction> {
  const result = await db.from("daily_actions").update(patch).eq("id", id).select().single();
  return unwrap(result);
}

export async function toggleDailyAction(
  db: DbClient,
  id: string,
  isDone: boolean,
): Promise<DailyAction> {
  const result = await db
    .from("daily_actions")
    .update({ is_done: isDone, completed_at: isDone ? new Date().toISOString() : null })
    .eq("id", id)
    .select()
    .single();
  return unwrap(result);
}

export async function deleteDailyAction(db: DbClient, id: string): Promise<void> {
  const result = await db.from("daily_actions").delete().eq("id", id);
  if (result.error) {
    throw result.error;
  }
}
