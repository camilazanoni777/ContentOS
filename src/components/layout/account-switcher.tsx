"use client";

import * as React from "react";
import { AtSign, ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { InstagramAccount } from "@/types/domain";

interface AccountSwitcherProps {
  accounts: InstagramAccount[];
}

/**
 * Seletor de conta do Instagram — já preparado para múltiplas contas, mesmo
 * que hoje a maioria das usuárias tenha só uma. Sem contas cadastradas,
 * mostra um convite para cadastrar em Configurações (sem simular dados).
 */
export function AccountSwitcher({ accounts }: AccountSwitcherProps) {
  const [activeId, setActiveId] = React.useState<string | null>(accounts[0]?.id ?? null);
  const active = accounts.find((account) => account.id === activeId) ?? accounts[0] ?? null;

  if (accounts.length === 0) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/configuracoes">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Conectar conta
        </Link>
      </Button>
    );
  }

  if (accounts.length === 1) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-input px-3 py-1.5 text-sm">
        <AtSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className="font-medium">@{active?.handle}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <AtSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="font-medium">@{active?.handle}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Contas do Instagram</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accounts.map((account) => (
          <DropdownMenuItem key={account.id} onSelect={() => setActiveId(account.id)}>
            <AtSign className="h-4 w-4" aria-hidden="true" />
            @{account.handle}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
