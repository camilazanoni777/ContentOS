"use client";

import * as React from "react";
import Link from "next/link";
import { classifyError } from "@/lib/connection-diagnostic";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, LogIn } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const diagnostic = React.useMemo(() => {
    return classifyError(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xs">
        {/* Brand */}
        <div className="inline-flex items-center gap-2.5 mb-6">
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            C
          </div>
          <div className="text-left">
            <div className="font-bold text-sm leading-tight text-foreground">Cami Content OS</div>
            <div className="text-2xs font-semibold uppercase tracking-wider text-primary">
              Sistema Operacional Criativo
            </div>
          </div>
        </div>

        {/* Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-7 w-7" aria-hidden="true" />
        </div>

        {/* Title & Message */}
        <h1 className="font-sans text-xl font-bold tracking-tight text-foreground mb-2">
          {diagnostic.title}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          {diagnostic.message}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {diagnostic.canRetry ? (
            <Button
              type="button"
              onClick={() => reset()}
              size="default"
              className="w-full gap-2"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>{diagnostic.actionText}</span>
            </Button>
          ) : null}

          {diagnostic.actionHref ? (
            <Button asChild variant="default" size="default" className="w-full gap-2">
              <Link href={diagnostic.actionHref}>
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span>{diagnostic.actionText}</span>
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="default" className="w-full">
              <Link href="/login">Ir para a tela de login</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
