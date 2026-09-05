import { describe, expect, it } from "vitest";
import { parseCheckinPriorities } from "./checkin";

describe("parseCheckinPriorities", () => {
  it("retorna array vazio para valores ausentes/inválidos", () => {
    expect(parseCheckinPriorities(null)).toEqual([]);
    expect(parseCheckinPriorities(undefined)).toEqual([]);
    expect(parseCheckinPriorities("texto qualquer")).toEqual([]);
    expect(parseCheckinPriorities({ not: "an array" })).toEqual([]);
  });

  it("lê prioridades válidas com vínculo opcional", () => {
    const json = [
      { label: "Gravar reel", contentItemId: "11111111-1111-1111-1111-111111111111", goalId: null },
      { label: "Responder comentários" },
    ];
    expect(parseCheckinPriorities(json)).toEqual([
      { label: "Gravar reel", contentItemId: "11111111-1111-1111-1111-111111111111", goalId: null },
      { label: "Responder comentários", contentItemId: null, goalId: null },
    ]);
  });

  it("descarta entradas sem label (nunca mostra uma prioridade em branco)", () => {
    const json = [{ label: "" }, { label: "   " }, { contentItemId: "abc" }, { label: "Válida" }];
    expect(parseCheckinPriorities(json)).toEqual([{ label: "Válida", contentItemId: null, goalId: null }]);
  });

  it("nunca lança exceção com entradas malformadas (array de tipos mistos)", () => {
    const json = [null, 42, "string", ["array"], { label: "Ok" }];
    expect(parseCheckinPriorities(json)).toEqual([{ label: "Ok", contentItemId: null, goalId: null }]);
  });
});
