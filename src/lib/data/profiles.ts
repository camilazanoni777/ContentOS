import type { DbClient } from "./types";
import { unwrap, unwrapNullable } from "./errors";
import type { Profile, ProfileUpdate } from "@/types/domain";

export async function getProfile(db: DbClient, userId: string): Promise<Profile | null> {
  const result = await db.from("profiles").select("*").eq("id", userId).maybeSingle();
  return unwrapNullable(result);
}

export async function updateProfile(
  db: DbClient,
  userId: string,
  patch: ProfileUpdate,
): Promise<Profile> {
  const result = await db.from("profiles").update(patch).eq("id", userId).select().single();
  return unwrap(result);
}
