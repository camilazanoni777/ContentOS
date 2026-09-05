"use client";

import { Plus, X } from "lucide-react";
import { useFieldArray, type Control } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ContentItem, Goal } from "@/types/domain";
import type { CheckinFormValues } from "./checkin-form-types";

interface PrioritiesFieldArrayProps {
  control: Control<CheckinFormValues>;
  contentItems: ContentItem[];
  goals: Goal[];
}

/** Até 3 prioridades do dia — texto livre, com vínculo opcional a um conteúdo ou meta. */
export function PrioritiesFieldArray({ control, contentItems, goals }: PrioritiesFieldArrayProps) {
  const { fields, append, remove, update } = useFieldArray({ control, name: "priorities" });

  function linkValue(field: (typeof fields)[number]): string {
    if (field.contentItemId) return `content:${field.contentItemId}`;
    if (field.goalId) return `goal:${field.goalId}`;
    return "";
  }

  function handleLinkChange(index: number, value: string) {
    const field = fields[index];
    if (value.startsWith("content:")) {
      update(index, { ...field, contentItemId: value.slice("content:".length), goalId: "" });
    } else if (value.startsWith("goal:")) {
      update(index, { ...field, goalId: value.slice("goal:".length), contentItemId: "" });
    } else {
      update(index, { ...field, contentItemId: "", goalId: "" });
    }
  }

  function handleLabelChange(index: number, label: string) {
    update(index, { ...fields[index], label });
  }

  return (
    <div className="flex flex-col gap-3">
      <Label>Prioridades de hoje (até 3)</Label>
      {fields.map((field, index) => (
        <div key={field.id} className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center">
          <Input
            aria-label={`Prioridade ${index + 1}`}
            placeholder={`Prioridade ${index + 1}`}
            value={field.label}
            onChange={(event) => handleLabelChange(index, event.target.value)}
            className="flex-1"
          />
          <Select
            aria-label="Vincular a conteúdo ou meta"
            value={linkValue(field)}
            onChange={(event) => handleLinkChange(index, event.target.value)}
            className="sm:w-56"
          >
            <option value="">Sem vínculo</option>
            {contentItems.length > 0 ? (
              <optgroup label="Conteúdos">
                {contentItems.map((item) => (
                  <option key={item.id} value={`content:${item.id}`}>
                    {item.title}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {goals.length > 0 ? (
              <optgroup label="Metas">
                {goals.map((goal) => (
                  <option key={goal.id} value={`goal:${goal.id}`}>
                    {goal.metric}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remover prioridade"
            onClick={() => remove(index)}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ))}
      {fields.length < 3 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 self-start"
          onClick={() => append({ label: "", contentItemId: "", goalId: "" })}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Adicionar prioridade
        </Button>
      ) : null}
    </div>
  );
}
