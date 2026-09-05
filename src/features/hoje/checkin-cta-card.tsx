import Link from "next/link";
import { CheckCircle2, CheckSquare, MoonStar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculateChecklistCompletion } from "@/lib/checklist";
import type { DailyAction, DailyCheckin } from "@/types/domain";

interface CheckinCtaCardProps {
  hasAccount: boolean;
  checkin: DailyCheckin | null;
  actions: DailyAction[];
}

/** Card de atalho para abrir/continuar o check-in do dia, com o progresso já feito. */
export function CheckinCtaCard({ hasAccount, checkin, actions }: CheckinCtaCardProps) {
  if (!hasAccount) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
          <CheckSquare className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">Cadastre uma conta do Instagram para começar</p>
          <p className="text-sm text-muted-foreground">
            O check-in diário é por conta — cadastre a sua em Configurações.
          </p>
          <Button asChild size="sm" className="mt-2">
            <Link href="/configuracoes">Ir para Configurações</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { percent } = calculateChecklistCompletion(actions);
  const nightClosed = Boolean(checkin?.night_closed_at);

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        {nightClosed ? (
          <MoonStar className="h-4 w-4 text-tone-success-fg" aria-hidden="true" />
        ) : (
          <CheckSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
        <CardTitle className="text-base">Check-in de hoje</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {checkin
            ? nightClosed
              ? "Fechamento noturno concluído. Bom descanso!"
              : `Checklist: ${percent === null ? "sem itens ativos hoje" : `${percent}% concluído`}.`
            : "Você ainda não começou o check-in de hoje — leva menos de 3 minutos."}
        </p>
        <Button asChild size="sm" className="gap-1.5 self-start">
          <Link href="/checkin">
            {checkin ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Continuar check-in
              </>
            ) : (
              "Fazer check-in de hoje"
            )}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
