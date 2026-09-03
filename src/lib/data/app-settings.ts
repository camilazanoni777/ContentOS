import type { DbClient } from "./types";
import { unwrap, unwrapNullable } from "./errors";
import type { AppSettings, AppSettingsUpdate } from "@/types/domain";

export async function getAppSettings(db: DbClient, userId: string): Promise<AppSettings | null> {
  const result = await db.from("app_settings").select("*").eq("user_id", userId).maybeSingle();
  return unwrapNullable(result);
}

export async function updateAppSettings(
  db: DbClient,
  userId: string,
  patch: AppSettingsUpdate,
): Promise<AppSettings> {
  const result = await db
    .from("app_settings")
    .update(patch)
    .eq("user_id", userId)
    .select()
    .single();
  return unwrap(result);
}
