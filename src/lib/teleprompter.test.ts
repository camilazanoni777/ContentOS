import { describe, expect, it } from "vitest";

import {
  TELEPROMPTER_FONT_SIZE_MAX,
  TELEPROMPTER_FONT_SIZE_MIN,
  TELEPROMPTER_SPEED_MAX,
  TELEPROMPTER_SPEED_MIN,
  clampFontSize,
  clampSpeed,
  computeScrollDelta,
  resolveTeleprompterText,
} from "./teleprompter";

describe("clampFontSize / clampSpeed", () => {
  it("mantém o valor quando já está dentro do intervalo", () => {
    expect(clampFontSize(50)).toBe(50);
    expect(clampSpeed(80)).toBe(80);
  });

  it("trava no mínimo/máximo definidos", () => {
    expect(clampFontSize(0)).toBe(TELEPROMPTER_FONT_SIZE_MIN);
    expect(clampFontSize(9999)).toBe(TELEPROMPTER_FONT_SIZE_MAX);
    expect(clampSpeed(-10)).toBe(TELEPROMPTER_SPEED_MIN);
    expect(clampSpeed(9999)).toBe(TELEPROMPTER_SPEED_MAX);
  });
});

describe("computeScrollDelta", () => {
  it("calcula a distância proporcional ao tempo decorrido", () => {
    expect(computeScrollDelta(40, 1000)).toBe(40);
    expect(computeScrollDelta(40, 500)).toBe(20);
    expect(computeScrollDelta(100, 250)).toBe(25);
  });

  it("nunca é negativa (velocidade ou tempo decorrido inválidos)", () => {
    expect(computeScrollDelta(40, 0)).toBe(0);
    expect(computeScrollDelta(40, -100)).toBe(0);
    expect(computeScrollDelta(0, 1000)).toBe(0);
    expect(computeScrollDelta(-10, 1000)).toBe(0);
  });
});

describe("resolveTeleprompterText", () => {
  it("prioriza o roteiro completo quando existe", () => {
    const text = resolveTeleprompterText({ script: "Roteiro pronto", hook: "Gancho" }, [{ content: "Slide 1" }]);
    expect(text).toBe("Roteiro pronto");
  });

  it("cai para a estrutura por blocos quando o roteiro está vazio", () => {
    const text = resolveTeleprompterText({ script: "", hook: "Gancho" }, [
      { content: "Bloco 1" },
      { content: "Bloco 2" },
    ]);
    expect(text).toBe("Bloco 1\n\nBloco 2");
  });

  it("cai para o gancho quando não há roteiro nem estrutura", () => {
    const text = resolveTeleprompterText({ script: null, hook: "Só o gancho" }, []);
    expect(text).toBe("Só o gancho");
  });

  it("retorna string vazia quando não há nada preenchido", () => {
    expect(resolveTeleprompterText({ script: null, hook: null }, [])).toBe("");
  });
});
