"use client";

import { History, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { parseScriptSnapshot } from "@/lib/script-workspace";
import type { ContentScriptVersion, ScriptSnapshot } from "@/types/domain";
import { formatDateTimeBR } from "@/lib/dates";

function formatVersionTime(iso: string): string {
  return formatDateTimeBR(iso);
}

function previewOf(snapshot: ScriptSnapshot): string {
  const text = snapshot.script?.trim() || snapshot.hook?.trim() || "";
  if (!text) return "Sem roteiro ainda.";
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
}

interface VersionHistoryProps {
  versions: ContentScriptVersion[];
  onRestore: (snapshot: ScriptSnapshot) => void;
}

/**
 * Histórico básico de versões do roteiro (até as últimas 15, mais recentes
 * primeiro). Cada versão é imutável (content_script_versions não tem
 * update/delete) — "Restaurar" só copia o snapshot de volta para o
 * formulário atual, o que por sua vez gera uma nova versão ao salvar,
 * nunca apaga histórico.
 */
export function VersionHistory({ versions, onRestore }: VersionHistoryProps) {
  if (versions.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma versão salva ainda — o histórico aparece aqui conforme você for salvando o roteiro.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {versions.map((version) => {
        const snapshot = parseScriptSnapshot(version.snapshot);
        return (
          <li key={version.id} className="flex flex-col gap-1.5 rounded-md border border-border p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <History className="h-3.5 w-3.5" aria-hidden="true" />
                {formatVersionTime(version.created_at)}
              </span>
              <p className="text-sm text-foreground">{snapshot ? previewOf(snapshot) : "Versão sem dados legíveis."}</p>
            </div>
            {snapshot ? (
              <Button type="button" variant="outline" size="sm" className="gap-1.5 self-start" onClick={() => onRestore(snapshot)}>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Restaurar esta versão
              </Button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
