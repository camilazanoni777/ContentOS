"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SaveStatus as SaveStatusValue } from "@/hooks/use-autosave";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

interface SaveStatusIndicatorProps {
  status: SaveStatusValue;
  savedAt: Date | null;
  error: string | null;
  onRetry: () => void;
}

/**
 * Feedback de salvamento do autosave — sempre visível para a usuária saber
 * que o rascunho não foi perdido. Compartilhado entre Check-in (Fase 4) e
 * Roteiros (Fase 6); qualquer outra tela com autosave pode reaproveitar.
 */
export function SaveStatusIndicator({ status, savedAt, error, onRetry }: SaveStatusIndicatorProps) {
  if (status === "saving") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Salvando...
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="flex flex-wrap items-center gap-1.5 text-xs text-destructive" role="alert">
        <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
        {error ?? "Não foi possível salvar."}
        <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onRetry}>
          Tentar de novo
        </Button>
      </p>
    );
  }

  if (status === "saved" && savedAt) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-tone-success-fg" role="status">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        Salvo às {formatTime(savedAt)}
      </p>
    );
  }

  return <p className="text-xs text-muted-foreground">Suas respostas são salvas automaticamente.</p>;
}
