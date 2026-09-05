import { z } from "zod";

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));

const optionalId = (message: string) =>
  z
    .string()
    .trim()
    .max(100, message)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));

const optionalHours = z
  .string()
  .trim()
  .max(6, "Horas muito longo.")
  .refine((value) => value === "" || /^\d+([.,]\d{1,2})?$/.test(value), "Use um número (ex.: 6 ou 6,5).")
  .transform((value) => (value === "" ? null : Number(value.replace(",", "."))));

/**
 * Validação do formulário de Planejamento Semanal — salvo em
 * weekly_reviews (colunas de planejamento adicionadas na migration
 * 20260904160000, reaproveitando a mesma linha por semana que a futura
 * Revisão Semanal, Fase 7, usa para strategic_analysis/decision).
 */
export const weeklyPlanSchema = z.object({
  strategicFocus: optionalText(500, "Foco estratégico muito longo."),
  weeklyExperiment: optionalText(500, "Experimento da semana muito longo."),
  priorityContentId: optionalId("Conteúdo prioritário inválido."),
  activeCampaignId: optionalId("Campanha inválida."),
  plannedHours: optionalHours,
});

export type WeeklyPlanInput = z.infer<typeof weeklyPlanSchema>;
