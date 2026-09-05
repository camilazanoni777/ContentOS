import { z } from "zod";

import { SCRIPT_CHECKLIST_KEYS } from "@/types/domain";

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));

export const HOOK_VARIATIONS_MAX = 5;

export const scriptStructureBlockSchema = z.object({
  content: z.string().trim().max(2000, "Bloco muito longo."),
  note: optionalText(500, "Nota muito longa."),
});

export const shotListItemSchema = z.object({
  type: z.enum(["take", "broll"]),
  description: z.string().trim().max(500, "Descrição muito longa."),
});

/** Objeto fixo com as 6 chaves do checklist de roteiro — sempre presentes (checkbox nunca é "indefinido"). */
export const scriptChecklistSchema = z.object(
  Object.fromEntries(SCRIPT_CHECKLIST_KEYS.map((key) => [key, z.boolean()])) as Record<
    (typeof SCRIPT_CHECKLIST_KEYS)[number],
    z.ZodBoolean
  >,
);

const durationSecondsSchema = z
  .string()
  .trim()
  .max(6, "Duração muito longa.")
  .refine((value) => value === "" || /^\d+$/.test(value), "Use só números (segundos).")
  .transform((value) => (value === "" ? null : Number(value)));

/**
 * Validação do workspace de roteirização. Cobre tanto os campos de briefing
 * (objetivo, pilar, público, formato, CTA, referência — já existentes em
 * content_items desde o Banco de Ideias) quanto os campos específicos de
 * roteiro. Tudo opcional: o rascunho pode ser salvo parcialmente a
 * qualquer momento (autosave).
 */
export const scriptFormSchema = z.object({
  summary: optionalText(2000, "Resumo muito longo."),
  objective: optionalText(60, "Objetivo inválido."),
  pillar: optionalText(80, "Pilar muito longo."),
  audienceIntent: optionalText(1000, "Público muito longo."),
  format: optionalText(40, "Formato inválido."),
  cta: optionalText(500, "CTA muito longo."),
  referenceText: optionalText(1000, "Referência muito longa."),
  referenceUrl: z
    .string()
    .trim()
    .max(2000)
    .refine((value) => value === "" || /^https?:\/\//i.test(value), "Use uma URL começando com http:// ou https://.")
    .transform((value) => (value ? value : null)),
  hook: optionalText(500, "Gancho muito longo."),
  hookVariations: z
    .array(z.string().trim().max(280, "Variação de gancho muito longa."))
    .max(HOOK_VARIATIONS_MAX, `No máximo ${HOOK_VARIATIONS_MAX} variações de gancho.`)
    .transform((values) => values.filter((value) => value.length > 0)),
  script: optionalText(20000, "Roteiro muito longo."),
  scriptStructure: z.array(scriptStructureBlockSchema).max(40, "Estrutura com blocos demais."),
  onScreenText: optionalText(5000, "Texto na tela muito longo."),
  shotList: z.array(shotListItemSchema).max(60, "Lista de takes/B-roll muito grande."),
  caption: optionalText(2200, "Legenda muito longa."),
  recordingNotes: optionalText(3000, "Notas de gravação muito longas."),
  estimatedDurationSeconds: durationSecondsSchema,
  scriptChecklist: scriptChecklistSchema,
});

export type ScriptFormInput = z.infer<typeof scriptFormSchema>;
