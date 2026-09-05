"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { updateContentItem } from "@/lib/data/content-items";
import { createScriptVersion, listScriptVersions } from "@/lib/data/script-versions";
import { DataAccessError } from "@/lib/data/errors";
import {
  hasScriptSnapshotChanged,
  parseScriptSnapshot,
  shouldSkipAutoVersion,
} from "@/lib/script-workspace";
import { scriptFormSchema, type ScriptFormInput } from "@/lib/validations/script";
import type { ContentItem, ContentItemUpdate, ContentStatus, ScriptSnapshot } from "@/types/domain";
import { CONTENT_STATUS_ORDER } from "@/types/domain";
import type { Json } from "@/types/database";
import type { DbClient } from "@/lib/data/types";

export type ScriptActionResult = { error: string } | { success: true; item: ContentItem };

async function authenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function revalidateScriptPaths(id: string) {
  revalidatePath("/roteiros");
  revalidatePath(`/roteiros/${id}`);
  revalidatePath("/gravacao");
  revalidatePath("/ideias");
  revalidatePath("/hoje");
}

function buildScriptPatch(data: ScriptFormInput): ContentItemUpdate {
  return {
    summary: data.summary,
    objective: data.objective,
    pillar: data.pillar,
    audience_intent: data.audienceIntent,
    format: data.format,
    cta: data.cta,
    reference_text: data.referenceText,
    reference_url: data.referenceUrl,
    hook: data.hook,
    hook_variations: data.hookVariations,
    script: data.script,
    script_structure: data.scriptStructure,
    on_screen_text: data.onScreenText,
    shot_list: data.shotList,
    caption: data.caption,
    recording_notes: data.recordingNotes,
    estimated_duration_seconds: data.estimatedDurationSeconds,
    script_checklist: data.scriptChecklist,
  };
}

function buildSnapshot(data: ScriptFormInput): ScriptSnapshot {
  return {
    hook: data.hook,
    hookVariations: data.hookVariations,
    script: data.script,
    scriptStructure: data.scriptStructure,
    onScreenText: data.onScreenText,
    shotList: data.shotList,
    caption: data.caption,
    estimatedDurationSeconds: data.estimatedDurationSeconds,
  };
}

/**
 * Cria uma nova versão no histórico quando o conteúdo realmente mudou desde
 * a última versão salva. No autosave (force: false), respeita um throttle
 * (VERSION_AUTOSAVE_THROTTLE_MS) para não encher o histórico a cada pausa
 * de digitação; o botão "Salvar rascunho" (force: true) ignora o throttle,
 * mas ainda assim não duplica uma versão idêntica à última.
 */
async function maybeSaveVersion(
  supabase: DbClient,
  userId: string,
  contentItemId: string,
  snapshot: ScriptSnapshot,
  options: { force: boolean },
): Promise<void> {
  const [latest] = await listScriptVersions(supabase, contentItemId, 1);
  const previousSnapshot = latest ? parseScriptSnapshot(latest.snapshot) : null;

  if (!hasScriptSnapshotChanged(previousSnapshot, snapshot)) return;
  if (!options.force && shouldSkipAutoVersion(latest?.created_at)) return;

  await createScriptVersion(supabase, {
    user_id: userId,
    content_item_id: contentItemId,
    snapshot: snapshot as unknown as Json,
  });
}

/**
 * Autosave de rascunho do workspace de roteirização — chamado pelo
 * useAutosave a cada pausa de digitação. Salva os campos em content_items e,
 * se o conteúdo mudou o suficiente (e o throttle permitir), registra uma
 * versão no histórico.
 */
export async function saveScriptDraft(id: string, input: unknown): Promise<ScriptActionResult> {
  const parsed = scriptFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Não foi possível salvar o rascunho." };
  }

  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };

  try {
    const item = await updateContentItem(supabase, id, buildScriptPatch(parsed.data));
    await maybeSaveVersion(supabase, user.id, id, buildSnapshot(parsed.data), { force: false });
    revalidateScriptPaths(id);
    return { success: true, item };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível salvar o rascunho." };
  }
}

/**
 * "Salvar rascunho" explícito (botão): garante que o valor mais recente da
 * tela seja persistido mesmo que o debounce do autosave ainda não tenha
 * disparado, e força uma versão no histórico (ignorando o throttle) sempre
 * que o conteúdo for diferente da última versão salva.
 */
export async function saveScriptVersionNow(id: string, input: unknown): Promise<ScriptActionResult> {
  const parsed = scriptFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Não foi possível salvar." };
  }

  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };

  try {
    const item = await updateContentItem(supabase, id, buildScriptPatch(parsed.data));
    await maybeSaveVersion(supabase, user.id, id, buildSnapshot(parsed.data), { force: true });
    revalidateScriptPaths(id);
    return { success: true, item };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível salvar o rascunho." };
  }
}

/**
 * Move o status do conteúdo (usado por "Voltar etapa" e "Marcar como pronto
 * para gravar"). É um UPDATE no mesmo registro — nunca cria um novo
 * content_item — e o histórico em content_status_history é gerado
 * automaticamente pelo trigger, não por esta função.
 */
export async function moveScriptStatus(id: string, status: ContentStatus): Promise<ScriptActionResult> {
  if (!CONTENT_STATUS_ORDER.includes(status)) return { error: "Status inválido." };

  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };

  try {
    const item = await updateContentItem(supabase, id, { status });
    revalidateScriptPaths(id);
    return { success: true, item };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível mover o conteúdo." };
  }
}
