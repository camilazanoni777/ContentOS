/**
 * Porta de serviço para uma futura função de IA que sugere variações de
 * gancho e um esqueleto de roteiro a partir do briefing do conteúdo.
 *
 * Nenhuma tela chama isto ainda — "Não integrar IA ainda" (Prompt da Fase
 * 6). Este arquivo existe só para o workspace de Roteiros já ter um
 * contrato estável para integrar quando essa função for priorizada (ver
 * "Recursos de IA via API" em TODO.md → Pós-MVP), sem precisar redesenhar a
 * UI depois.
 */

export interface ScriptAssistRequest {
  title: string;
  summary: string | null;
  hook: string | null;
  objective: string | null;
  pillar: string | null;
  audienceIntent: string | null;
  format: string | null;
  referenceText: string | null;
}

export interface ScriptAssistSuggestion {
  hookVariations: string[];
  scriptOutline: string;
}

export interface ScriptAssistService {
  generateHooksAndScript(request: ScriptAssistRequest): Promise<ScriptAssistSuggestion>;
}

/**
 * Implementação padrão (única existente por enquanto): lança erro de
 * propósito. Substitua por uma implementação real (chamando a API de IA
 * escolhida) quando essa fase for priorizada — o restante do app já está
 * preparado para consumir `ScriptAssistService` via injeção simples, sem
 * acoplar a UI a um provedor específico.
 */
export const notImplementedScriptAssistService: ScriptAssistService = {
  async generateHooksAndScript() {
    throw new Error("Geração de ganchos/roteiro por IA ainda não foi implementada.");
  },
};
