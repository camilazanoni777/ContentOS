"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, FlipHorizontal2, Minus, Pause, Play, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  TELEPROMPTER_FONT_SIZE_DEFAULT,
  TELEPROMPTER_FONT_SIZE_STEP,
  TELEPROMPTER_SPEED_DEFAULT,
  TELEPROMPTER_SPEED_STEP,
  clampFontSize,
  clampSpeed,
  computeScrollDelta,
} from "@/lib/teleprompter";

interface TeleprompterViewProps {
  title: string;
  text: string;
  backHref: string;
}

interface WakeLockSentinelLike {
  release: () => Promise<void>;
}

/**
 * Modo teleprompter: tela limpa (fora do shell do app), fonte e velocidade
 * ajustáveis, iniciar/pausar, espelhar texto e manter a tela acordada
 * quando o navegador suporta a Screen Wake Lock API (com feature detection
 * — sem suporte, simplesmente não trava a tela, sem quebrar nada).
 */
export function TeleprompterView({ title, text, backHref }: TeleprompterViewProps) {
  const [fontSize, setFontSize] = React.useState(TELEPROMPTER_FONT_SIZE_DEFAULT);
  const [speed, setSpeed] = React.useState(TELEPROMPTER_SPEED_DEFAULT);
  const [playing, setPlaying] = React.useState(false);
  const [mirrored, setMirrored] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const wakeLockRef = React.useRef<WakeLockSentinelLike | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const lastFrameRef = React.useRef<number | null>(null);
  const speedRef = React.useRef(speed);

  React.useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  React.useEffect(() => {
    if (!playing) {
      lastFrameRef.current = null;
      return;
    }

    function tick(timestamp: number) {
      if (lastFrameRef.current !== null) {
        const elapsed = timestamp - lastFrameRef.current;
        const delta = computeScrollDelta(speedRef.current, elapsed);
        const el = scrollRef.current;
        if (el) {
          el.scrollTop += delta;
          if (el.scrollHeight > el.clientHeight && el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
            setPlaying(false);
          }
        }
      }
      lastFrameRef.current = timestamp;
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = null;
    };
  }, [playing]);

  React.useEffect(() => {
    if (!playing) {
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
      return;
    }

    let cancelled = false;
    async function requestWakeLock() {
      if (!("wakeLock" in navigator)) return;
      try {
        const sentinel = await (
          navigator as unknown as { wakeLock: { request: (type: "screen") => Promise<WakeLockSentinelLike> } }
        ).wakeLock.request("screen");
        if (cancelled) {
          await sentinel.release();
          return;
        }
        wakeLockRef.current = sentinel;
      } catch {
        // Sem suporte ou permissão negada — segue sem travar a tela acordada.
      }
    }
    void requestWakeLock();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") void requestWakeLock();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [playing]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 sm:px-4">
        <Button asChild variant="ghost" size="icon" aria-label="Fechar teleprompter">
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <p className="flex-1 truncate text-center text-sm text-muted-foreground">{title}</p>
        <Button
          type="button"
          variant={mirrored ? "accent" : "ghost"}
          size="icon"
          aria-label="Espelhar texto"
          aria-pressed={mirrored}
          onClick={() => setMirrored((current) => !current)}
        >
          <FlipHorizontal2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-10 sm:px-10">
        <p
          className="mx-auto max-w-3xl whitespace-pre-wrap font-serif leading-relaxed"
          style={{ fontSize, transform: mirrored ? "scaleX(-1)" : undefined }}
        >
          {text || "Nenhum roteiro escrito ainda."}
        </p>
        <div className="h-[70vh]" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-3 border-t border-border bg-card px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Diminuir fonte"
            onClick={() => setFontSize((current) => clampFontSize(current - TELEPROMPTER_FONT_SIZE_STEP))}
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="w-10 text-center text-xs text-muted-foreground">{fontSize}px</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Aumentar fonte"
            onClick={() => setFontSize((current) => clampFontSize(current + TELEPROMPTER_FONT_SIZE_STEP))}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <Button type="button" size="lg" className="gap-2" onClick={() => setPlaying((current) => !current)}>
          {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
          {playing ? "Pausar" : "Iniciar"}
        </Button>

        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Diminuir velocidade"
            onClick={() => setSpeed((current) => clampSpeed(current - TELEPROMPTER_SPEED_STEP))}
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="w-14 text-center text-xs text-muted-foreground">{speed}px/s</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Aumentar velocidade"
            onClick={() => setSpeed((current) => clampSpeed(current + TELEPROMPTER_SPEED_STEP))}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
