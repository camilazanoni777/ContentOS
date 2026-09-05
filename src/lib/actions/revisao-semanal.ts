"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { completeWeeklyReview, upsertWeeklyReview } from "@/lib/data/weekly-reviews";
import { DataAccessError } from "@/lib/data/errors";
import { weeklyReviewSchema } from "@/lib/validations/revisao-semanal";
import type { WeeklyReview } from "@/types/domain";

export type WeeklyReviewActionResult = { error: string } | { success: true; review: WeeklyReview };

/**
 * Salva os campos manuais da Revisão Semanal — upsert em weekly_reviews
 * (user_id, week_start), a MESMA linha que o Planejamento Semanal usa
 * (ver actions/planejamento.ts#saveWeeklyPlan) — nunca cria uma segunda
 * linha para a mesma semana.
 */
export async function saveWeeklyReview(weekStart: string, input: unknown): Promise<WeeklyReviewActionResult> {
  const parsed = weeklyReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Não foi possível salvar a revisão semanal." };
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
      what_worked: parsed.data.whatWorked,
      what_didnt_work: parsed.data.whatDidntWork,
      what_to_repeat: parsed.data.whatToRepeat,
      what_to_stop: parsed.data.whatToStop,
      what_to_test: parsed.data.whatToTest,
      key_learning: parsed.data.keyLearning,
      decision: parsed.data.decision,
    });
    revalidatePath("/revisao-semanal");
    revalidatePath("/hoje");
    return { success: true, review };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível salvar a revisão semanal." };
  }
}

/** Marca a revisão da semana como concluída (completed_at) — exige que já exista uma linha (salva pela ação acima, ou pelo Planejamento Semanal). */
export async function markWeeklyReviewComplete(reviewId: string, decision: string): Promise<WeeklyReviewActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const review = await completeWeeklyReview(supabase, reviewId, decision);
    revalidatePath("/revisao-semanal");
    return { success: true, review };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível concluir a revisão semanal." };
  }
}
