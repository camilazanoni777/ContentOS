import { CommandMenu } from "@/components/layout/command-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AccountSwitcher } from "@/components/layout/account-switcher";
import { QuickCaptureButton } from "@/features/ideias/quick-capture-button";
import { SignOutButton } from "@/features/auth/sign-out-button";
import type { InstagramAccount } from "@/types/domain";

interface TopBarProps {
  accounts: InstagramAccount[];
}

/** Barra superior — busca/comando, conta ativa, tema, captura rápida e sair. */
export function TopBar({ accounts }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="min-w-0 flex-1">
        <CommandMenu />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <AccountSwitcher accounts={accounts} />
        <ThemeToggle />
        <QuickCaptureButton />
        <SignOutButton />
      </div>
    </header>
  );
}
