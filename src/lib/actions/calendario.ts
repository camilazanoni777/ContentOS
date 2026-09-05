"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getContentItemById, updateContentItem } from "@/lib/data/content-items";
import {
  createCalendarImportantDate,
  deleteCalendarImportantDate,
  updateCalendarImportantDate,
} from "@/lib/data/calendar-important-dates";
import { DataAccessError } from "@/lib/data/errors";
import { changeInstantDate } from "@/lib/dates";
import { isDraggable } from "@/lib/calendario";
import { calendarImportantDateSchema } from "@/lib/validations/calendar-important-date";
import type { CalendarImportantDate, ContentItem } from "@/types/domain";

export type ContentItemResult = { error: string } | { success: true; item: ContentItem };
export type ImportantDateResult = { error: string } | { success: true; date: CalendarImportantDate };
export type SimpleResult = { error: string } | { success: true };

function revalidateCalendario() {
  revalidatePath("/planejamento/calendario");
  revalidatePath("/planejamento/semana");
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

const rescheduleSchema = z.object({
  contentItemId: z.string().uuid(),
  newDateISO: z.string().trim().min(1),
});

/**
 * Reagenda um conteúdo (arrastar-e-soltar no calendário): só muda a data,
 * preservando o horário planejado (ver changeInstantDate). Só conteúdos
 * "scheduled" podem ser arrastados — published_at é um fato consumado e
 * não se reagenda por drag (ver isDraggable em src/lib/calendario.ts).
 * Sempre um UPDATE no mesmo content_item.
 */
export async function rescheduleContent(input: unknown): Promise<ContentItemResult> {
  const parsed = rescheduleSchema.safeParse(input);
  if (!parsed.success) return { error: "Não foi possível reagendar este conteúdo." };
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const current = await getContentItemById(supabase, parsed.data.contentItemId);
    if (!current) return { error: "Conteúdo não encontrado." };
    if (!isDraggable(current)) {
      return { error: "Só conteúdos agendados (ainda não publicados) podem ser arrastados no calendário." };
    }
    const item = await updateContentItem(supabase, current.id, {
      scheduled_at: changeInstantDate(current.scheduled_at, parsed.data.newDateISO),
    });
    revalidateCalendario();
    return { success: true, item };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível reagendar este conteúdo." };
  }
}

export async function createImportantDate(input: unknown): Promise<ImportantDateResult> {
  const parsed = calendarImportantDateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os dados da data importante." };
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const date = await createCalendarImportantDate(supabase, {
      user_id: user.id,
      event_date: parsed.data.eventDate,
      label: parsed.data.label,
      notes: parsed.data.notes,
    });
    revalidateCalendario();
    return { success: true, date };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível criar a data importante." };
  }
}

export async function updateImportantDate(id: string, input: unknown): Promise<ImportantDateResult> {
  const parsed = calendarImportantDateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise os dados da data importante." };
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    const date = await updateCalendarImportantDate(supabase, id, {
      event_date: parsed.data.eventDate,
      label: parsed.data.label,
      notes: parsed.data.notes,
    });
    revalidateCalendario();
    return { success: true, date };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível atualizar a data importante." };
  }
}

export async function deleteImportantDate(id: string): Promise<SimpleResult> {
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    await deleteCalendarImportantDate(supabase, id);
    revalidateCalendario();
    return { success: true };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível excluir a data importante." };
  }
}
