import type { DbClient } from "./types";
import { unwrap } from "./errors";
import type { Product, ProductInsert, ProductUpdate } from "@/types/domain";

export async function listProducts(
  db: DbClient,
  options?: { includeInactive?: boolean },
): Promise<Product[]> {
  let query = db.from("products").select("*").order("name", { ascending: true });
  if (!options?.includeInactive) {
    query = query.eq("is_active", true);
  }
  const result = await query;
  return unwrap(result);
}

export async function createProduct(db: DbClient, input: ProductInsert): Promise<Product> {
  const result = await db.from("products").insert(input).select().single();
  return unwrap(result);
}

export async function updateProduct(
  db: DbClient,
  id: string,
  patch: ProductUpdate,
): Promise<Product> {
  const result = await db.from("products").update(patch).eq("id", id).select().single();
  return unwrap(result);
}

export async function deleteProduct(db: DbClient, id: string): Promise<void> {
  const result = await db.from("products").delete().eq("id", id);
  if (result.error) {
    throw result.error;
  }
}
