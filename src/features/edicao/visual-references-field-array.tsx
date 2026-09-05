"use client";

import { Plus, X } from "lucide-react";
import { useFieldArray, type Control } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EditWorkspaceFormValues } from "./edicao-form-types";

/** Referências visuais da edição — rótulo curto + link (Pinterest, Drive, outro conteúdo etc.). */
export function VisualReferencesFieldArray({ control }: { control: Control<EditWorkspaceFormValues> }) {
  const { fields, append, remove, update } = useFieldArray({ control, name: "visualReferences" });

  return (
    <div className="flex flex-col gap-3">
      <Label>Referências visuais</Label>
      {fields.map((field, index) => (
        <div key={field.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            aria-label={`Rótulo da referência ${index + 1}`}
            placeholder="Ex.: Transição de abertura"
            value={field.label}
            onChange={(event) => update(index, { ...field, label: event.target.value })}
            className="sm:w-56"
          />
          <Input
            aria-label={`Link da referência ${index + 1}`}
            placeholder="https://..."
            value={field.url}
            onChange={(event) => update(index, { ...field, url: event.target.value })}
            className="flex-1"
          />
          <Button type="button" variant="ghost" size="icon" aria-label="Remover referência" onClick={() => remove(index)}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 self-start"
        onClick={() => append({ label: "", url: "" })}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Adicionar referência
      </Button>
    </div>
  );
}
