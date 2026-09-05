import type { DbClient } from "./types";
import { unwrap } from "./errors";
import type { Goal, GoalInsert, GoalUpdate } from "@/types/domain";

export async function listGoals(
  db: DbClient,
  filter?: { periodType?: "weekly" | "monthly" },
): Promise<Goal[]> {
  let query = db.from("goals").select("*").order("period_start", { ascending: false });
  if (filter?.periodType) {
    query = query.eq("period_type", filter.periodType);
  }
  const result = await query;
  return unwrap(result);
}

export async function getGoalsByIds(db: DbClient, ids: string[]): Promise<Goal[]> {
  if (ids.length === 0) return [];
  const result = await db.from("goals").select("*").in("id", ids);
  return unwrap(result);
}

export async function createGoal(db: DbClient, input: GoalInsert): Promise<Goal> {
  const result = await db.from("goals").insert(input).select().single();
  return unwrap(result);
}

export async function updateGoal(db: DbClient, id: string, patch: GoalUpdate): Promise<Goal> {
  const result = await db.from("goals").update(patch).eq("id", id).select().single();
  return unwrap(result);
}

export async function deleteGoal(db: DbClient, id: string): Promise<void> {
  const result = await db.from("goals").delete().eq("id", id);
  if (result.error) {
    throw result.error;
  }
}
