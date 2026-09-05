"use client";

import * as React from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatStopwatch } from "@/lib/recording";

/**
 * Cronômetro opcional da sessão de gravação — só estado local (não
 * persiste, como o próprio "cronômetro opcional" do prompt sugere: é uma
 * ferramenta de apoio durante a gravação, não um dado do pipeline).
 */
export function Stopwatch() {
  const [seconds, setSeconds] = React.useState(0);
  const [running, setRunning] = React.useState(false);

  React.useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <Timer className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <span className="min-w-[4.5rem] font-mono text-lg tabular-nums" role="timer" aria-live="off">
        {formatStopwatch(seconds)}
      </span>
      <Button type="button" size="sm" variant="outline" onClick={() => setRunning((current) => !current)} aria-label={running ? "Pausar cronômetro" : "Iniciar cronômetro"}>
        {running ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => {
          setRunning(false);
          setSeconds(0);
        }}
        aria-label="Zerar cronômetro"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}
