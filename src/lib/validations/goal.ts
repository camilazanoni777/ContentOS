import { z } from "zod";
import { GOAL_METRICS } from "@/lib/metas";

/**
 * Validação de metas semanais/mensais. `targetValue`/`initialValue` são
 * opcionais (string vazia -> null, nunca 0 — mesmo padrão de todo o
 * projeto), mas uma meta sem valor-alvo não tem como calcular progresso —
 * a UI avisa disso separadamente, o schema não bloqueia salvar sem alvo
 * (pode-se querer só acompanhar o "atual" antes de decidir a meta).
 */

const optionalDecimal = (message = "Use um número maior ou igual a zero (use ponto para decimais).") =>
  z
    .string()
    .trim()
    .max(15, message)
    .refine((value) => value === "" || /^\d+(\.\d+)?$/.test(value), message)
    .transform((value) => (value === "" ? null : Number(value)));

export const goalSchema = z
  .object({
    periodType: z.enum(["weekly", "monthly"]),
    periodStart: z.string().trim().min(1, "Informe o início do período."),
    periodEnd: z.string().trim().min(1, "Informe o fim do período."),
    metric: z.enum(GOAL_METRICS, { errorMap: () => ({ message: "Selecione uma métrica válida." }) }),
    targetValue: optionalDecimal("Use um número maior ou igual a zero (valor-alvo)."),
    initialValue: optionalDecimal("Use um número maior ou igual a zero (valor inicial)."),
    notes: z
      .string()
      .trim()
      .max(2000, "Observações muito longas (máximo 2000 caracteres).")
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v : null)),
  })
  .superRefine((data, ctx) => {
    if (data.periodEnd < data.periodStart) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["periodEnd"], message: "O fim do período não pode ser antes do início." });
    }
  });

export type GoalInput = z.infer<typeof goalSchema>;
