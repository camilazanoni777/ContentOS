"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getContentItemById, repurposeContentItem, updateContentItem } from "@/lib/data/content-items";
import { DataAccessError } from "@/lib/data/errors";
import { parseHashtagsInput } from "@/lib/agendamento";
import { fromDateTimeLocalInput } from "@/lib/dates";
import {
  markAsPublishedSchema,
  schedulingWorkspaceSchema,
  updatePublishedUrlSchema,
  type SchedulingWorkspaceInput,
} from "@/lib/validations/agendamento";
import type { ContentItem, ContentItemUpdate } from "@/types/domain";

export type AgendamentoActionResult = { error: string } | { success: true; item: ContentItem };

function revalidateAgendamento(id?: string) {
  revalidatePath("/agendamento");
  if (id) revalidatePath(`/agendamento/${id}`);
  revalidatePath("/publicados");
  revalidatePath("/planejamento/semana");
  revalidatePath("/planejamento/calendario");
  revalidatePath("/hoje");
}

async function authenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function buildSchedulingPatch(data: SchedulingWorkspaceInput): ContentItemUpdate {
  return {
    scheduled_at: fromDateTimeLocalInput(data.scheduledAt),
    caption: data.caption,
    hashtags: parseHashtagsInput(data.hashtags),
    cta: data.cta,
    campaign_id: data.campaignId,
    product_id: data.productId,
    // "Capa" (notas/descrição da capa desta etapa) reaproveita cover_notes,
    // já usado pela Edição (ver migration 20260904150000).
    cover_notes: data.coverNotes,
    scheduling_checklist: data.checklist,
  };
}

/** Autosave de rascunho do workspace de Agendamento — mesmo padrão do autosave de Roteiros/Edição. */
export async function saveSchedulingDraft(id: string, input: unknown): Promise<AgendamentoActionResult> {
  const parsed = schedulingWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Não foi possível salvar o rascunho." };
  }
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const item = await updateContentItem(supabase, id, buildSchedulingPatch(parsed.data));
    revalidateAgendamento(id);
    return { success: true, item };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível salvar o rascunho." };
  }
}

/**
 * "Marcar como publicado" — exige data/hora real (nunca fica sem
 * published_at, reforçado também pelo CHECK constraint
 * content_items_published_requires_published_at no banco). A URL do post é
 * opcional aqui: pode ser adicionada depois via updatePublishedUrl, com
 * alerta visível em Publicados enquanto faltar.
 */
export async function markAsPublished(id: string, input: unknown): Promise<AgendamentoActionResult> {
  const parsed = markAsPublishedSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Informe a data e hora reais de publicação." };
  }
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const item = await updateContentItem(supabase, id, {
      status: "published",
      published_at: fromDateTimeLocalInput(parsed.data.publishedAt),
      published_url: parsed.data.publishedUrl,
    });
    revalidateAgendamento(id);
    return { success: true, item };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível marcar como publicado." };
  }
}

/** Adiciona ou corrige a URL do post depois de já publicado. */
export async function updatePublishedUrl(id: string, input: unknown): Promise<AgendamentoActionResult> {
  const parsed = updatePublishedUrlSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "URL inválida." };
  }
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const item = await updateContentItem(supabase, id, { published_url: parsed.data.publishedUrl });
    revalidateAgendamento(id);
    return { success: true, item };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível salvar a URL do post." };
  }
}

/**
 * "Duplicar como reaproveitamento": cria um novo content_item a partir de
 * um já publicado, com source_content_id apontando para o original — nunca
 * altera o publicado. O original nunca é sobrescrito nem perde seu
 * histórico.
 */
export async function duplicateAsRepurposed(originalId: string): Promise<AgendamentoActionResult> {
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const original = await getContentItemById(supabase, originalId);
    if (!original) return { error: "Conteúdo original não encontrado." };
    const item = await repurposeContentItem(supabase, original);
    revalidateAgendamento();
    revalidatePath("/ideias");
    return { success: true, item };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível duplicar como reaproveitamento." };
  }
}
