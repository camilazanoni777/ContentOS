import { z } from "zod";

import { SCHEDULING_CHECKLIST_KEYS } from "@/types/domain";

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));

const optionalDateTimeLocal = (message: string) =>
  z
    .string()
    .trim()
    .max(40, message)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));

const optionalUrl = (message = "Use uma URL começando com http:// ou https://.") =>
  z
    .string()
    .trim()
    .max(2000)
    .refine((value) => value === "" || /^https?:\/\//i.test(value), message)
    .transform((value) => (value ? value : null));

/** Objeto fixo com as 6 chaves do checklist final de agendamento. */
export const schedulingChecklistSchema = z.object(
  Object.fromEntries(SCHEDULING_CHECKLIST_KEYS.map((key) => [key, z.boolean()])) as Record<
    (typeof SCHEDULING_CHECKLIST_KEYS)[number],
    z.ZodBoolean
  >,
);

/**
 * Validação do workspace de Agendamento. Tudo opcional — o rascunho pode
 * ser salvo parcialmente a qualquer momento (autosave), como em
 * Roteiros/Edição. A regra "não publicar sem data real" não mora aqui
 * (esse schema é só para o rascunho de agendamento em si); ela é validada
 * separadamente em markAsPublishedSchema, usado só na ação de publicar.
 */
export const schedulingWorkspaceSchema = z.object({
  scheduledAt: optionalDateTimeLocal("Data/hora planejada inválida."),
  caption: optionalText(2200, "Legenda muito longa."),
  hashtags: optionalText(500, "Palavras-chave/hashtags muito longas."),
  cta: optionalText(300, "CTA muito longo."),
  campaignId: optionalText(100, "Campanha inválida."),
  productId: optionalText(100, "Produto inválido."),
  coverNotes: optionalText(1000, "Notas de capa muito longas."),
  checklist: schedulingChecklistSchema,
});

export type SchedulingWorkspaceInput = z.infer<typeof schedulingWorkspaceSchema>;

/**
 * Validação da ação "Marcar como publicado": published_at é obrigatório e
 * precisa ser uma data/hora real (não vazia) — reforço em app do mesmo
 * CHECK constraint que existe no banco (migration 20260904160000). A URL
 * do post é opcional aqui de propósito: pode ser adicionada depois, com
 * alerta visível na lista enquanto faltar.
 */
export const markAsPublishedSchema = z.object({
  publishedAt: z
    .string()
    .trim()
    .min(1, "Informe a data e hora reais de publicação.")
    .max(40, "Data/hora inválida."),
  publishedUrl: optionalUrl(),
});

export type MarkAsPublishedInput = z.infer<typeof markAsPublishedSchema>;

/** Validação de "adicionar/editar URL do post depois de publicado". */
export const updatePublishedUrlSchema = z.object({
  publishedUrl: optionalUrl(),
});
