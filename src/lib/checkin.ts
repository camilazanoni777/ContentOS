import type { CheckinPriority } from "@/types/domain";
import type { Json } from "@/types/database";

/**
 * Lê `daily_checkins.priorities` (jsonb) como CheckinPriority[] de forma
 * defensiva — nunca confia cegamente no formato vindo do banco (poderia
 * estar vazio, nulo ou, em teoria, ter sido escrito por outra ferramenta).
 */
export function parseCheckinPriorities(json: Json | null | undefined): CheckinPriority[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((item): item is Record<string, Json> => typeof item === "object" && item !== null && !Array.isArray(item))
    .map((item) => ({
      label: typeof item.label === "string" ? item.label : "",
      contentItemId: typeof item.contentItemId === "string" ? item.contentItemId : null,
      goalId: typeof item.goalId === "string" ? item.goalId : null,
    }))
    .filter((priority) => priority.label.trim().length > 0);
}
