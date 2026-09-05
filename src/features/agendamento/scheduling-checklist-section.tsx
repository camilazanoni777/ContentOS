"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { schedulingChecklistProgress } from "@/lib/agendamento";
import {
  SCHEDULING_CHECKLIST_KEYS,
  SCHEDULING_CHECKLIST_LABELS,
  type SchedulingChecklist,
  type SchedulingChecklistKey,
} from "@/types/domain";

interface SchedulingChecklistSectionProps {
  value: SchedulingChecklist;
  onChange: (key: SchedulingChecklistKey, checked: boolean) => void;
}

/**
 * Checklist final fixo (6 itens) antes de agendar/publicar de fato.
 * Orientativo — não bloqueia "Marcar como publicado" (só a data/hora real
 * é obrigatória, ver canMarkAsPublished em src/lib/agendamento.ts).
 */
export function SchedulingChecklistSection({ value, onChange }: SchedulingChecklistSectionProps) {
  const progress = schedulingChecklistProgress(value);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Checklist final</span>
        <span className="text-xs text-muted-foreground">
          {progress.checked}/{progress.total}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {SCHEDULING_CHECKLIST_KEYS.map((key) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={value[key]}
              onCheckedChange={(checked) => onChange(key, checked)}
              aria-label={SCHEDULING_CHECKLIST_LABELS[key]}
            />
            {SCHEDULING_CHECKLIST_LABELS[key]}
          </label>
        ))}
      </div>
    </div>
  );
}
