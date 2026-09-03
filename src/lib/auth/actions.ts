"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signUpSchema } from "@/lib/validations/auth";

export type AuthActionResult = { error: string } | { success: true };

/** Traduz as mensagens de erro mais comuns do Supabase Auth para pt-BR. */
function traduzErroDeAuth(message: string): string {
  const normalizado = message.toLowerCase();

  if (normalizado.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (normalizado.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar (verifique sua caixa de entrada).";
  }
  if (normalizado.includes("user already registered")) {
    return "Já existe uma conta com esse e-mail.";
  }
  if (normalizado.includes("password should be at least")) {
    return "A senha precisa ter pelo menos 8 caracteres.";
  }
  if (normalizado.includes("rate limit")) {
    return "Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.";
  }

  return "Não foi possível concluir a operação. Tente novamente.";
}

export async function signInWithPassword(input: unknown): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos. Confira o e-mail e a senha informados." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: traduzErroDeAuth(error.message) };
  }

  return { success: true };
}

export async function signUpWithPassword(input: unknown): Promise<AuthActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dados inválidos. A senha precisa ter pelo menos 8 caracteres." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: traduzErroDeAuth(error.message) };
  }

  return { success: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
