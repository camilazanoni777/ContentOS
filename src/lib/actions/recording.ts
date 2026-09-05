"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { updateContentItem } from "@/lib/data/content-items";
import {
  addSessionItems,
  createRecordingSession,
  deleteRecordingSession,
  removeSessionItem,
  reorderSessionItems as persistReorderSessionItems,
  updateRecordingSession,
} from "@/lib/data/recording-sessions";
import { DataAccessError } from "@/lib/data/errors";
import { recordingChecklistSchema, recordingSessionSchema, type RecordingSessionInput } from "@/lib/validations/recording-session";
import type { ContentItem, RecordingSession } from "@/types/domain";
import { z } from "zod";

export type RecordingSessionResult = { error: string } | { success: true; session: RecordingSession };
export type ContentItemResult = { error: string } | { success: true; item: ContentItem };
export type SimpleResult = { error: string } | { success: true };

function revalidateGravacao() {
  revalidatePath("/gravacao");
  revalidatePath("/edicao");
  revalidatePath("/hoje");
}

async function authenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function sessionPatch(data: RecordingSessionInput) {
  return {
    session_date: data.sessionDate,
    location: data.location,
    scenario: data.scenario,
    outfit: data.outfit,
    equipment: data.equipment,
    available_minutes: data.availableMinutes,
    notes: data.notes,
  };
}

export async function createSession(input: unknown): Promise<RecordingSessionResult> {
  const parsed = recordingSessionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os dados da sessão." };
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const session = await createRecordingSession(supabase, { user_id: user.id, ...sessionPatch(parsed.data) });
    revalidateGravacao();
    return { success: true, session };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível criar a sessão." };
  }
}

export async function updateSession(id: string, input: unknown): Promise<RecordingSessionResult> {
  const parsed = recordingSessionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os dados da sessão." };
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const session = await updateRecordingSession(supabase, id, sessionPatch(parsed.data));
    revalidateGravacao();
    return { success: true, session };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível atualizar a sessão." };
  }
}

export async function deleteSession(id: string): Promise<SimpleResult> {
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    await deleteRecordingSession(supabase, id);
    revalidateGravacao();
    return { success: true };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível excluir a sessão." };
  }
}

const addItemsSchema = z.object({
  sessionId: z.string().uuid(),
  contentItemIds: z.array(z.string().uuid()).min(1, "Selecione ao menos um conteúdo."),
  startingSortOrder: z.number().int().min(0),
});

export async function addItemsToSession(input: unknown): Promise<SimpleResult> {
  const parsed = addItemsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Não foi possível adicionar os conteúdos." };
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    await addSessionItems(supabase, user.id, parsed.data.sessionId, parsed.data.contentItemIds, parsed.data.startingSortOrder);
    revalidateGravacao();
    return { success: true };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível adicionar os conteúdos à sessão." };
  }
}

export async function removeItemFromSession(sessionItemId: string): Promise<SimpleResult> {
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    await removeSessionItem(supabase, sessionItemId);
    revalidateGravacao();
    return { success: true };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível remover o item da sessão." };
  }
}

const reorderSchema = z.array(z.object({ id: z.string().uuid(), sortOrder: z.number().int().min(0) }));

export async function reorderSessionItems(updates: unknown): Promise<SimpleResult> {
  const parsed = reorderSchema.safeParse(updates);
  if (!parsed.success) return { error: "Não foi possível salvar a nova ordem." };
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    await persistReorderSessionItems(
      supabase,
      parsed.data.map((entry) => ({ id: entry.id, sortOrder: entry.sortOrder })),
    );
    revalidateGravacao();
    return { success: true };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível salvar a nova ordem." };
  }
}

export async function saveRecordingChecklist(contentItemId: string, checklist: unknown): Promise<ContentItemResult> {
  const parsed = recordingChecklistSchema.safeParse(checklist);
  if (!parsed.success) return { error: "Não foi possível salvar o checklist." };
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const item = await updateContentItem(supabase, contentItemId, { recording_checklist: parsed.data });
    revalidateGravacao();
    return { success: true, item };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível salvar o checklist." };
  }
}

/** "Marcar como gravado" — sempre um UPDATE no mesmo content_item (nunca um novo registro). */
export async function markAsRecorded(contentItemId: string): Promise<ContentItemResult> {
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const item = await updateContentItem(supabase, contentItemId, { status: "recorded" });
    revalidateGravacao();
    return { success: true, item };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível marcar como gravado." };
  }
}
