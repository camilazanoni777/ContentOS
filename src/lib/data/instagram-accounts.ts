import type { DbClient } from "./types";
import { unwrap } from "./errors";
import type { InstagramAccount, InstagramAccountInsert, InstagramAccountUpdate } from "@/types/domain";

export async function listInstagramAccounts(db: DbClient): Promise<InstagramAccount[]> {
  const result = await db.from("instagram_accounts").select("*").order("created_at", { ascending: true });
  return unwrap(result);
}

/**
 * Resolve a conta "ativa" dentro de uma lista já carregada: a marcada como
 * `is_primary`, senão a mais antiga cadastrada, senão `null`. Função pura
 * (sem I/O) para reaproveitar quando a lista de contas já foi buscada.
 */
export function pickActiveAccount(accounts: InstagramAccount[]): InstagramAccount | null {
  if (accounts.length === 0) {
    return null;
  }
  return accounts.find((account) => account.is_primary) ?? accounts[0];
}

/**
 * Resolve a conta "ativa" para telas que precisam de uma única conta de
 * contexto (Hoje, Check-in). O seletor de conta na barra superior ainda não
 * persiste a escolha entre requests — pendência registrada no TODO.md.
 */
export async function getActiveAccount(db: DbClient): Promise<InstagramAccount | null> {
  const accounts = await listInstagramAccounts(db);
  return pickActiveAccount(accounts);
}

export async function createInstagramAccount(
  db: DbClient,
  input: InstagramAccountInsert,
): Promise<InstagramAccount> {
  const result = await db.from("instagram_accounts").insert(input).select().single();
  return unwrap(result);
}

export async function updateInstagramAccount(
  db: DbClient,
  id: string,
  patch: InstagramAccountUpdate,
): Promise<InstagramAccount> {
  const result = await db.from("instagram_accounts").update(patch).eq("id", id).select().single();
  return unwrap(result);
}

export async function deleteInstagramAccount(db: DbClient, id: string): Promise<void> {
  const result = await db.from("instagram_accounts").delete().eq("id", id);
  if (result.error) {
    throw result.error;
  }
}
