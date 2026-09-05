import type { DbClient } from "./types";
import { unwrap } from "./errors";
import type { AlertDismissal } from "@/types/domain";

/** Todas as dispensas/adiamentos da usuária — o alerta em si nunca é persistido (ver src/lib/alerts.ts). */
export async function listAlertDismissals(db: DbClient): Promise<AlertDismissal[]> {
  const result = await db.from("alert_dismissals").select("*");
  return unwrap(result);
}

/** Dispensa um alerta indefinidamente (até a condição mudar e gerar outra `alert_key`). */
export async function dismissAlert(db: DbClient, userId: string, alertKey: string): Promise<AlertDismissal> {
  const result = await db
    .from("alert_dismissals")
    .upsert({ user_id: userId, alert_key: alertKey, dismissed: true, snoozed_until: null }, { onConflict: "user_id,alert_key" })
    .select()
    .single();
  return unwrap(result);
}

/** Adia um alerta até `snoozedUntil` — depois disso volta a aparecer normalmente. */
export async function deferAlert(db: DbClient, userId: string, alertKey: string, snoozedUntil: string): Promise<AlertDismissal> {
  const result = await db
    .from("alert_dismissals")
    .upsert({ user_id: userId, alert_key: alertKey, dismissed: false, snoozed_until: snoozedUntil }, { onConflict: "user_id,alert_key" })
    .select()
    .single();
  return unwrap(result);
}

/** Desfaz uma dispensa/adiamento (ex.: reabrir um alerta dispensado por engano). */
export async function clearAlertDismissal(db: DbClient, userId: string, alertKey: string): Promise<void> {
  const result = await db.from("alert_dismissals").delete().eq("user_id", userId).eq("alert_key", alertKey);
  if (result.error) {
    throw result.error;
  }
}
