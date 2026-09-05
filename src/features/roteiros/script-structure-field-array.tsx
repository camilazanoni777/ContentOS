"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useFieldArray, type Control } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getStructureLabels } from "@/lib/script-workspace";
import type { ScriptFormValues } from "./script-form-types";

interface ScriptStructureFieldArrayProps {
  control: Control<ScriptFormValues>;
  format: string;
}

/**
 * Estrutura por blocos do roteiro. O rótulo muda conforme o formato do
 * conteúdo (Carrossel → slides, Reel → cenas, Stories → telas) mas o dado é
 * sempre o mesmo formato — a posição na lista É a ordem, sem campo
 * numérico separado (mover com as setas reordena de verdade).
 */
export function ScriptStructureFieldArray({ control, format }: ScriptStructureFieldArrayProps) {
  const { fields, append, remove, update, move } = useFieldArray({ control, name: "scriptStructure" });
  const labels = getStructureLabels(format);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label>Estrutura por {labels.plural.toLowerCase()}</Label>
        <p className="text-xs text-muted-foreground">{labels.helpText}</p>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex flex-col gap-2 rounded-md border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {labels.singular} {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Mover ${labels.singular.toLowerCase()} para cima`}
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
              >
                <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Mover ${labels.singular.toLowerCase()} para baixo`}
                disabled={index === fields.length - 1}
                onClick={() => move(index, index + 1)}
              >
                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label={`Remover ${labels.singular.toLowerCase()}`} onClick={() => remove(index)}>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
          <Textarea
            aria-label={`Conteúdo do ${labels.singular.toLowerCase()} ${index + 1}`}
            placeholder={`O que acontece n${labels.singular === "Slide" ? "este" : "esta"} ${labels.singular.toLowerCase()}...`}
            rows={2}
            value={field.content}
            onChange={(event) => update(index, { ...field, content: event.target.value })}
          />
          <Input
            aria-label={`Nota do ${labels.singular.toLowerCase()} ${index + 1}`}
            placeholder="Nota opcional (direção de arte, referência...)"
            value={field.note}
            onChange={(event) => update(index, { ...field, note: event.target.value })}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 self-start"
        onClick={() => append({ content: "", note: "" })}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Adicionar {labels.singular.toLowerCase()}
      </Button>
    </div>
  );
}
