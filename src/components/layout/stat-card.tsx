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
  const displayValue = value === null || value === undefined || value === "" ? "—" : value;

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex-row items-center justify-between gap-2 p-5 pb-0">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </CardHeader>
      <CardContent className="p-5 pt-2">
        <p className="font-serif text-headline font-semibold text-foreground">{displayValue}</p>
        {helpText ? <p className="mt-1 text-xs text-muted-foreground">{helpText}</p> : null}
      </CardContent>
    </Card>
  );
}
