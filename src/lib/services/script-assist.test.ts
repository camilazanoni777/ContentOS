import { describe, expect, it } from "vitest";

import { notImplementedScriptAssistService } from "./script-assist";

describe("notImplementedScriptAssistService", () => {
  it("existe como contrato desacoplado mas ainda não gera nada (IA não integrada nesta fase)", async () => {
    await expect(
      notImplementedScriptAssistService.generateHooksAndScript({
        title: "Ideia",
        summary: null,
        hook: null,
        objective: null,
        pillar: null,
        audienceIntent: null,
        format: null,
        referenceText: null,
      }),
    ).rejects.toThrow("Geração de ganchos/roteiro por IA ainda não foi implementada.");
  });
});
