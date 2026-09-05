import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Rota raiz (/).
 * Em vez de exibir uma página estática de rascunho, avalia a sessão do usuário:
 * - Autenticado -> redireciona para o painel principal (/hoje).
 * - Não autenticado -> redireciona para a tela de acesso (/login).
 */
export default async function HomePage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/hoje");
  }

  redirect("/login");
}
