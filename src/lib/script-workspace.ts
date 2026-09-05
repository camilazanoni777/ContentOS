import type {
  ContentStatus,
  Json,
  ScriptChecklist,
  ScriptSnapshot,
  ScriptStructureBlock,
  ShotListItem,
} from "@/types/domain";
import { CONTENT_STATUS_ORDER, EMPTY_SCRIPT_CHECKLIST, SCRIPT_CHECKLIST_KEYS } from "@/types/domain";

/**
 * Lógica pura da experiência de roteirização (Roteiros): parse dos campos
 * jsonb de content_items, checklist, navegação de status e throttle de
 * versões. Nenhuma função aqui toca o Supabase — só transforma dados já
 * carregados, para poder ser testada sem banco.
 */

export function parseHookVariations(json: Json): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((value): value is string => typeof value === "string").slice(0, 5);
}

export function parseScriptStructure(json: Json): ScriptStructureBlock[] {
  if (!Array.isArray(json)) return [];
  return json
    .map((raw) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
      const block = raw as Record<string, unknown>;
      const content = typeof block.content === "string" ? block.content : "";
      const note = typeof block.note === "string" ? block.note : null;
      return { content, note } satisfies ScriptStructureBlock;
    })
    .filter((block): block is ScriptStructureBlock => block !== null);
}

export function parseShotList(json: Json): ShotListItem[] {
  if (!Array.isArray(json)) return [];
  return json
    .map((raw) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
      const item = raw as Record<string, unknown>;
      const type = item.type === "broll" ? "broll" : "take";
      const description = typeof item.description === "string" ? item.description : "";
      return { type, description } satisfies ShotListItem;
    })
    .filter((item): item is ShotListItem => item !== null);
}

export function parseScriptChecklist(json: Json): ScriptChecklist {
  const result: ScriptChecklist = { ...EMPTY_SCRIPT_CHECKLIST };
  if (!json || typeof json !== "object" || Array.isArray(json)) return result;
  const obj = json as Record<string, unknown>;
  for (const key of SCRIPT_CHECKLIST_KEYS) {
    result[key] = obj[key] === true;
  }
  return result;
}

/** Reconstrói um ScriptSnapshot a partir do jsonb salvo em content_script_versions.snapshot — usado para comparar com o snapshot atual e decidir se uma nova versão é necessária. */
export function parseScriptSnapshot(json: Json): ScriptSnapshot | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const obj = json as Record<string, unknown>;
  return {
    hook: typeof obj.hook === "string" ? obj.hook : null,
    hookVariations: Array.isArray(obj.hookVariations)
      ? obj.hookVariations.filter((value): value is string => typeof value === "string")
      : [],
    script: typeof obj.script === "string" ? obj.script : null,
    scriptStructure: parseScriptStructure((obj.scriptStructure as Json) ?? []),
    onScreenText: typeof obj.onScreenText === "string" ? obj.onScreenText : null,
    shotList: parseShotList((obj.shotList as Json) ?? []),
    caption: typeof obj.caption === "string" ? obj.caption : null,
    estimatedDurationSeconds: typeof obj.estimatedDurationSeconds === "number" ? obj.estimatedDurationSeconds : null,
  };
}

export function scriptChecklistProgress(checklist: ScriptChecklist): { checked: number; total: number } {
  const total = SCRIPT_CHECKLIST_KEYS.length;
  const checked = SCRIPT_CHECKLIST_KEYS.filter((key) => checklist[key]).length;
  return { checked, total };
}

export function isScriptChecklistComplete(checklist: ScriptChecklist): boolean {
  return SCRIPT_CHECKLIST_KEYS.every((key) => checklist[key]);
}

/**
 * Status anterior no pipeline canônico (CONTENT_STATUS_ORDER), usado pelo
 * botão "Voltar etapa". Retorna null quando já está no primeiro status
 * (nada para voltar).
 */
export function getPreviousContentStatus(status: ContentStatus): ContentStatus | null {
  const index = CONTENT_STATUS_ORDER.indexOf(status);
  if (index <= 0) return null;
  return CONTENT_STATUS_ORDER[index - 1];
}

interface StructureLabels {
  singular: string;
  plural: string;
  helpText: string;
}

/** Rótulos da estrutura por blocos conforme o formato do conteúdo (Carrossel → slides, Reel → cenas, Stories → telas). */
export function getStructureLabels(format: string | null | undefined): StructureLabels {
  const normalized = (format ?? "").trim().toLowerCase();
  if (normalized === "carousel") {
    return { singular: "Slide", plural: "Slides", helpText: "Estruture o carrossel slide a slide." };
  }
  if (normalized === "reel") {
    return { singular: "Cena", plural: "Cenas", helpText: "Estruture o reel cena a cena." };
  }
  if (normalized === "stories") {
    return { singular: "Tela", plural: "Telas", helpText: "Estruture a sequência de telas dos stories." };
  }
  return { singular: "Bloco", plural: "Blocos", helpText: "Estruture o conteúdo em blocos, na ordem de apresentação." };
}

/** Formata segundos como m:ss para exibição (ex.: 90 → "1:30"). Retorna "" quando não há duração informada. */
export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || Number.isNaN(totalSeconds)) return "";
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Throttle do histórico automático de versões (autosave): não cria uma nova versão se a última tiver menos que este intervalo. Salvar rascunho explicitamente ignora o throttle (ver saveScriptVersionNow). */
export const VERSION_AUTOSAVE_THROTTLE_MS = 3 * 60 * 1000;

export function shouldSkipAutoVersion(lastVersionAt: string | null | undefined, now: Date = new Date()): boolean {
  if (!lastVersionAt) return false;
  return now.getTime() - new Date(lastVersionAt).getTime() < VERSION_AUTOSAVE_THROTTLE_MS;
}

/** Compara dois snapshots de roteiro por conteúdo (não por referência) — usado para não criar versões idênticas em sequência. */
export function hasScriptSnapshotChanged(previous: ScriptSnapshot | null | undefined, next: ScriptSnapshot): boolean {
  if (!previous) return true;
  return JSON.stringify(previous) !== JSON.stringify(next);
}
