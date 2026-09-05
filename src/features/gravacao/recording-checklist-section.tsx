"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { recordingChecklistProgress } from "@/lib/recording";
import { RECORDING_CHECKLIST_KEYS, RECORDING_CHECKLIST_LABELS, type RecordingChecklist, type RecordingChecklistKey } from "@/types/domain";

interface RecordingChecklistSectionProps {
  value: RecordingChecklist;
  onChange: (key: RecordingChecklistKey, checked: boolean) => void;
  compact?: boolean;
}

/**
 * Checklist fixo de gravação (8 itens): roteiro aberto, cenário,
 * iluminação, áudio, take principal, B-roll, capa e backup. Orientativo —
 * não bloqueia "Marcar como gravado".
 */
export function RecordingChecklistSection({ value, onChange, compact = false }: RecordingChecklistSectionProps) {
  const progress = recordingChecklistProgress(value);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Checklist de gravação</span>
        <span className="text-xs text-muted-foreground">
          {progress.checked}/{progress.total}
        </span>
      </div>
      <div className={compact ? "grid grid-cols-2 gap-x-3 gap-y-1.5" : "flex flex-col gap-2"}>
        {RECORDING_CHECKLIST_KEYS.map((key) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={value[key]}
              onCheckedChange={(checked) => onChange(key, checked)}
              aria-label={RECORDING_CHECKLIST_LABELS[key]}
            />
            {RECORDING_CHECKLIST_LABELS[key]}
          </label>
        ))}
      </div>
    </div>
  );
}
