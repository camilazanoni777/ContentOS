import type { DbClient } from "./types";
import { unwrap } from "./errors";
import type { DailyAction, DailyActionInsert, DailyActionUpdate } from "@/types/domain";
import { ensureDefaultChecklistItems } from "./checklist-items";

export async function listDailyActions(db: DbClient, date: string): Promise<DailyAction[]> {
  const result = await db
    .from("daily_actions")
    .select("*")
    .eq("action_date", date)
    .order("sort_order", { ascending: true })
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

/**
 * Ativa/desativa uma ação só para o dia (sem apagar o item do template).
 * Regra do produto: o percentual do check-in usa apenas ações ativas.
 */
export async function setDailyActionActive(
  db: DbClient,
  id: string,
  isActive: boolean,
): Promise<DailyAction> {
  const result = await db
    .from("daily_actions")
    .update({ is_active: isActive })
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

/**
 * Garante que exista uma `daily_action` para hoje para cada item ativo do
 * checklist (semeando os itens padrão na primeira chamada da usuária, via
 * ensureDefaultChecklistItems). Idempotente: chamar de novo no mesmo dia
 * não duplica nada — só preenche o que ainda falta (ex.: usuária adicionou
 * um item novo ao template depois de já ter aberto o check-in hoje).
 */
export async function ensureDailyActionsForDate(
  db: DbClient,
  userId: string,
  date: string,
  checkinId: string | null,
): Promise<DailyAction[]> {
  const [items, existing] = await Promise.all([
    ensureDefaultChecklistItems(db, userId),
    listDailyActions(db, date),
  ]);

  const existingItemIds = new Set(existing.map((action) => action.checklist_item_id).filter(Boolean));
  const missing = items.filter((item) => item.is_active && !existingItemIds.has(item.id));

  if (missing.length === 0) {
    return existing;
  }

  const toInsert: DailyActionInsert[] = missing.map((item) => ({
    user_id: userId,
    checkin_id: checkinId,
    checklist_item_id: item.id,
    action_date: date,
    title: item.label,
    sort_order: item.sort_order,
  }));

  const result = await db.from("daily_actions").insert(toInsert).select();
  const inserted = unwrap(result);
  return [...existing, ...inserted].sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Cria um item de checklist personalizado E a ação do dia correspondente
 * (usado pelo "+ item personalizado" no Check-in) — satisfaz o requisito de
 * checklist "personalizável" além dos 9 itens padrão.
 */
export async function addCustomChecklistAction(
  db: DbClient,
  userId: string,
  date: string,
  checkinId: string | null,
  label: string,
): Promise<DailyAction> {
  const existing = await listDailyActions(db, date);
  const nextSortOrder = existing.length > 0 ? Math.max(...existing.map((a) => a.sort_order)) + 1 : 0;

  const itemResult = await db
    .from("checklist_items")
    .insert({ user_id: userId, label, sort_order: nextSortOrder })
    .select()
    .single();
  const item = unwrap(itemResult);

  return createDailyAction(db, {
    user_id: userId,
    checkin_id: checkinId,
    checklist_item_id: item.id,
    action_date: date,
    title: item.label,
    sort_order: nextSortOrder,
  });
}
