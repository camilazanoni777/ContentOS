"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createContentItem } from "@/lib/data/content-items";
import { DataAccessError } from "@/lib/data/errors";
import { quickIdeaSchema } from "@/lib/validations/content-item";

export type QuickCaptureResult = { error: string } | { success: true };

/**
 * Server Action usada pelo QuickCaptureButton/Drawer. Cria um content_item
 * mínimo com status "idea" — o caminho padrão de criação de ideias.
 */
export async function createQuickContentIdea(input: unknown): Promise<QuickCaptureResult> {
  const parsed = quickIdeaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dê um título para a ideia antes de salvar." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  revalidatePath("/ideias");
  revalidatePath("/hoje");
  return { success: true };
}
