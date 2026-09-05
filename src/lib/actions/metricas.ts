"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { recordMetricSnapshot, updateMetricSnapshot, deleteMetricSnapshot } from "@/lib/data/metric-snapshots";
import { DataAccessError } from "@/lib/data/errors";
import { metricSnapshotSchema } from "@/lib/validations/metric-snapshot";
import { fromDateTimeLocalInput } from "@/lib/dates";
import type { MetricSnapshot, MetricSnapshotInsert } from "@/types/domain";

export type MetricSnapshotResult = { error: string } | { success: true; snapshot: MetricSnapshot };
export type SimpleResult = { error: string } | { success: true };

function revalidateMetricas(contentItemId: string) {
  revalidatePath("/metricas/conteudos");
  revalidatePath(`/metricas/conteudos/${contentItemId}`);
  revalidatePath("/publicados");
}

async function authenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Registra uma captura de métricas para um conteúdo (formulário rápido ou
 * completo — mesmo schema, mesma ação). Para janelas fixas (24h/7d/30d)
 * sempre faz upsert (uma leitura por janela por conteúdo — constraint no
 * banco); para "custom", cria uma linha nova quando `existingId` não é
 * informado, ou atualiza a linha existente quando é (edição de uma
 * captura customizada específica, não uma nova leitura).
 */
export async function saveMetricSnapshot(
  contentItemId: string,
  input: unknown,
  existingId?: string,
): Promise<MetricSnapshotResult> {
  const parsed = metricSnapshotSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os dados da captura de métricas." };
  }
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };

  const data = parsed.data;
  const payload: MetricSnapshotInsert = {
    content_item_id: contentItemId,
    user_id: user.id,
    window_type: data.windowType,
    window_start: data.windowType === "custom" ? fromDateTimeLocalInput(data.windowStart) : null,
    window_end: data.windowType === "custom" ? fromDateTimeLocalInput(data.windowEnd) : null,
    captured_at: fromDateTimeLocalInput(data.capturedAt) ?? new Date().toISOString(),
    views: data.views,
    reach: data.reach,
    impressions: data.impressions,
    likes: data.likes,
    comments: data.comments,
    shares: data.shares,
    saves: data.saves,
    replies: data.replies,
    profile_visits: data.profileVisits,
    followers_gained: data.followersGained,
    link_clicks: data.linkClicks,
    leads: data.leads,
    sales: data.sales,
    revenue: data.revenue,
    average_watch_time_seconds: data.averageWatchTimeSeconds,
    video_duration_seconds: data.videoDurationSeconds,
    three_second_views: data.threeSecondViews,
    completed_views: data.completedViews,
    retention_rate: data.retentionRate,
    story_exits: data.storyExits,
    taps_forward: data.tapsForward,
    taps_back: data.tapsBack,
  };

  try {
    const snapshot =
      data.windowType === "custom" && existingId
        ? await updateMetricSnapshot(supabase, existingId, payload)
        : await recordMetricSnapshot(supabase, payload);
    revalidateMetricas(contentItemId);
    return { success: true, snapshot };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível salvar a captura de métricas." };
  }
}

export async function removeMetricSnapshot(contentItemId: string, id: string): Promise<SimpleResult> {
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    await deleteMetricSnapshot(supabase, id);
    revalidateMetricas(contentItemId);
    return { success: true };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível excluir esta captura." };
  }
}
