import * as React from "react";

import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0-100 — valores fora da faixa são visualmente limitados (clamp), mas o número real continua exibido por quem usa o componente. */
  value: number;
  /** Cor da barra preenchida — aceita qualquer classe Tailwind de bg (ex.: "bg-tone-success-fg"). Padrão: cor primária da marca. */
  indicatorClassName?: string;
}

/**
 * Barra de progresso simples e nativa (não Radix) — mesma filosofia de
 * ui/select.tsx: leve, sem dependência extra, suficiente para o produto.
 * Primeiro uso: metas semanais/mensais (Prompt 10).
 */
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, indicatorClassName, className, ...props }, ref) => {
    const clamped = Math.min(100, Math.max(0, value));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
        {...props}
      >
        <div
          className={cn("h-full rounded-full bg-primary transition-all", indicatorClassName)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    );
  },
);
Progress.displayName = "Progress";

export { Progress };
