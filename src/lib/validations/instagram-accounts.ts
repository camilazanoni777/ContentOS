import { z } from "zod";

/**
 * Cadastro manual de conta do Instagram (sem integração via API nesta
 * fase — ver comment on table instagram_accounts). O `@` é opcional na
 * digitação e removido aqui; unicidade por usuária é case-insensitive
 * (índice único em lower(handle)), então validamos só formato/tamanho.
 */
export const instagramAccountSchema = z.object({
  handle: z
    .string()
    .trim()
    .transform((value) => value.replace(/^@/, ""))
    .pipe(
      z
        .string()
        .min(1, "Informe o @ da conta.")
        .max(60, "Use no máximo 60 caracteres.")
        .regex(/^[a-zA-Z0-9._]+$/, "Use apenas letras, números, ponto e underline."),
    ),
  displayName: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal(""))
    .transform((value) => value || null),
  isPrimary: z.boolean(),
});
