import type { DbClient } from "./types";
import { unwrap, unwrapNullable } from "./errors";
import type {
  ContentItem,
  RecordingSession,
  RecordingSessionInsert,
  RecordingSessionItem,
  RecordingSessionUpdate,
} from "@/types/domain";

export async function listRecordingSessions(db: DbClient): Promise<RecordingSession[]> {
  const result = await db
    .from("recording_sessions")
    .select("*")
    .order("session_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  return unwrap(result);
}

export async function getRecordingSessionById(db: DbClient, id: string): Promise<RecordingSession | null> {
  const result = await db.from("recording_sessions").select("*").eq("id", id).maybeSingle();
  return unwrapNullable(result);
}

export async function createRecordingSession(
  db: DbClient,
  input: RecordingSessionInsert,
): Promise<RecordingSession> {
  const result = await db.from("recording_sessions").insert(input).select().single();
  return unwrap(result);
}

export async function updateRecordingSession(
  db: DbClient,
  id: string,
  patch: RecordingSessionUpdate,
): Promise<RecordingSession> {
  const result = await db.from("recording_sessions").update(patch).eq("id", id).select().single();
  return unwrap(result);
}

export async function deleteRecordingSession(db: DbClient, id: string): Promise<void> {
  const result = await db.from("recording_sessions").delete().eq("id", id);
  if (result.error) throw result.error;
}

export type RecordingSessionItemWithContent = RecordingSessionItem & { content_item: ContentItem };

/** Itens de uma sessão, já com o content_item embutido (join via FK), na ordem de gravação. */
export async function listSessionItems(db: DbClient, sessionId: string): Promise<RecordingSessionItemWithContent[]> {
  const result = await db
    .from("recording_session_items")
    .select("*, content_item:content_items(*)")
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: true });
  return unwrap(result) as unknown as RecordingSessionItemWithContent[];
}

/** Todas as sessões de que um conjunto de content_items participa (para mostrar "já está em uma sessão" na lista). */
export async function listSessionItemsForContentItems(
  db: DbClient,
  contentItemIds: string[],
): Promise<RecordingSessionItem[]> {
  if (contentItemIds.length === 0) return [];
  const result = await db.from("recording_session_items").select("*").in("content_item_id", contentItemIds);
  return unwrap(result);
}

/** Itens de várias sessões de uma vez (uma query), já com o content_item embutido — usado para montar o painel de todas as sessões sem N+1. */
export async function listAllSessionItems(
  db: DbClient,
  sessionIds: string[],
): Promise<RecordingSessionItemWithContent[]> {
  if (sessionIds.length === 0) return [];
  const result = await db
    .from("recording_session_items")
    .select("*, content_item:content_items(*)")
    .in("session_id", sessionIds)
    .order("sort_order", { ascending: true });
  return unwrap(result) as unknown as RecordingSessionItemWithContent[];
}

export async function addSessionItems(
  db: DbClient,
  userId: string,
  sessionId: string,
  contentItemIds: string[],
  startingSortOrder: number,
): Promise<RecordingSessionItem[]> {
  if (contentItemIds.length === 0) return [];
  const rows = contentItemIds.map((contentItemId, index) => ({
    user_id: userId,
    session_id: sessionId,
    content_item_id: contentItemId,
    sort_order: startingSortOrder + index,
  }));
  const result = await db.from("recording_session_items").insert(rows).select();
  return unwrap(result);
}

export async function removeSessionItem(db: DbClient, id: string): Promise<void> {
  const result = await db.from("recording_session_items").delete().eq("id", id);
  if (result.error) throw result.error;
}

/** Persiste uma nova ordem de gravação — um UPDATE por item (listas de sessão são curtas). */
export async function reorderSessionItems(
  db: DbClient,
  updates: { id: string; sortOrder: number }[],
): Promise<void> {
  for (const { id, sortOrder } of updates) {
    const result = await db.from("recording_session_items").update({ sort_order: sortOrder }).eq("id", id);
    if (result.error) throw result.error;
  }
}
