"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { editChecklistProgress } from "@/lib/editing";
import { EDIT_CHECKLIST_KEYS, EDIT_CHECKLIST_LABELS, type EditChecklist, type EditChecklistKey } from "@/types/domain";

interface EditChecklistSectionProps {
  value: EditChecklist;
  onChange: (key: EditChecklistKey, checked: boolean) => void;
}

/**
 * Checklist fixo de qualidade da edição (9 itens): gancho nos primeiros
 * segundos, ritmo, cortes, áudio, legenda, safe zones, identidade visual,
 * CTA e revisão ortográfica. Orientativo — não bloqueia "Enviar para
 * aprovação"/"Aprovar".
 */
export function EditChecklistSection({ value, onChange }: EditChecklistSectionProps) {
  const progress = editChecklistProgress(value);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label>Checklist de qualidade</Label>
        <span className="text-xs text-muted-foreground">
          {progress.checked}/{progress.total} concluídos
        </span>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {EDIT_CHECKLIST_KEYS.map((key) => (
          <label key={key} className="flex cursor-pointer items-center gap-2.5 text-sm">
            <Checkbox
              checked={value[key]}
              onCheckedChange={(checked) => onChange(key, checked)}
              aria-label={EDIT_CHECKLIST_LABELS[key]}
            />
            {EDIT_CHECKLIST_LABELS[key]}
          </label>
        ))}
      </div>
    </div>
  );
}
