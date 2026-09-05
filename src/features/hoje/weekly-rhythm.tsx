import Link from "next/link";
import { Activity, MoonStar, SunMedium, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface WeeklyRhythmDay {
  date: string; // YYYY-MM-DD
  dayLabel: string; // Seg, Ter...
  dayNumber: string; // 01, 02...
  isToday: boolean;
  hasCheckin: boolean;
  nightClosed: boolean;
  publishedCount: number;
}

interface WeeklyRhythmProps {
  days: WeeklyRhythmDay[];
  publishedThisWeek: number;
  weeklyTarget: number | null;
  weeklyPercent: number | null;
}

export function WeeklyRhythm({
  days,
  publishedThisWeek,
  weeklyTarget,
  weeklyPercent,
}: WeeklyRhythmProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
          <CardTitle className="font-sans text-base font-bold tracking-tight text-foreground">
            Ritmo Semanal
          </CardTitle>
        </div>

        {weeklyTarget !== null ? (
          <span className="text-xs font-semibold text-muted-foreground">
            Meta: <strong className="text-foreground">{publishedThisWeek}/{weeklyTarget}</strong> publicações
            {weeklyPercent !== null ? ` (${weeklyPercent}%)` : ""}
          </span>
        ) : (
          <Link
            href="/configuracoes"
            className="text-2xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            <Target className="h-3 w-3" />
            Definir meta semanal
          </Link>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barra de Progresso da Meta Semanal */}
        {weeklyTarget !== null && weeklyPercent !== null ? (
          <div className="space-y-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={weeklyPercent} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min(100, weeklyPercent)}%` }}
              />
            </div>
          </div>
        ) : null}

        {/* Faixa de 7 dias (Segunda a Domingo) */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {days.map((day) => (
            <div
              key={day.date}
              className={`flex flex-col items-center justify-between rounded-xl p-2 sm:p-3 text-center transition-all ${
                day.isToday
                  ? "border-2 border-primary bg-secondary/70 shadow-xs"
                  : "border border-border/70 bg-card/60 hover:border-border"
              }`}
            >
              {/* Dia da Semana & Número */}
              <div className="space-y-0.5">
                <span
                  className={`text-2xs font-semibold uppercase tracking-wider block ${
                    day.isToday ? "text-primary font-bold" : "text-muted-foreground"
                  }`}
                >
                  {day.dayLabel}
                </span>
                <span
                  className={`font-sans text-sm sm:text-base font-bold tabular-nums block ${
                    day.isToday ? "text-primary" : "text-foreground"
                  }`}
                >
                  {day.dayNumber}
                </span>
              </div>

              {/* Indicadores do Dia (Check-in Manhã, Check-in Noite, Posts) */}
              <div className="my-2 flex items-center gap-1">
                {/* Checkin Manhã */}
                <span
                  title={day.hasCheckin ? "Check-in do dia realizado" : "Check-in não realizado"}
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-2xs ${
                    day.hasCheckin
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground/40"
                  }`}
                >
                  <SunMedium className="h-2.5 w-2.5" />
                </span>

                {/* Checkin Noite */}
                <span
                  title={day.nightClosed ? "Fechamento noturno concluído" : "Fechamento noturno pendente"}
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-2xs ${
                    day.nightClosed
                      ? "bg-tone-success-fg text-white"
                      : "bg-muted text-muted-foreground/40"
                  }`}
                >
                  <MoonStar className="h-2.5 w-2.5" />
                </span>
              </div>

              {/* Contagem de Publicações no Dia */}
              <div className="text-2xs tabular-nums font-semibold">
                {day.publishedCount > 0 ? (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-primary">
                    {day.publishedCount} post{day.publishedCount > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-muted-foreground/40">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
