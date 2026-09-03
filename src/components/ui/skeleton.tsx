import { cn } from "@/lib/utils";

/**
 * Bloco base de skeleton (placeholder de carregamento). Componha com
 * tamanhos/formas via className, ou use LoadingSkeleton
 * (src/components/feedback/loading-skeleton.tsx) para variantes prontas
 * (lista, cartão, texto).
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      role="presentation"
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
