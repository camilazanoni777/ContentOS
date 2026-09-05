"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  archiveContentItem,
  createContentItem,
  deleteContentItemPermanently,
  restoreContentItem,
  updateContentItem,
} from "@/lib/data/content-items";
import { DataAccessError } from "@/lib/data/errors";
import { contentItemFormSchema, quickIdeaSchema } from "@/lib/validations/content-item";
import type { ContentItem, ContentItemUpdate, ContentStatus } from "@/types/domain";
import { CONTENT_STATUS_ORDER } from "@/types/domain";
import { z } from "zod";

export type QuickCaptureResult = { error: string } | { success: true };
export type ContentItemActionResult = { error: string } | { success: true; item: ContentItem };

const pipelinePaths = ["/ideias", "/roteiros", "/gravacao", "/edicao", "/agendamento", "/publicados", "/hoje"];

function revalidatePipeline() {
  for (const path of pipelinePaths) revalidatePath(path);
}

async function authenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function nullable(value: string | undefined): string | null {
  return value?.trim() || null;
}

function formPatch(data: ReturnType<typeof contentItemFormSchema.parse>): ContentItemUpdate {
  return {
    title: data.title,
    hook: nullable(data.hook),
    summary: nullable(data.summary),
    pillar: nullable(data.pillar),
    format: nullable(data.format),
    objective: nullable(data.objective),
    reference_text: nullable(data.referenceText),
    reference_url: nullable(data.referenceUrl),
    potential: nullable(data.potential),
    production_ease: nullable(data.productionEase),
    priority: nullable(data.priority),
    status: data.status,
    can_be_series: data.canBeSeries,
    series_id: data.seriesId || null,
    audience_intent: nullable(data.audienceIntent),
    cta: nullable(data.cta),
    notes: nullable(data.notes),
    tags: [...new Set(data.tags.map((tag) => tag.trim()).filter(Boolean))],
  };
}

/**
 * Server Action usada pelo QuickCaptureButton/Drawer. Cria um content_item
 * mínimo com status "idea" — o caminho padrão de criação de ideias.
 */
export async function createQuickContentIdea(input: unknown): Promise<QuickCaptureResult> {
  const parsed = quickIdeaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dê um título para a ideia antes de salvar." };
  }

  const { supabase, user } = await authenticatedClient();

  if (!user) {
    return { error: "Sua sessão expirou. Entre novamente para salvar a ideia." };
  }

  try {
    await createContentItem(supabase, {
      user_id: user.id,
      title: parsed.data.title,
      hook: parsed.data.hook || null,
      pillar: parsed.data.pillar || null,
      reference_text: parsed.data.referenceText || null,
    });
  } catch (error) {
    const message = error instanceof DataAccessError ? error.message : "Não foi possível salvar a ideia.";
    return { error: message };
  }

  revalidatePipeline();
  return { success: true };
}

export async function createContentIdea(input: unknown): Promise<ContentItemActionResult> {
  const parsed = contentItemFormSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os campos da ideia." };
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };

  try {
    const patch = formPatch(parsed.data);
    const item = await createContentItem(supabase, {
      user_id: user.id,
      title: parsed.data.title,
      ...patch,
    });
    revalidatePipeline();
    return { success: true, item };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível criar a ideia." };
  }
}

const quickUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  priority: z.enum(["alta", "media", "baixa"]).nullable().optional(),
});

export async function quickUpdateContentIdea(id: string, input: unknown): Promise<ContentItemActionResult> {
  const parsed = quickUpdateSchema.safeParse(input);
  if (!parsed.success) return { error: "Não foi possível validar a edição rápida." };
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const item = await updateContentItem(supabase, id, parsed.data);
    revalidatePipeline();
    return { success: true, item };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível atualizar a ideia." };
  }
}

export async function updateContentIdea(id: string, input: unknown): Promise<ContentItemActionResult> {
  const parsed = contentItemFormSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os campos da ideia." };
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };

  try {
    const item = await updateContentItem(supabase, id, formPatch(parsed.data));
    revalidatePipeline();
    return { success: true, item };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível atualizar a ideia." };
  }
}

export async function updateContentStatus(id: string, status: ContentStatus): Promise<ContentItemActionResult> {
  if (!CONTENT_STATUS_ORDER.includes(status)) return { error: "Status inválido." };
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const item = await updateContentItem(supabase, id, { status });
    revalidatePipeline();
    return { success: true, item };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível mover o conteúdo." };
  }
}

export async function archiveContentIdea(id: string): Promise<ContentItemActionResult> {
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const item = await archiveContentItem(supabase, id);
    revalidatePipeline();
    return { success: true, item };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível arquivar a ideia." };
  }
}

export async function restoreContentIdea(id: string): Promise<ContentItemActionResult> {
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const item = await restoreContentItem(supabase, id);
    revalidatePipeline();
    return { success: true, item };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível restaurar a ideia." };
  }
}

export async function deleteContentIdeaPermanently(id: string, confirmation: string): Promise<{ error: string } | { success: true }> {
  if (confirmation !== "EXCLUIR") return { error: "Digite EXCLUIR para confirmar a exclusão permanente." };
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    await deleteContentItemPermanently(supabase, id);
    revalidatePipeline();
    return { success: true };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível excluir a ideia." };
  }
}
