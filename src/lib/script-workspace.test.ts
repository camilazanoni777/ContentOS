import { describe, expect, it } from "vitest";

import {
  formatDuration,
  getPreviousContentStatus,
  getStructureLabels,
  hasScriptSnapshotChanged,
  isScriptChecklistComplete,
  parseHookVariations,
  parseScriptChecklist,
  parseScriptSnapshot,
  parseScriptStructure,
  parseShotList,
  scriptChecklistProgress,
  shouldSkipAutoVersion,
} from "./script-workspace";
import { EMPTY_SCRIPT_CHECKLIST, type ScriptSnapshot } from "@/types/domain";

describe("parseHookVariations", () => {
  it("filtra valores não-string e limita a 5", () => {
    const raw = ["a", "b", 1, null, "c", "d", "e", "f"];
    expect(parseHookVariations(raw)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("retorna [] para jsonb que não é array", () => {
    expect(parseHookVariations(null)).toEqual([]);
    expect(parseHookVariations({})).toEqual([]);
  });
});

describe("parseScriptStructure", () => {
  it("lê blocos válidos preservando a ordem do array", () => {
    const raw = [{ content: "Abertura", note: "Sorrindo" }, { content: "Meio" }];
    expect(parseScriptStructure(raw)).toEqual([
      { content: "Abertura", note: "Sorrindo" },
      { content: "Meio", note: null },
    ]);
  });

  it("ignora entradas inválidas sem quebrar", () => {
    expect(parseScriptStructure([null, "texto solto", 42, { content: "ok" }])).toEqual([
      { content: "ok", note: null },
    ]);
  });
});

describe("parseShotList", () => {
  it("lê itens válidos, com fallback de tipo para take", () => {
    const raw = [{ type: "broll", description: "Rua vazia" }, { description: "Sem tipo definido" }];
    expect(parseShotList(raw)).toEqual([
      { type: "broll", description: "Rua vazia" },
      { type: "take", description: "Sem tipo definido" },
    ]);
  });
});

describe("parseScriptChecklist", () => {
  it("preenche as 6 chaves fixas, ignorando chaves desconhecidas", () => {
    const result = parseScriptChecklist({ clear_promise: true, strong_hook: true, lixo: true });
    expect(result).toEqual({
      ...EMPTY_SCRIPT_CHECKLIST,
      clear_promise: true,
      strong_hook: true,
    });
  });

  it("retorna tudo false para jsonb vazio/inválido", () => {
    expect(parseScriptChecklist({})).toEqual(EMPTY_SCRIPT_CHECKLIST);
    expect(parseScriptChecklist(null)).toEqual(EMPTY_SCRIPT_CHECKLIST);
  });
});

describe("scriptChecklistProgress / isScriptChecklistComplete", () => {
  it("conta itens marcados sobre o total de 6", () => {
    const checklist = { ...EMPTY_SCRIPT_CHECKLIST, clear_promise: true, cta: true };
    expect(scriptChecklistProgress(checklist)).toEqual({ checked: 2, total: 6 });
    expect(isScriptChecklistComplete(checklist)).toBe(false);
  });

  it("está completo quando as 6 chaves são true", () => {
    const checklist = {
      clear_promise: true,
      strong_hook: true,
      delivery: true,
      proof_example: true,
      cta: true,
      objective_coherence: true,
    };
    expect(isScriptChecklistComplete(checklist)).toBe(true);
    expect(scriptChecklistProgress(checklist)).toEqual({ checked: 6, total: 6 });
  });
});

describe("getPreviousContentStatus", () => {
  it("volta uma etapa no pipeline canônico", () => {
    expect(getPreviousContentStatus("scripting")).toBe("researching");
    expect(getPreviousContentStatus("ready_to_record")).toBe("scripting");
  });

  it("retorna null quando já está no primeiro status", () => {
    expect(getPreviousContentStatus("idea")).toBeNull();
  });
});

describe("getStructureLabels", () => {
  it("rotula por formato: Carrossel → slides, Reel → cenas, Stories → telas", () => {
    expect(getStructureLabels("carousel").plural).toBe("Slides");
    expect(getStructureLabels("reel").plural).toBe("Cenas");
    expect(getStructureLabels("stories").plural).toBe("Telas");
  });

  it("cai para 'Blocos' em formatos sem estrutura específica (foto, live, vazio)", () => {
    expect(getStructureLabels("photo").plural).toBe("Blocos");
    expect(getStructureLabels(null).plural).toBe("Blocos");
  });
});

describe("formatDuration", () => {
  it("formata segundos como m:ss", () => {
    expect(formatDuration(90)).toBe("1:30");
    expect(formatDuration(5)).toBe("0:05");
    expect(formatDuration(0)).toBe("0:00");
  });

  it("retorna string vazia quando não há duração", () => {
    expect(formatDuration(null)).toBe("");
    expect(formatDuration(undefined)).toBe("");
  });
});

const emptySnapshot: ScriptSnapshot = {
  hook: null,
  hookVariations: [],
  script: null,
  scriptStructure: [],
  onScreenText: null,
  shotList: [],
  caption: null,
  estimatedDurationSeconds: null,
};

describe("hasScriptSnapshotChanged", () => {
  it("é true quando não há versão anterior", () => {
    expect(hasScriptSnapshotChanged(null, emptySnapshot)).toBe(true);
  });

  it("é false para snapshots com o mesmo conteúdo", () => {
    const snapshot = { ...emptySnapshot, hook: "Gancho" };
    expect(hasScriptSnapshotChanged({ ...snapshot }, { ...snapshot })).toBe(false);
  });

  it("é true quando qualquer campo muda", () => {
    const before = { ...emptySnapshot, hook: "Gancho A" };
    const after = { ...emptySnapshot, hook: "Gancho B" };
    expect(hasScriptSnapshotChanged(before, after)).toBe(true);
  });
});

describe("parseScriptSnapshot", () => {
  it("reconstrói um snapshot a partir do jsonb salvo", () => {
    const stored = {
      hook: "Gancho",
      hookVariations: ["v1", "v2"],
      script: "Roteiro completo",
      scriptStructure: [{ content: "Slide 1" }],
      onScreenText: "Texto",
      shotList: [{ type: "broll", description: "Rua" }],
      caption: "Legenda",
      estimatedDurationSeconds: 45,
    };
    expect(parseScriptSnapshot(stored)).toEqual({
      hook: "Gancho",
      hookVariations: ["v1", "v2"],
      script: "Roteiro completo",
      scriptStructure: [{ content: "Slide 1", note: null }],
      onScreenText: "Texto",
      shotList: [{ type: "broll", description: "Rua" }],
      caption: "Legenda",
      estimatedDurationSeconds: 45,
    });
  });

  it("retorna null para jsonb que não é objeto", () => {
    expect(parseScriptSnapshot(null)).toBeNull();
    expect(parseScriptSnapshot([])).toBeNull();
  });
});

describe("shouldSkipAutoVersion", () => {
  it("não pula quando não há versão anterior", () => {
    expect(shouldSkipAutoVersion(null)).toBe(false);
  });

  it("pula quando a última versão é recente (dentro do throttle)", () => {
    const now = new Date("2026-09-04T12:03:00.000Z");
    const lastVersionAt = "2026-09-04T12:01:00.000Z"; // 2 min atrás
    expect(shouldSkipAutoVersion(lastVersionAt, now)).toBe(true);
  });

  it("não pula quando a última versão passou do throttle (3 min)", () => {
    const now = new Date("2026-09-04T12:10:00.000Z");
    const lastVersionAt = "2026-09-04T12:01:00.000Z"; // 9 min atrás
    expect(shouldSkipAutoVersion(lastVersionAt, now)).toBe(false);
  });
});
