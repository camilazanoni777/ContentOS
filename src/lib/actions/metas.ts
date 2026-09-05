"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createGoal, updateGoal, deleteGoal } from "@/lib/data/goals";
import { getAppSettings, updateAppSettings } from "@/lib/data/app-settings";
import { DataAccessError } from "@/lib/data/errors";
import { goalSchema } from "@/lib/validations/goal";
import { withDefaultGoalTargets, type DefaultGoalTargets } from "@/lib/metas";
import type { Goal, GoalInsert, Json } from "@/types/domain";

export type GoalResult = { error: string } | { success: true; goal: Goal };
export type SimpleResult = { error: string } | { success: true };

function revalidateMetas() {
  revalidatePath("/metas");
}

async function authenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function saveGoal(input: unknown, existingId?: string): Promise<GoalResult> {
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os dados desta meta." };
  }
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };

  const data = parsed.data;
  const payload: GoalInsert = {
    user_id: user.id,
    period_type: data.periodType,
    period_start: data.periodStart,
    period_end: data.periodEnd,
    metric: data.metric,
    target_value: data.targetValue,
    initial_value: data.initialValue,
    notes: data.notes,
  };

  try {
    const goal = existingId ? await updateGoal(supabase, existingId, payload) : await createGoal(supabase, payload);
    revalidateMetas();
    return { success: true, goal };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível salvar esta meta." };
  }
}

export async function removeGoal(id: string): Promise<SimpleResult> {
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    await deleteGoal(supabase, id);
    revalidateMetas();
    return { success: true };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível excluir esta meta." };
  }
}

/** Salva as metas-padrão (valor-alvo sugerido por métrica) de um tipo de período em app_settings.extra — ver getDefaultGoalTargets/withDefaultGoalTargets em src/lib/metas.ts. */
export async function saveDefaultGoalTargets(
  periodType: "weekly" | "monthly",
  targets: DefaultGoalTargets,
): Promise<SimpleResult> {
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const settings = await getAppSettings(supabase, user.id);
    const nextExtra = withDefaultGoalTargets(settings?.extra ?? {}, periodType, targets);
    await updateAppSettings(supabase, user.id, { extra: nextExtra as Json });
    revalidateMetas();
    return { success: true };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível salvar as metas-padrão." };
  }
}
