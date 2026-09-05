"use client";

import { Plus, X } from "lucide-react";
import { useFieldArray, type Control } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ScriptFormValues } from "./script-form-types";

/** Lista de takes e B-roll a gravar — tipo (take/B-roll) + descrição curta. */
export function ShotListFieldArray({ control }: { control: Control<ScriptFormValues> }) {
  const { fields, append, remove, update } = useFieldArray({ control, name: "shotList" });

  return (
    <div className="flex flex-col gap-3">
      <Label>Takes e B-roll</Label>
      {fields.map((field, index) => (
        <div key={field.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            aria-label={`Tipo do item ${index + 1}`}
            value={field.type}
            onChange={(event) => update(index, { ...field, type: event.target.value as "take" | "broll" })}
            className="sm:w-32"
          >
            <option value="take">Take</option>
            <option value="broll">B-roll</option>
          </Select>
          <Input
            aria-label={`Descrição do item ${index + 1}`}
            placeholder="Ex.: Take 1 — falando direto pra câmera"
            value={field.description}
            onChange={(event) => update(index, { ...field, description: event.target.value })}
            className="flex-1"
          />
          <Button type="button" variant="ghost" size="icon" aria-label="Remover item" onClick={() => remove(index)}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 self-start"
        onClick={() => append({ type: "take", description: "" })}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Adicionar take/B-roll
      </Button>
    </div>
  );
}
