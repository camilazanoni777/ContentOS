import { z } from "zod";

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));

/**
 * Validação dos campos manuais da Revisão Semanal — salvos na mesma linha
 * de weekly_reviews que o Planejamento Semanal (Fase 6) usa para
 * strategic_focus/weekly_experiment/etc. (ver validations/planejamento-semanal.ts,
 * mesmo padrão de helpers).
 */
export const weeklyReviewSchema = z.object({
  whatWorked: optionalText(1000, "\"O que funcionou\" muito longo."),
  whatDidntWork: optionalText(1000, "\"O que não funcionou\" muito longo."),
  whatToRepeat: optionalText(1000, "\"O que repetir\" muito longo."),
  whatToStop: optionalText(1000, "\"O que parar\" muito longo."),
  whatToTest: optionalText(1000, "\"O que testar\" muito longo."),
  keyLearning: optionalText(1000, "Principal aprendizado muito longo."),
  decision: optionalText(1000, "Decisão estratégica muito longa."),
});

export type WeeklyReviewInput = z.infer<typeof weeklyReviewSchema>;
