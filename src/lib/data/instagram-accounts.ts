import type { DbClient } from "./types";
import { unwrap } from "./errors";
import type { InstagramAccount, InstagramAccountInsert, InstagramAccountUpdate } from "@/types/domain";

export async function listInstagramAccounts(db: DbClient): Promise<InstagramAccount[]> {
  const result = await db.from("instagram_accounts").select("*").order("created_at", { ascending: true });
  return unwrap(result);
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
