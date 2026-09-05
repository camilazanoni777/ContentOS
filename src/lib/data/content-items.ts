import type { DbClient } from "./types";
import { unwrap, unwrapNullable } from "./errors";
import type {
  ContentItem,
  ContentItemInsert,
  ContentItemUpdate,
  ContentStatus,
  ContentStatusHistory,
} from "@/types/domain";

export interface ListContentItemsFilter {
  status?: ContentStatus | ContentStatus[];
  seriesId?: string;
  campaignId?: string;
  productId?: string;
  accountId?: string;
  /** Por padrão, itens arquivados (archived_at preenchido) são excluídos. */
  includeArchived?: boolean;
  search?: string;
}

export async function listContentItems(
  db: DbClient,
  filter: ListContentItemsFilter = {},
): Promise<ContentItem[]> {
  let query = db.from("content_items").select("*").order("updated_at", { ascending: false });

  if (filter.status) {
    query = Array.isArray(filter.status)
      ? query.in("status", filter.status)
      : query.eq("status", filter.status);
  }
  if (filter.seriesId) {
    query = query.eq("series_id", filter.seriesId);
  }
  if (filter.campaignId) {
    query = query.eq("campaign_id", filter.campaignId);
  }
  if (filter.productId) {
    query = query.eq("product_id", filter.productId);
  }
  if (filter.accountId) {
    query = query.eq("account_id", filter.accountId);
  }
  if (!filter.includeArchived) {
    query = query.is("archived_at", null);
  }
  if (filter.search) {
    query = query.ilike("title", `%${filter.search}%`);
  }

  const result = await query;
  return unwrap(result);
}

/** Conteúdos reaproveitados a partir de um conjunto de originais (source_content_id in ids) — usado por Publicados para mostrar "já tem reaproveitamento" e montar a comparação. */
export async function listContentItemsBySourceIds(db: DbClient, sourceIds: string[]): Promise<ContentItem[]> {
  if (sourceIds.length === 0) return [];
  const result = await db.from("content_items").select("*").in("source_content_id", sourceIds);
  return unwrap(result);
}

export async function getContentItemById(db: DbClient, id: string): Promise<ContentItem | null> {
  const result = await db.from("content_items").select("*").eq("id", id).maybeSingle();
  return unwrapNullable(result);
}

export async function createContentItem(
  db: DbClient,
  input: ContentItemInsert,
): Promise<ContentItem> {
  const result = await db.from("content_items").insert(input).select().single();
  return unwrap(result);
}

/**
 * "Duplicar como reaproveitamento": cria um content_item novo a partir de
 * um já publicado, mantendo source_content_id apontando para o original
 * (nunca reescreve o original) e recomeçando o pipeline do zero em
 * "idea" — o reaproveitamento passa de novo por roteiro/gravação/edição
 * antes de ser publicado de novo, mesmo que reaproveite boa parte do
 * conteúdo original.
 */
export async function repurposeContentItem(db: DbClient, original: ContentItem): Promise<ContentItem> {
  const input: ContentItemInsert = {
    user_id: original.user_id,
    account_id: original.account_id,
    title: `${original.title} (reaproveitado)`,
    hook: original.hook,
    summary: original.summary,
    script: original.script,
    caption: original.caption,
    format: original.format,
    pillar: original.pillar,
    objective: original.objective,
    cta: original.cta,
    priority: original.priority,
    status: "idea",
    reference_text: original.reference_text,
    reference_url: original.reference_url,
    audience_intent: original.audience_intent,
    campaign_id: original.campaign_id,
    product_id: original.product_id,
    source_content_id: original.id,
    tags: original.tags,
    notes: `Reaproveitado de "${original.title}".`,
  };
  const result = await db.from("content_items").insert(input).select().single();
  return unwrap(result);
}

/**
 * Atualiza um content_item (incluindo, se presente, o status — o que
 * dispara automaticamente o registro em content_status_history via
 * trigger). Este é o único caminho para "avançar de etapa": nunca criar um
 * novo registro para isso.
 */
export async function updateContentItem(
  db: DbClient,
  id: string,
  patch: ContentItemUpdate,
): Promise<ContentItem> {
  const result = await db.from("content_items").update(patch).eq("id", id).select().single();
  return unwrap(result);
}

/** Exclusão de conteúdo usa archived_at por padrão (soft delete). */
export async function archiveContentItem(db: DbClient, id: string): Promise<ContentItem> {
  const result = await db
    .from("content_items")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return unwrap(result);
}

export async function restoreContentItem(db: DbClient, id: string): Promise<ContentItem> {
  const result = await db
    .from("content_items")
    .update({ archived_at: null })
    .eq("id", id)
    .select()
    .single();
  return unwrap(result);
}

/**
 * Exclusão definitiva (hard delete). Não é o caminho padrão — use
 * archiveContentItem() a menos que haja um motivo explícito (ex.: rotina
 * administrativa de expurgo) para remover o registro de vez.
 */
export async function deleteContentItemPermanently(db: DbClient, id: string): Promise<void> {
  const result = await db.from("content_items").delete().eq("id", id);
  if (result.error) {
    throw result.error;
  }
}

export async function listContentStatusHistory(
  db: DbClient,
  contentItemId: string,
): Promise<ContentStatusHistory[]> {
  const result = await db
    .from("content_status_history")
    .select("*")
    .eq("content_item_id", contentItemId)
    .order("changed_at", { ascending: true });
  return unwrap(result);
}

export async function listContentStatusHistoryForItems(
  db: DbClient,
  contentItemIds: string[],
): Promise<ContentStatusHistory[]> {
  if (contentItemIds.length === 0) return [];
  const result = await db
    .from("content_status_history")
    .select("*")
    .in("content_item_id", contentItemIds)
    .order("changed_at", { ascending: true });
  return unwrap(result);
}
