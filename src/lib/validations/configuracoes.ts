import { z } from "zod";

const optionValue = z.string().trim().min(1).max(100);
const optionList = z.array(optionValue).max(200);

/**
 * Valida os campos de `saveSettingsAction` depois que o FormData já foi
 * transformado em arrays/números pela action (listas por linha, números
 * brutos) — evita que um `extra` malformado ou um número negativo/inválido
 * cheguem ao banco, e mantém `weekly_publish_target` como `null` quando o
 * campo é deixado em branco (nunca convertido para 0, ver CLAUDE.md).
 */
export const appSettingsPatchSchema = z.object({
  pillars: optionList,
  formats: optionList,
  objectives: optionList,
  ctas: optionList,
  priorities: optionList,
  weekly_publish_target: z
    .number()
    .int("Use um número inteiro.")
    .nonnegative("Use um valor maior ou igual a zero.")
    .nullable(),
  stalled_idea_days: z
    .number()
    .int("Use um número inteiro.")
    .positive("Use um valor maior que zero."),
  minimum_ideas_per_pillar: z
    .number()
    .int("Use um número inteiro.")
    .nonnegative("Use um valor maior ou igual a zero."),
  extra: z.record(z.string(), z.unknown()),
});
