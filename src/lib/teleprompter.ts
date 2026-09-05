/**
 * Lógica pura do modo teleprompter: limites de fonte/velocidade, cálculo de
 * rolagem por tempo decorrido e resolução do texto a exibir. Sem DOM/rAF
 * aqui — a UI (teleprompter-view.tsx) só consome estas funções, o que
 * permite testar o "motor" sem precisar simular o navegador.
 */

export const TELEPROMPTER_FONT_SIZE_MIN = 24;
export const TELEPROMPTER_FONT_SIZE_MAX = 96;
export const TELEPROMPTER_FONT_SIZE_DEFAULT = 40;
export const TELEPROMPTER_FONT_SIZE_STEP = 4;

export const TELEPROMPTER_SPEED_MIN = 10;
export const TELEPROMPTER_SPEED_MAX = 200;
export const TELEPROMPTER_SPEED_DEFAULT = 40;
export const TELEPROMPTER_SPEED_STEP = 10;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampFontSize(value: number): number {
  return clamp(value, TELEPROMPTER_FONT_SIZE_MIN, TELEPROMPTER_FONT_SIZE_MAX);
}

export function clampSpeed(value: number): number {
  return clamp(value, TELEPROMPTER_SPEED_MIN, TELEPROMPTER_SPEED_MAX);
}

/** Distância (px) a rolar dado o tempo decorrido (ms) numa velocidade (px/s). Nunca negativa. */
export function computeScrollDelta(speedPxPerSecond: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || speedPxPerSecond <= 0) return 0;
  return (speedPxPerSecond * elapsedMs) / 1000;
}

interface TeleprompterSource {
  script: string | null | undefined;
  hook: string | null | undefined;
}

/**
 * Texto a exibir no teleprompter: prioriza o roteiro completo; se ainda não
 * houver roteiro escrito, monta o texto a partir da estrutura por blocos;
 * por fim, cai para o gancho escolhido (melhor que uma tela em branco).
 */
export function resolveTeleprompterText(
  item: TeleprompterSource,
  structure: { content: string }[],
): string {
  const script = item.script?.trim();
  if (script) return script;

  const fromStructure = structure
    .map((block) => block.content.trim())
    .filter(Boolean)
    .join("\n\n");
  if (fromStructure) return fromStructure;

  return item.hook?.trim() ?? "";
}
