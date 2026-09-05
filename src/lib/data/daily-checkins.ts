import type { DbClient } from "./types";
import { unwrap, unwrapNullable } from "./errors";
import type { DailyCheckin, DailyCheckinInsert, DailyCheckinUpdate } from "@/types/domain";

export async function getDailyCheckin(
  db: DbClient,
  accountId: string,
  date: string,
): Promise<DailyCheckin | null> {
  const result = await db
    .from("daily_checkins")
    .select("*")
    .eq("account_id", accountId)
    .eq("checkin_date", date)
    .maybeSingle();
  return unwrapNullable(result);
}

export async function listDailyCheckins(
  db: DbClient,
  accountId: string,
  range: { from: string; to: string },
): Promise<DailyCheckin[]> {
  const result = await db
    .from("daily_checkins")
    .select("*")
    .eq("account_id", accountId)
    .gte("checkin_date", range.from)
    .lte("checkin_date", range.to)
    .order("checkin_date", { ascending: true });
  return unwrap(result);
}

/**
 * Cria ou atualiza o check-in do dia (uma linha por usuária+conta+data —
 * ver constraint `daily_checkins_user_account_date_key`). É o único caminho
 * de escrita usado pelo autosave de rascunho: sempre um upsert idempotente,
 * nunca um insert "cru", para nunca duplicar o registro do dia.
 */
export async function upsertDailyCheckin(
  db: DbClient,
  input: DailyCheckinInsert,
): Promise<DailyCheckin> {
  const result = await db
    .from("daily_checkins")
    .upsert(input, { onConflict: "user_id,account_id,checkin_date" })
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
