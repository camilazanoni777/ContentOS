import type { DbClient } from "./types";
import { unwrap, unwrapNullable } from "./errors";
import type { MetricSnapshot, MetricSnapshotInsert, MetricSnapshotUpdate } from "@/types/domain";

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

export async function getMetricSnapshotById(db: DbClient, id: string): Promise<MetricSnapshot | null> {
  return unwrapNullable(await db.from("metric_snapshots").select("*").eq("id", id).maybeSingle());
}

/** Snapshots de vários conteúdos de uma vez (uma query) — usado por Publicados para montar pendências de captura sem N+1. */
export async function listMetricSnapshotsForItems(
  db: DbClient,
  contentItemIds: string[],
): Promise<MetricSnapshot[]> {
  if (contentItemIds.length === 0) return [];
  const result = await db
    .from("metric_snapshots")
    .select("*")
    .in("content_item_id", contentItemIds)
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

/**
 * Atualiza uma captura já existente por id — usado para editar uma leitura
 * de janela "custom" (que não é upsertável por window_type, já que várias
 * podem existir para o mesmo conteúdo) e também para reabrir/corrigir uma
 * leitura de janela fixa já registrada sem depender do upsert.
 */
export async function updateMetricSnapshot(
  db: DbClient,
  id: string,
  patch: MetricSnapshotUpdate,
): Promise<MetricSnapshot> {
  const result = await db.from("metric_snapshots").update(patch).eq("id", id).select().single();
  return unwrap(result);
}

export async function deleteMetricSnapshot(db: DbClient, id: string): Promise<void> {
  const result = await db.from("metric_snapshots").delete().eq("id", id);
  if (result.error) {
    throw result.error;
  }
}
