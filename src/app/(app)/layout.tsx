import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ErrorState } from "@/components/feedback/states";
import { listInstagramAccounts } from "@/lib/data/instagram-accounts";
import { createClient } from "@/lib/supabase/server";

/**
 * Layout do grupo de rotas autenticadas (Hoje, Check-in, Criar, Planejar,
 * Analisar, Negócio, Configurações). O middleware já protege essas rotas por
 * padrão; aqui buscamos as contas do Instagram uma vez para alimentar o
 * AccountSwitcher em todas as páginas.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return (
      <main className="mx-auto flex min-h-svh max-w-lg items-center justify-center p-4">
        <ErrorState
          title="Supabase não configurado"
          description="Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no seu .env.local (veja .env.example) para acessar o app."
        />
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?proximo=/hoje");
  }

  let accounts: Awaited<ReturnType<typeof listInstagramAccounts>> = [];
  try {
    accounts = await listInstagramAccounts(supabase);
  } catch {
    // Se a leitura falhar, seguimos com a lista vazia
  }

  if (accounts.length === 0) {
    redirect("/onboarding");
  }

  return <AppShell accounts={accounts}>{children}</AppShell>;
}
