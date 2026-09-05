import type { DbClient } from "./types";
import { unwrap } from "./errors";
import type { ContentReviewComment, ContentReviewCommentInsert, ReviewCommentStatus } from "@/types/domain";

export async function listReviewComments(db: DbClient, contentItemId: string): Promise<ContentReviewComment[]> {
  const result = await db
    .from("content_review_comments")
    .select("*")
    .eq("content_item_id", contentItemId)
    .order("created_at", { ascending: true });
  return unwrap(result);
}

export async function createReviewComment(
  db: DbClient,
  input: ContentReviewCommentInsert,
): Promise<ContentReviewComment> {
  const result = await db.from("content_review_comments").insert(input).select().single();
  return unwrap(result);
}

export async function updateReviewCommentStatus(
  db: DbClient,
  id: string,
  status: ReviewCommentStatus,
): Promise<ContentReviewComment> {
  const result = await db.from("content_review_comments").update({ status }).eq("id", id).select().single();
  return unwrap(result);
}
