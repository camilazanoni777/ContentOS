"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { updateContentItem } from "@/lib/data/content-items";
import { createReviewComment, updateReviewCommentStatus } from "@/lib/data/content-review-comments";
import { DataAccessError } from "@/lib/data/errors";
import { getNextEditingStatus } from "@/lib/editing";
import { editWorkspaceSchema, reviewCommentSchema, type EditWorkspaceInput } from "@/lib/validations/editing";
import type { ContentItem, ContentItemUpdate, ContentReviewComment, ContentStatus, ReviewCommentStatus } from "@/types/domain";
import type { Json } from "@/types/database";

export type EditingActionResult = { error: string } | { success: true; item: ContentItem };
export type ReviewCommentResult = { error: string } | { success: true; comment: ContentReviewComment };

function revalidateEdicao(id: string) {
  revalidatePath("/edicao");
  revalidatePath(`/edicao/${id}`);
  revalidatePath("/gravacao");
  revalidatePath("/agendamento");
  revalidatePath("/hoje");
}

async function authenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function buildEditingPatch(data: EditWorkspaceInput): ContentItemUpdate {
  return {
    raw_file_url: data.rawFileUrl,
    edited_file_url: data.editedFileUrl,
    editor_name: data.editorName,
    // "Instruções de edição" reaproveita editing_notes (campo já existente
    // desde a Fase 1) — ver comentário na migration 20260904150000.
    editing_notes: data.editInstructions,
    edit_visual_references: data.visualReferences as unknown as Json,
    edit_cuts_notes: data.cutsNotes,
    edit_on_screen_text_notes: data.onScreenTextNotes,
    edit_captions_notes: data.captionsNotes,
    edit_audio_notes: data.audioNotes,
    // "Capa" reaproveita cover_notes; "Prazo" reaproveita production_due_at
    // (já usado por Hoje/alertas) — mesmo raciocínio.
    cover_notes: data.coverNotes,
    production_due_at: data.dueAt,
    edit_checklist: data.checklist,
  };
}

/** Autosave de rascunho do workspace de Edição — mesmo padrão do autosave de Roteiros. */
export async function saveEditingDraft(id: string, input: unknown): Promise<EditingActionResult> {
  const parsed = editWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Não foi possível salvar o rascunho." };
  }
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const item = await updateContentItem(supabase, id, buildEditingPatch(parsed.data));
    revalidateEdicao(id);
    return { success: true, item };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível salvar o rascunho." };
  }
}

/**
 * Avança o status de edição (recorded -> editing -> awaiting_approval ->
 * scheduled), sempre um UPDATE no mesmo registro — o histórico em
 * content_status_history é gerado pelo trigger de sempre. Salva o
 * formulário mais recente antes de mudar de etapa, mesmo que o debounce do
 * autosave ainda não tenha disparado (mesmo cuidado de Roteiros).
 */
export async function advanceEditingStatus(id: string, currentStatus: ContentStatus, input: unknown): Promise<EditingActionResult> {
  const nextStatus = getNextEditingStatus(currentStatus);
  if (!nextStatus) return { error: "Não há próxima etapa de edição a partir daqui." };

  const parsed = editWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os campos antes de avançar." };
  }
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    await updateContentItem(supabase, id, buildEditingPatch(parsed.data));
    const item = await updateContentItem(supabase, id, { status: nextStatus });
    revalidateEdicao(id);
    return { success: true, item };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível avançar a etapa." };
  }
}

export async function addReviewComment(contentItemId: string, input: unknown): Promise<ReviewCommentResult> {
  const parsed = reviewCommentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Não foi possível enviar o comentário." };
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const comment = await createReviewComment(supabase, {
      user_id: user.id,
      content_item_id: contentItemId,
      author_name: parsed.data.authorName,
      body: parsed.data.body,
    });
    revalidateEdicao(contentItemId);
    return { success: true, comment };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível enviar o comentário." };
  }
}

export async function setReviewCommentStatus(
  contentItemId: string,
  commentId: string,
  status: ReviewCommentStatus,
): Promise<ReviewCommentResult> {
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const comment = await updateReviewCommentStatus(supabase, commentId, status);
    revalidateEdicao(contentItemId);
    return { success: true, comment };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível atualizar o comentário." };
  }
}
