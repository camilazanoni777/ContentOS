import type { DbClient } from "./types";
import { unwrap } from "./errors";
import type { ChecklistItem, ChecklistItemInsert, ChecklistItemUpdate } from "@/types/domain";

/**
 * Itens padrão do checklist diário — semeados na primeira vez que a
 * usuária abre o check-in (ensureDefaultChecklistItems), não pelo trigger
 * handle_new_user(), para também cobrir contas criadas antes da Fase 4.
 */
export const DEFAULT_CHECKLIST_LABELS: string[] = [
  "Gravei conteúdo",
  "Publiquei o conteúdo principal",
  "Postei stories",
  "Respondi comentários",
  "Respondi directs",
  "Interagi com a comunidade",
  "Atualizei métricas",
  "Capturei novas ideias",
  "Trabalhei em campanha/produto",
];

export async function listChecklistItems(db: DbClient): Promise<ChecklistItem[]> {
  const result = await db
    .from("checklist_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return unwrap(result);
}

/**
 * Garante que a usuária tenha pelo menos os itens padrão do checklist.
 * Idempotente: se já existir qualquer item, não faz nada. Usa
 * `ignoreDuplicates` para tolerar uma corrida entre duas chamadas
 * concorrentes (índice único em (user_id, lower(label))).
 */
export async function ensureDefaultChecklistItems(
  db: DbClient,
  userId: string,
): Promise<ChecklistItem[]> {
  const existing = await listChecklistItems(db);
  if (existing.length > 0) {
    return existing;
  }

  const defaults: ChecklistItemInsert[] = DEFAULT_CHECKLIST_LABELS.map((label, index) => ({
    user_id: userId,
    label,
    sort_order: index,
  }));

  // Insert simples (não upsert): o índice único em (user_id, lower(label))
  // é uma expressão, e o parâmetro on_conflict do PostgREST só aceita listas
  // de colunas simples. Na corrida rara de duas chamadas concorrentes, a
  // segunda esbarra na constraint e apenas relemos o que a primeira criou.
  const { error } = await db.from("checklist_items").insert(defaults);
  if (error) {
    return listChecklistItems(db);
  }
  return listChecklistItems(db);
}

export async function createChecklistItem(
  db: DbClient,
  input: ChecklistItemInsert,
): Promise<ChecklistItem> {
  const result = await db.from("checklist_items").insert(input).select().single();
  return unwrap(result);
}

export async function updateChecklistItem(
  db: DbClient,
  id: string,
  patch: ChecklistItemUpdate,
): Promise<ChecklistItem> {
  const result = await db.from("checklist_items").update(patch).eq("id", id).select().single();
  return unwrap(result);
}

export async function deleteChecklistItem(db: DbClient, id: string): Promise<void> {
  const result = await db.from("checklist_items").delete().eq("id", id);
  if (result.error) {
    throw result.error;
  }
}
