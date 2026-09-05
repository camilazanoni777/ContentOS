import { z } from "zod";

// Aceita um uuid válido, string vazia (select "sem vínculo"/"nenhum"), null
// ou undefined — e normaliza tudo que não é um uuid de verdade para null.
const uuidOrNull = z
  .union([z.string().uuid(), z.literal("")])
  .nullable()
  .optional()
  .transform((value) => (value ? value : null));

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));

export const checkinPrioritySchema = z.object({
  label: z.string().trim().min(1, "Escreva a prioridade ou remova esta linha.").max(140, "Prioridade muito longa."),
  contentItemId: uuidOrNull,
  goalId: uuidOrNull,
});

export type CheckinPriorityInput = z.infer<typeof checkinPrioritySchema>;

/**
 * Validação do formulário de check-in do dia. Todos os campos exceto as
 * prioridades preenchidas são opcionais — o check-in precisa ser rápido
 * (< 3 min) e a usuária pode salvar parcialmente a qualquer momento
 * (autosave de rascunho).
 */
export const checkinFormSchema = z.object({
  objectiveMain: optionalText(200, "Objetivo muito longo."),
  priorities: z.array(checkinPrioritySchema).max(3, "No máximo 3 prioridades por dia.").default([]),
  mainContentItemId: uuidOrNull,
  plannedStories: optionalText(500, "Descrição de stories muito longa."),
  focusProductId: uuidOrNull,
  focusCampaignId: uuidOrNull,
  observedTrend: optionalText(500, "Texto muito longo."),
  communityAction: optionalText(300, "Texto muito longo."),
  notes: optionalText(1000, "Observações muito longas."),
  dailyLearning: optionalText(500, "Texto muito longo."),
});

export type CheckinFormInput = z.infer<typeof checkinFormSchema>;

/** Fechamento noturno: mesmos campos continuam opcionais (não é obrigatório fechar a noite para ter feito o check-in). */
export const nightClosingSchema = z.object({
  eveningWins: optionalText(300, "Texto muito longo."),
  eveningBlockers: optionalText(300, "Texto muito longo."),
  dailyLearning: optionalText(500, "Texto muito longo."),
  tomorrowPriority: optionalText(200, "Texto muito longo."),
});

export type NightClosingInput = z.infer<typeof nightClosingSchema>;

export const customChecklistItemSchema = z.object({
  label: z.string().trim().min(1, "Dê um nome ao item.").max(120, "Nome muito longo."),
});

/**
 * Schema combinado usado pelo formulário único de Check-in (campos do dia +
 * fechamento noturno na mesma tela, autosave cobrindo todos). `dailyLearning`
 * existe uma única vez — é o mesmo campo em ambas as seções (ver decisão em
 * CLAUDE.md/relatório da Fase 4: não duplicamos "aprendizado do dia").
 */
export const fullCheckinSchema = checkinFormSchema.extend({
  eveningWins: nightClosingSchema.shape.eveningWins,
  eveningBlockers: nightClosingSchema.shape.eveningBlockers,
  tomorrowPriority: nightClosingSchema.shape.tomorrowPriority,
});

export type FullCheckinValues = z.infer<typeof fullCheckinSchema>;
