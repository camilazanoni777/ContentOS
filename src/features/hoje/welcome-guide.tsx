import Link from "next/link";
import { ArrowRight, CheckCircle2, Lightbulb, Calendar, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface WelcomeGuideProps {
  hasCheckinToday: boolean;
  hasIdeas: boolean;
  hasPlanned: boolean;
}

export function WelcomeGuide({ hasCheckinToday, hasIdeas, hasPlanned }: WelcomeGuideProps) {
  return (
    <Card className="overflow-hidden border-primary/25 bg-linear-to-r from-secondary/40 via-card to-secondary/20 shadow-xs">
      <CardContent className="flex flex-col gap-5 p-6 sm:p-7">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Primeiros Passos
            </span>
            <span className="text-xs text-muted-foreground font-medium">Guia Rápido de Produção</span>
          </div>
          <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Seu Content OS está pronto. Por onde começar hoje?
          </h2>
          <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Para ativar todo o potencial do sistema e manter consistência no Instagram, siga o
            fluxo recomendado abaixo:
          </p>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-3">
          {/* Ação 1: Check-in */}
          <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 transition-all duration-150 hover:border-primary/40 hover:shadow-xs">
            <div className="space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">1. Fazer Check-in do Dia</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {hasCheckinToday
                  ? "Check-in realizado! Suas prioridades estão definidas."
                  : "Defina seu objetivo principal e as 3 prioridades que você vai executar hoje."}
              </p>
            </div>
            <div className="pt-4">
              {hasCheckinToday ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-tone-success-fg">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Concluído hoje
                </span>
              ) : (
                <Button asChild size="sm" variant="default" className="w-full gap-1 text-xs">
                  <Link href="/checkin">
                    Fazer check-in
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Ação 2: Banco de Ideias */}
          <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 transition-all duration-150 hover:border-primary/40 hover:shadow-xs">
            <div className="space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
                <Lightbulb className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">2. Capturar Ideias</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {hasIdeas
                  ? "Você já tem ideias no pipeline. Que tal avançar uma para roteiro?"
                  : "Cadastre ganchos, referências e temas para alimentar seu calendário."}
              </p>
            </div>
            <div className="pt-4">
              <Button asChild size="sm" variant={hasIdeas ? "outline" : "default"} className="w-full gap-1 text-xs">
                <Link href="/ideias">
                  Ver Banco de Ideias
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Ação 3: Planejamento */}
          <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 transition-all duration-150 hover:border-primary/40 hover:shadow-xs">
            <div className="space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
                <Compass className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">3. Planejar a Semana</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {hasPlanned
                  ? "Seu calendário semanal tem publicações previstas."
                  : "Organize seus dias de gravação e distribuição na visão semanal."}
              </p>
            </div>
            <div className="pt-4">
              <Button asChild size="sm" variant={hasPlanned ? "outline" : "secondary"} className="w-full gap-1 text-xs">
                <Link href="/planejamento">
                  Abrir Planejamento
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
