import { z } from "zod";

export const emailSchema = z.string().trim().email("Informe um e-mail válido.");

/** Mínimo de 8 caracteres para senhas NOVAS (cadastro). */
export const passwordSchema = z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.");

/**
 * No login, exigimos apenas que a senha não esteja vazia — o mínimo de 8
 * caracteres é uma regra de cadastro, não de autenticação (uma senha antiga
 * mais curta, se existisse, ainda precisa poder ser usada para entrar).
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe sua senha."),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
