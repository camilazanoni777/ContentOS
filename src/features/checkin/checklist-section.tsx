"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Plus, RotateCcw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateChecklistCompletion } from "@/lib/checklist";
import {
  addCustomChecklistItem,
  setChecklistActionActive,
  toggleChecklistAction,
} from "@/lib/actions/checkin";
import { customChecklistItemSchema } from "@/lib/validations/checkin";
import type { DailyAction } from "@/types/domain";

interface ChecklistSectionProps {
  initialActions: DailyAction[];
}

/**
 * Checklist do dia com atualização otimista: marcar/desmarcar e
 * ativar/desativar refletem na tela na hora, e desfazem sozinhos (rollback)
 * se o servidor recusar a mudança. O percentual usa só ações ativas.
 */
export function ChecklistSection({ initialActions }: ChecklistSectionProps) {
  const router = useRouter();
  const [actions, setActions] = React.useState<DailyAction[]>(initialActions);

  // Ressincroniza com o servidor quando a página é revalidada (ex.: depois
  // de adicionar um item personalizado) — não sobrescreve durante toggles
  // otimistas normais, porque nesses casos o servidor já reflete o mesmo
  // estado que aplicamos localmente. Ajuste feito durante o render (padrão
  // recomendado pelo React para "derivar estado de props"), não num efeito
  // — evita o round-trip extra de içar o estado por cima do valor otimista.
  const [prevInitialActions, setPrevInitialActions] = React.useState(initialActions);
  if (initialActions !== prevInitialActions) {
    setPrevInitialActions(initialActions);
    setActions(initialActions);
  }
  const [pendingIds, setPendingIds] = React.useState<Set<string>>(new Set());
  const [newLabel, setNewLabel] = React.useState("");
  const [addError, setAddError] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  const { active, done, percent } = calculateChecklistCompletion(actions);

  function markPending(id: string, pending: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleToggleDone(action: DailyAction) {
    const nextDone = !action.is_done;
    const previous = actions;
    setActions((prev) => prev.map((a) => (a.id === action.id ? { ...a, is_done: nextDone } : a)));
    markPending(action.id, true);
    const result = await toggleChecklistAction(action.id, nextDone);
    markPending(action.id, false);
    if ("error" in result) {
      setActions(previous);
    }
  }

  async function handleToggleActive(action: DailyAction) {
    const nextActive = !action.is_active;
    const previous = actions;
    setActions((prev) => prev.map((a) => (a.id === action.id ? { ...a, is_active: nextActive } : a)));
    markPending(action.id, true);
    const result = await setChecklistActionActive(action.id, nextActive);
    markPending(action.id, false);
    if ("error" in result) {
      setActions(previous);
    }
  }

  async function handleAddCustom(event: React.FormEvent) {
    event.preventDefault();
    const parsed = customChecklistItemSchema.safeParse({ label: newLabel });
    if (!parsed.success) {
      setAddError(parsed.error.issues[0]?.message ?? "Nome inválido.");
      return;
    }
    setAddError(null);
    setAdding(true);
    const result = await addCustomChecklistItem(parsed.data);
    setAdding(false);
    if ("error" in result) {
      setAddError(result.error);
      return;
    }
    setNewLabel("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Checklist de hoje</CardTitle>
        <span className="text-sm font-medium text-muted-foreground">
          {percent === null ? "Nenhum item ativo" : `${done}/${active} · ${percent}%`}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {percent !== null ? (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary" role="presentation">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${percent}%` }} />
          </div>
        ) : null}

        <ul className="flex flex-col gap-1">
          {actions.map((action) => (
            <li
              key={action.id}
              className={`flex items-center gap-3 rounded-md px-2 py-2 transition-opacity ${action.is_active ? "" : "opacity-50"}`}
            >
              <Checkbox
                id={`action-${action.id}`}
                checked={action.is_done}
                onCheckedChange={() => handleToggleDone(action)}
                disabled={pendingIds.has(action.id) || !action.is_active}
              />
              <Label htmlFor={`action-${action.id}`} className="flex-1 cursor-pointer text-sm font-normal">
                {action.title}
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto gap-1 px-2 py-1 text-xs text-muted-foreground"
                onClick={() => handleToggleActive(action)}
                disabled={pendingIds.has(action.id)}
              >
                {action.is_active ? (
                  <>
                    <EyeOff className="h-3 w-3" aria-hidden="true" />
                    <span className="hidden sm:inline">Não se aplica hoje</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    <span className="hidden sm:inline">Reativar</span>
                  </>
                )}
              </Button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleAddCustom} className="flex items-end gap-2 border-t border-border pt-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="custom-checklist-item">Adicionar item personalizado</Label>
            <Input
              id="custom-checklist-item"
              placeholder="Ex.: Responder e-mails de parceria"
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" size="sm" disabled={adding} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Adicionar
          </Button>
        </form>
        {addError ? <p className="text-sm text-destructive">{addError}</p> : null}
      </CardContent>
    </Card>
  );
}
