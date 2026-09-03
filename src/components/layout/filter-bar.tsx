import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Contêiner responsivo para busca + filtros de uma listagem. Não decide o
 * conteúdo dos filtros — cada rota compõe o que precisa (SearchInput,
 * selects, DateRangePicker) como children.
 */
export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-end",
        className,
      )}
    >
      {children}
    </div>
  );
}
