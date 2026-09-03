import type { DbClient } from "./types";
import { unwrap } from "./errors";
import type { MetricSnapshot, MetricSnapshotInsert } from "@/types/domain";

export async function listMetricSnapshots(
  db: DbClient,
  contentItemId: string,
): Promise<MetricSnapshot[]> {
  const result = await db
    .from("metric_snapshots")
    .select("*")
    .eq("content_item_id", contentItemId)
    .order("captured_at", { ascending: true });
  return unwrap(result);
}

/**
 * Registra uma leitura de métricas. Para janelas fixas (24h/7d/30d) faz
 * upsert (uma leitura por janela por conteúdo, conforme a constraint
 * metric_snapshots_content_fixed_window_key); para janela "custom" sempre
 * insere uma nova linha, já que o mesmo conteúdo pode ter várias leituras
 * customizadas em períodos diferentes.
 */
export async function recordMetricSnapshot(
  db: DbClient,
  input: MetricSnapshotInsert,
): Promise<MetricSnapshot> {
  if (input.window_type === "custom") {
    const result = await db.from("metric_snapshots").insert(input).select().single();
    return unwrap(result);
  }

  const result = await db
    .from("metric_snapshots")
    .upsert(input, { onConflict: "content_item_id,window_type" })
    .select()
    .single();
  return unwrap(result);
}

export async function deleteMetricSnapshot(db: DbClient, id: string): Promise<void> {
  const result = await db.from("metric_snapshots").delete().eq("id", id);
  if (result.error) {
    throw result.error;
  }
}
