import type { ReactNode } from "react";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Componentes de estado reutilizáveis para qualquer tela orientada a dados
 * (não apenas os desta fase) — carregando, vazio e erro.
 */

export function LoadingState({
  label = "Carregando...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center animate-in fade-in-50 duration-200",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/70">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/90 bg-card/50 px-6 py-14 text-center transition-all",
        className,
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/80 text-primary">
        {icon ?? <Inbox className="h-6 w-6" aria-hidden="true" />}
      </div>
      <p className="font-serif text-base font-semibold text-foreground tracking-tight">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4 flex items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Algo deu errado",
  description,
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-destructive">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
