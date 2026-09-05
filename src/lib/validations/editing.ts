import { z } from "zod";

import { EDIT_CHECKLIST_KEYS } from "@/types/domain";

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
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

export const editVisualReferenceSchema = z.object({
  label: z.string().trim().max(200, "Rótulo muito longo."),
  url: z.string().trim().max(2000, "Link muito longo."),
});

/** Objeto fixo com as 9 chaves do checklist de qualidade da edição. */
export const editChecklistSchema = z.object(
  Object.fromEntries(EDIT_CHECKLIST_KEYS.map((key) => [key, z.boolean()])) as Record<
    (typeof EDIT_CHECKLIST_KEYS)[number],
    z.ZodBoolean
  >,
);

/**
 * Validação do workspace de Edição. Tudo opcional: o rascunho pode ser
 * salvo parcialmente a qualquer momento (autosave), como em Roteiros.
 */
export const editWorkspaceSchema = z.object({
  rawFileUrl: optionalUrl(),
  editedFileUrl: optionalUrl(),
  editorName: optionalText(200, "Nome do editor muito longo."),
  editInstructions: optionalText(3000, "Instruções muito longas."),
  visualReferences: z.array(editVisualReferenceSchema).max(20, "Referências visuais demais."),
  cutsNotes: optionalText(2000, "Notas de cortes muito longas."),
  onScreenTextNotes: optionalText(2000, "Notas de texto na tela muito longas."),
  captionsNotes: optionalText(2000, "Notas de legendas muito longas."),
  audioNotes: optionalText(2000, "Notas de áudio muito longas."),
  coverNotes: optionalText(2000, "Notas de capa muito longas."),
  dueAt: optionalText(10, "Prazo inválido."),
  checklist: editChecklistSchema,
});

export type EditWorkspaceInput = z.infer<typeof editWorkspaceSchema>;

export const reviewCommentSchema = z.object({
  body: z.string().trim().min(1, "Escreva um comentário antes de enviar.").max(2000, "Comentário muito longo."),
  authorName: optionalText(200, "Nome muito longo."),
});
