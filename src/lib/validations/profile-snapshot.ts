import { z } from "zod";

/**
 * Validação do registro de Métricas do Perfil — um registro por conta por
 * dia (unique (account_id, snapshot_date) no banco, upsert na camada de
 * dados). Regra crítica: todo campo numérico é opcional; string vazia vira
 * `null`, nunca `0` — mesmo padrão de validations/metric-snapshot.ts.
 */

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

export const profileSnapshotSchema = z.object({
  accountId: z.string().trim().min(1, "Selecione a conta."),
  snapshotDate: z.string().trim().min(1, "Informe a data deste registro."),
  followers: optionalCount(),
  following: optionalCount(),
  views: optionalCount(),
  reach: optionalCount("Use um número inteiro maior ou igual a zero (alcance)."),
  impressions: optionalCount(),
  accountsEngaged: optionalCount(),
  interactions: optionalCount(),
  profileVisits: optionalCount(),
  websiteClicks: optionalCount("Use um número inteiro maior ou igual a zero (cliques)."),
  messages: optionalCount(),
  leads: optionalCount(),
  sales: optionalCount(),
  revenue: optionalDecimal("Use um número maior ou igual a zero (receita, use ponto para centavos)."),
  postsCount: optionalCount("Use um número inteiro maior ou igual a zero (conteúdos publicados)."),
  storiesCount: optionalCount("Use um número inteiro maior ou igual a zero (stories publicados)."),
  hoursInvested: optionalDecimal("Use um número de horas maior ou igual a zero (use ponto para frações)."),
  notes: z.string().trim().max(2000, "Observações muito longas (máximo 2000 caracteres).").optional().or(z.literal("")).transform((v) => (v ? v : null)),
});

export type ProfileSnapshotInput = z.infer<typeof profileSnapshotSchema>;
