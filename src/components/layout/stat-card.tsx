import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  /**
   * `null`/`undefined` = dado ainda não disponível (renderiza "—", nunca
   * "0"). Regra crítica do produto: ausência de dado é null, não zero.
   */
  value: string | number | null | undefined;
  helpText?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, helpText, icon, className }: StatCardProps) {
  const isNullish = value === null || value === undefined || value === "";
  const displayValue = isNullish ? "—" : value;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-150 hover:shadow-sm",
        className,
      )}
    >
      <CardHeader className="flex-row items-center justify-between gap-2 p-5 pb-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/60 text-primary transition-colors group-hover:bg-secondary">
            {icon}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="p-5 pt-1">
        <p
          className={cn(
            "font-serif text-headline font-semibold tracking-tight tabular-nums",
            isNullish ? "text-muted-foreground/50 font-normal" : "text-foreground",
          )}
        >
          {displayValue}
        </p>
        {helpText ? (
          <p className="mt-1 text-xs text-muted-foreground/90 font-medium">{helpText}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
