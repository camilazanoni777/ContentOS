"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { upsertWeeklyReview } from "@/lib/data/weekly-reviews";
import { DataAccessError } from "@/lib/data/errors";
import { weeklyPlanSchema } from "@/lib/validations/planejamento-semanal";
import type { WeeklyReview } from "@/types/domain";

export type WeeklyPlanActionResult = { error: string } | { success: true; review: WeeklyReview };

/**
 * Salva o plano da semana — upsert em weekly_reviews (user_id, week_start),
 * mesma linha que a futura Revisão Semanal (Fase 7) usa para
 * strategic_analysis/decision/completed_at. Nunca cria uma linha nova por
 * semana já existente: sempre a mesma, atualizada.
 */
export async function saveWeeklyPlan(weekStart: string, input: unknown): Promise<WeeklyPlanActionResult> {
  const parsed = weeklyPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Não foi possível salvar o plano da semana." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const review = await upsertWeeklyReview(supabase, {
      user_id: user.id,
      week_start: weekStart,
      strategic_focus: parsed.data.strategicFocus,
      weekly_experiment: parsed.data.weeklyExperiment,
      priority_content_id: parsed.data.priorityContentId,
      active_campaign_id: parsed.data.activeCampaignId,
      planned_hours: parsed.data.plannedHours,
    });
    revalidatePath("/planejamento/semana");
    revalidatePath("/hoje");
    return { success: true, review };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível salvar o plano da semana." };
  }
}
