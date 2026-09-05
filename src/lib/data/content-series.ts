import type { DbClient } from "./types";
import { unwrap } from "./errors";
import type { ContentSeries, ContentSeriesInsert, ContentSeriesUpdate } from "@/types/domain";

export async function listContentSeries(db: DbClient): Promise<ContentSeries[]> {
  const result = await db.from("content_series").select("*").is("archived_at", null).order("name", { ascending: true });
  return unwrap(result);
}

export async function createContentSeries(
  db: DbClient,
  input: ContentSeriesInsert,
): Promise<ContentSeries> {
  const result = await db.from("content_series").insert(input).select().single();
  return unwrap(result);
}

export async function updateContentSeries(
  db: DbClient,
  id: string,
  patch: ContentSeriesUpdate,
): Promise<ContentSeries> {
  const result = await db.from("content_series").update(patch).eq("id", id).select().single();
  return unwrap(result);
}

export async function deleteContentSeries(db: DbClient, id: string): Promise<void> {
  const result = await db.from("content_series").delete().eq("id", id);
  if (result.error) {
    throw result.error;
  }
}
