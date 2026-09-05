import type { DbClient } from "./types";
import { unwrap } from "./errors";
import type { ContentScriptVersion } from "@/types/domain";
import type { Json } from "@/types/database";

export async function listScriptVersions(
  db: DbClient,
  contentItemId: string,
  limit = 20,
): Promise<ContentScriptVersion[]> {
  const result = await db
    .from("content_script_versions")
    .select("*")
    .eq("content_item_id", contentItemId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return unwrap(result);
}

export interface CreateScriptVersionInput {
  user_id: string;
  content_item_id: string;
  snapshot: Json;
}

/**
 * Histórico é imutável (só select/insert — ver migration): esta é a única
 * função de escrita desta tabela, e não existe update/delete correspondente
 * de propósito.
 */
export async function createScriptVersion(
  db: DbClient,
  input: CreateScriptVersionInput,
): Promise<ContentScriptVersion> {
  const result = await db.from("content_script_versions").insert(input).select().single();
  return unwrap(result);
}
