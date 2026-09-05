import { z } from "zod";

/**
 * Validação da captura de métricas (formulário rápido e completo — os dois
 * usam este mesmo schema, diferindo só em quais campos ficam visíveis).
 * Regra crítica: todo campo numérico é opcional; string vazia vira `null`,
 * nunca `0` — um campo não preenchido significa "não sei", não "zero".
 */

const optionalDateTimeLocal = z
  .string()
  .trim()
  .max(40)
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : null));

const optionalCount = (message = "Use um número inteiro maior ou igual a zero.") =>
  z
    .string()
    .trim()
    .max(15, message)
    .refine((value) => value === "" || /^\d+$/.test(value), message)
    .transform((value) => (value === "" ? null : Number(value)));

const optionalDecimal = (message = "Use um número maior ou igual a zero (use ponto para decimais).") =>
  z
    .string()
    .trim()
    .max(15, message)
    .refine((value) => value === "" || /^\d+(\.\d+)?$/.test(value), message)
    .transform((value) => (value === "" ? null : Number(value)));

const optionalRetention = z
  .string()
  .trim()
  .max(6, "Use um número entre 0 e 100.")
  .refine((value) => value === "" || /^\d+(\.\d+)?$/.test(value), "Use um número entre 0 e 100.")
  .transform((value) => (value === "" ? null : Number(value)))
  .refine((value) => value === null || (value >= 0 && value <= 100), "Retenção informada deve estar entre 0 e 100.");

export const metricSnapshotSchema = z
  .object({
    windowType: z.enum(["24h", "7d", "30d", "custom"]),
    windowStart: optionalDateTimeLocal,
    windowEnd: optionalDateTimeLocal,
    capturedAt: z.string().trim().min(1, "Informe quando esta leitura foi capturada.").max(40),
    views: optionalCount(),
    reach: optionalCount(),
    impressions: optionalCount(),
    likes: optionalCount(),
    comments: optionalCount(),
    shares: optionalCount(),
    saves: optionalCount(),
    replies: optionalCount(),
    profileVisits: optionalCount(),
    followersGained: optionalCount(),
    linkClicks: optionalCount(),
    leads: optionalCount(),
    sales: optionalCount(),
    revenue: optionalDecimal("Use um número maior ou igual a zero (receita, use ponto para centavos)."),
    averageWatchTimeSeconds: optionalDecimal("Use um número de segundos maior ou igual a zero."),
    videoDurationSeconds: optionalDecimal("Use um número de segundos maior ou igual a zero."),
    threeSecondViews: optionalCount(),
    completedViews: optionalCount(),
    retentionRate: optionalRetention,
    storyExits: optionalCount(),
    tapsForward: optionalCount(),
    tapsBack: optionalCount(),
  })
  .superRefine((data, ctx) => {
    if (data.windowType === "custom") {
      if (!data.windowStart) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["windowStart"], message: "Período personalizado precisa de uma data/hora de início." });
      }
      if (!data.windowEnd) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["windowEnd"], message: "Período personalizado precisa de uma data/hora de fim." });
      }
      if (data.windowStart && data.windowEnd && data.windowStart > data.windowEnd) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["windowEnd"], message: "O fim do período não pode ser antes do início." });
      }
    }
  });

export type MetricSnapshotInput = z.infer<typeof metricSnapshotSchema>;
