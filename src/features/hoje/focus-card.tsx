import Link from "next/link";
import { Compass } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Goal } from "@/types/domain";

interface FocusCardProps {
  todayObjective: string | null;
  monthlyGoal: Goal | null;
}

/** Foco do dia (do check-in de hoje) + objetivo principal do mês (de Metas). */
export function FocusCard({ todayObjective, monthlyGoal }: FocusCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <Compass className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <CardTitle className="text-base">Foco</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Foco de hoje</span>
          {todayObjective ? (
            <p className="text-sm text-foreground">{todayObjective}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Defina no{" "}
              <Link href="/checkin" className="text-accent underline-offset-2 hover:underline">
                check-in de hoje
              </Link>
              .
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Objetivo do mês</span>
          {monthlyGoal ? (
            <p className="text-sm text-foreground">
              {monthlyGoal.metric}
              {monthlyGoal.target_value !== null ? ` — meta: ${monthlyGoal.target_value}` : ""}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma meta mensal definida.{" "}
              <Link href="/metas" className="text-accent underline-offset-2 hover:underline">
                Definir em Metas
              </Link>
              .
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
