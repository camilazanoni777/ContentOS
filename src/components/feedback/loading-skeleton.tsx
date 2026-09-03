import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Variantes prontas de skeleton para os padrões de layout mais comuns do
 * app. Para um bloco avulso, use <Skeleton /> (src/components/ui/skeleton.tsx)
 * diretamente.
 */
export function LoadingSkeleton({
  variant = "list",
  count = 3,
  className,
}: {
  variant?: "list" | "cards" | "text";
  count?: number;
  className?: string;
}) {
  if (variant === "cards") {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)} aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="p-5 pb-0">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div className={cn("flex flex-col gap-2", className)} aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className={cn("h-4", i === count - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
