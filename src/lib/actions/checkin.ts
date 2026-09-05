"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DataAccessError } from "@/lib/data/errors";
import { getActiveAccount } from "@/lib/data/instagram-accounts";
import { getDailyCheckin, upsertDailyCheckin } from "@/lib/data/daily-checkins";
import {
  addCustomChecklistAction,
  setDailyActionActive,
  toggleDailyAction,
} from "@/lib/data/daily-actions";
import { todayISODate } from "@/lib/dates";
import {
  customChecklistItemSchema,
  fullCheckinSchema,
  type FullCheckinValues,
} from "@/lib/validations/checkin";
import type { DailyCheckin, DailyCheckinInsert, InstagramAccount } from "@/types/domain";
import type { DbClient } from "@/lib/data/types";
import type { User } from "@supabase/supabase-js";

export type CheckinActionResult =
  | { error: string }
  | { success: true; checkin: DailyCheckin; savedAt: string };

type CheckinContext =
  | { error: string }
  | { supabase: DbClient; user: User; account: InstagramAccount };

async function requireContext(): Promise<CheckinContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sua sessão expirou. Entre novamente para continuar o check-in." };
  }

  const account = await getActiveAccount(supabase);
  if (!account) {
    return {
      error: "Cadastre uma conta do Instagram em Configurações antes de fazer o check-in.",
    };
  }

  return { supabase, user, account };
}

function priorityToJson(priorities: FullCheckinValues["priorities"]) {
  // Mantém as mesmas chaves (camelCase) do tipo CheckinPriority usado pela
  // UI — evita uma camada de tradução snake_case <-> camelCase só para o
  // conteúdo de um campo jsonb que a aplicação é a única a ler/escrever.
  return priorities.map((priority) => ({
    label: priority.label,
    contentItemId: priority.contentItemId,
    goalId: priority.goalId,
  }));
}

function buildPatch(
  userId: string,
  accountId: string,
  today: string,
  data: FullCheckinValues,
): DailyCheckinInsert {
  return {
    user_id: userId,
    account_id: accountId,
    checkin_date: today,
    objective_main: data.objectiveMain,
    priorities: priorityToJson(data.priorities),
    main_content_item_id: data.mainContentItemId,
    planned_stories: data.plannedStories,
    focus_product_id: data.focusProductId,
    focus_campaign_id: data.focusCampaignId,
    observed_trend: data.observedTrend,
    community_action: data.communityAction,
    notes: data.notes,
    daily_learning: data.dailyLearning,
    evening_wins: data.eveningWins,
    evening_blockers: data.eveningBlockers,
    tomorrow_priority: data.tomorrowPriority,
  };
}

/**
 * Autosave de rascunho do check-in do dia — cobre TODOS os campos da tela
 * (dia + fechamento noturno) num único upsert. Sempre um upsert (nunca um
 * insert cru): a constraint única (user_id, account_id, checkin_date)
 * garante que nunca existam dois registros para o mesmo dia e conta, então
 * chamar isto repetidamente (a cada pausa de digitação) é seguro e nunca
 * duplica o check-in do dia.
 */
export async function saveCheckinDraft(input: unknown): Promise<CheckinActionResult> {
  const parsed = fullCheckinSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Não foi possível salvar o rascunho." };
  }

  const context = await requireContext();
  if ("error" in context) {
    return context;
  }
  const { supabase, user, account } = context;
  const today = todayISODate();
  const patch = buildPatch(user.id, account.id, today, parsed.data);

  try {
    const checkin = await upsertDailyCheckin(supabase, patch);
    revalidatePath("/checkin");
    revalidatePath("/hoje");
    return { success: true, checkin, savedAt: new Date().toISOString() };
  } catch (error) {
    const message = error instanceof DataAccessError ? error.message : "Não foi possível salvar o check-in.";
    return { error: message };
  }
}

/**
 * Fechamento noturno: salva os mesmos campos do autosave (garantindo que o
 * valor mais recente da tela seja persistido, mesmo que o debounce do
 * autosave ainda não tenha disparado) e, além disso, grava
 * `night_closed_at` — o que marca que a usuária concluiu o ritual
 * deliberadamente, distinto de só ter rascunho salvo.
 */
export async function saveNightClosing(input: unknown): Promise<CheckinActionResult> {
  const parsed = fullCheckinSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Não foi possível salvar o fechamento." };
  }

  const context = await requireContext();
  if ("error" in context) {
    return context;
  }
  const { supabase, user, account } = context;
  const today = todayISODate();
  const patch: DailyCheckinInsert = {
    ...buildPatch(user.id, account.id, today, parsed.data),
    night_closed_at: new Date().toISOString(),
  };

  try {
    const checkin = await upsertDailyCheckin(supabase, patch);
    revalidatePath("/checkin");
    revalidatePath("/hoje");
    return { success: true, checkin, savedAt: new Date().toISOString() };
  } catch (error) {
    const message = error instanceof DataAccessError ? error.message : "Não foi possível salvar o fechamento noturno.";
    return { error: message };
  }
}

export type ToggleActionResult = { error: string } | { success: true };

export async function toggleChecklistAction(id: string, isDone: boolean): Promise<ToggleActionResult> {
  const context = await requireContext();
  if ("error" in context) {
    return context;
  }
  try {
    await toggleDailyAction(context.supabase, id, isDone);
  } catch (error) {
    const message = error instanceof DataAccessError ? error.message : "Não foi possível salvar essa ação.";
    return { error: message };
  }
  revalidatePath("/checkin");
  revalidatePath("/hoje");
  return { success: true };
}

export async function setChecklistActionActive(id: string, isActive: boolean): Promise<ToggleActionResult> {
  const context = await requireContext();
  if ("error" in context) {
    return context;
  }
  try {
    await setDailyActionActive(context.supabase, id, isActive);
  } catch (error) {
    const message = error instanceof DataAccessError ? error.message : "Não foi possível atualizar esse item.";
    return { error: message };
  }
  revalidatePath("/checkin");
  revalidatePath("/hoje");
  return { success: true };
}

export async function addCustomChecklistItem(input: unknown): Promise<ToggleActionResult> {
  const parsed = customChecklistItemSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Não foi possível adicionar o item." };
  }

  const context = await requireContext();
  if ("error" in context) {
    return context;
  }
  const { supabase, user } = context;
  const today = todayISODate();
  const existing = await getDailyCheckin(supabase, context.account.id, today);

  try {
    await addCustomChecklistAction(supabase, user.id, today, existing?.id ?? null, parsed.data.label);
  } catch (error) {
    const message = error instanceof DataAccessError ? error.message : "Não foi possível adicionar o item.";
    return { error: message };
  }
  revalidatePath("/checkin");
  return { success: true };
}
