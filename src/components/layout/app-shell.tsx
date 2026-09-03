import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TopBar } from "@/components/layout/top-bar";
import type { InstagramAccount } from "@/types/domain";

interface AppShellProps {
  children: ReactNode;
  accounts: InstagramAccount[];
}

/**
 * Estrutura de layout compartilhada por todas as rotas autenticadas do
 * produto: sidebar no desktop (md+), navegação inferior no mobile, barra
 * superior com busca/comando + conta ativa + captura rápida.
 */
export function AppShell({ children, accounts }: AppShellProps) {
  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar accounts={accounts} />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
