"use client";

import { Plus, X } from "lucide-react";
import { useFieldArray, type Control } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScriptFormValues } from "./script-form-types";

const MAX_VARIATIONS = 5;

interface HookVariationsFieldArrayProps {
  control: Control<ScriptFormValues>;
}

/** Até 5 variações de gancho testadas — texto livre, sem vínculo com nenhuma outra tabela. */
export function HookVariationsFieldArray({ control }: HookVariationsFieldArrayProps) {
  const { fields, append, remove, update } = useFieldArray({ control, name: "hookVariations" });

  return (
    <div className="flex flex-col gap-3">
      <Label>Variações de gancho testadas (até {MAX_VARIATIONS})</Label>
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <Input
            aria-label={`Variação de gancho ${index + 1}`}
            placeholder={`Variação ${index + 1}`}
            value={field.value}
            onChange={(event) => update(index, { value: event.target.value })}
            className="flex-1"
          />
          <Button type="button" variant="ghost" size="icon" aria-label="Remover variação" onClick={() => remove(index)}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ))}
      {fields.length < MAX_VARIATIONS ? (
        <Button type="button" variant="outline" size="sm" className="gap-1.5 self-start" onClick={() => append({ value: "" })}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Adicionar variação
        </Button>
      ) : null}
    </div>
  );
}
