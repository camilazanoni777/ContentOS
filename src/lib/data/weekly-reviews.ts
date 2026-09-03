import type { DbClient } from "./types";
import { unwrap, unwrapNullable } from "./errors";
import type { WeeklyReview, WeeklyReviewInsert, WeeklyReviewUpdate } from "@/types/domain";

export async function listWeeklyReviews(db: DbClient): Promise<WeeklyReview[]> {
  const result = await db.from("weekly_reviews").select("*").order("week_start", { ascending: false });
  return unwrap(result);
}

export async function getWeeklyReview(
  db: DbClient,
  weekStart: string,
): Promise<WeeklyReview | null> {
  const result = await db
    .from("weekly_reviews")
    .select("*")
    .eq("week_start", weekStart)
    .maybeSingle();
  return unwrapNullable(result);
}

export async function upsertWeeklyReview(
  db: DbClient,
  input: WeeklyReviewInsert,
): Promise<WeeklyReview> {
  const result = await db
    .from("weekly_reviews")
    .upsert(input, { onConflict: "user_id,week_start" })
    .select()
    .single();
  return unwrap(result);
}

export async function completeWeeklyReview(
  db: DbClient,
  id: string,
  decision: string,
): Promise<WeeklyReview> {
  const result = await db
    .from("weekly_reviews")
    .update({ decision, completed_at: new Date().toISOString() } satisfies WeeklyReviewUpdate)
    .eq("id", id)
    .select()
    .single();
  return unwrap(result);
}
