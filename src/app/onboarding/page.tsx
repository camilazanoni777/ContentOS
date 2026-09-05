import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { listInstagramAccounts } from "@/lib/data/instagram-accounts";
import { signOut } from "@/lib/auth/actions";
import { OnboardingWizard } from "@/features/onboarding/onboarding-wizard";

export const metadata: Metadata = {
  title: "Onboarding — Cami Content OS",
  description: "Configure seu perfil e seus pilares editoriais para começar.",
};

export default async function OnboardingPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?proximo=/onboarding");
  }

  // Se o usuário já tiver conta configurada, direciona para o painel principal
  let accounts: Awaited<ReturnType<typeof listInstagramAccounts>> = [];
  try {
    accounts = await listInstagramAccounts(supabase);
  } catch {
    // Se a leitura falhar, permite continuar no onboarding
  }

  if (accounts.length > 0) {
    redirect("/hoje");
  }

  return (
    <main className="flex min-h-svh flex-col bg-background">
      {/* Barra de Topo do Onboarding */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 px-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-sans font-bold text-sm shadow-2xs">
            C
          </div>
          <span className="font-sans font-bold tracking-tight text-foreground text-sm">
            Cami Content OS
          </span>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair</span>
          </button>
        </form>
      </header>

      {/* Conteúdo Central */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <OnboardingWizard />
      </div>
    </main>
  );
}
