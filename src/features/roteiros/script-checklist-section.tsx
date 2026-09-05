"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { scriptChecklistProgress } from "@/lib/script-workspace";
import { SCRIPT_CHECKLIST_KEYS, SCRIPT_CHECKLIST_LABELS, type ScriptChecklist, type ScriptChecklistKey } from "@/types/domain";

interface ScriptChecklistSectionProps {
  value: ScriptChecklist;
  onChange: (key: ScriptChecklistKey, checked: boolean) => void;
}

/**
 * Checklist fixo de roteiro (6 itens, não customizável — diferente do
 * checklist diário do Check-in): promessa clara, gancho forte, entrega,
 * prova/exemplo, CTA e coerência com o objetivo. Serve como validação de
 * conteúdo antes de marcar como pronto para gravar — não bloqueia a ação,
 * só orienta.
 */
export function ScriptChecklistSection({ value, onChange }: ScriptChecklistSectionProps) {
  const progress = scriptChecklistProgress(value);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label>Checklist de roteiro</Label>
        <span className="text-xs text-muted-foreground">
          {progress.checked}/{progress.total} concluídos
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {SCRIPT_CHECKLIST_KEYS.map((key) => (
          <label key={key} className="flex cursor-pointer items-center gap-2.5 text-sm">
            <Checkbox
              checked={value[key]}
              onCheckedChange={(checked) => onChange(key, checked)}
              aria-label={SCRIPT_CHECKLIST_LABELS[key]}
            />
            {SCRIPT_CHECKLIST_LABELS[key]}
          </label>
        ))}
      </div>
    </div>
  );
}
