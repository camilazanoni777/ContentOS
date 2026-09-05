"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { dismissAlert, deferAlert } from "@/lib/data/alert-dismissals";
import { DataAccessError } from "@/lib/data/errors";

export type AlertActionResult = { error: string } | { success: true };

/** Dispensa um alerta (some indefinidamente, até a condição mudar). */
export async function dismissAlertAction(alertKey: string): Promise<AlertActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    await dismissAlert(supabase, user.id, alertKey);
    revalidatePath("/alertas");
    revalidatePath("/hoje");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível dispensar o alerta." };
  }
}

/** Adia um alerta por `days` dias — some até lá, depois volta a aparecer normalmente. */
export async function deferAlertAction(alertKey: string, days: number): Promise<AlertActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const snoozedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    await deferAlert(supabase, user.id, alertKey, snoozedUntil);
    revalidatePath("/alertas");
    revalidatePath("/hoje");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível adiar o alerta." };
  }
}
