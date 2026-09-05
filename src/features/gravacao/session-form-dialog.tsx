"use client";

import * as React from "react";
import { useForm } from "react-hook-form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSession, updateSession } from "@/lib/actions/recording";
import type { RecordingSession } from "@/types/domain";
import type { RecordingSessionFormValues } from "./session-form-types";

interface SessionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: RecordingSession | null;
  onSaved: (session: RecordingSession) => void;
}

function toDefaultValues(session?: RecordingSession | null): RecordingSessionFormValues {
  return {
    sessionDate: session?.session_date ?? "",
    location: session?.location ?? "",
    scenario: session?.scenario ?? "",
    outfit: session?.outfit ?? "",
    equipment: session?.equipment ?? "",
    availableMinutes: session?.available_minutes !== null && session?.available_minutes !== undefined ? String(session.available_minutes) : "",
    notes: session?.notes ?? "",
  };
}

interface SessionFormInnerProps {
  session?: RecordingSession | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (session: RecordingSession) => void;
}

/**
 * Conteúdo do formulário, isolado num componente próprio montado só
 * enquanto o diálogo está aberto (ver SessionFormDialog abaixo). Assim,
 * `defaultValues` e o estado de erro nascem sempre limpos a cada abertura
 * — sem precisar de um efeito para "resetar" o formulário (evita o aviso
 * de setState-em-efeito do React Compiler).
 */
function SessionFormInner({ session, onOpenChange, onSaved }: SessionFormInnerProps) {
  const { register, handleSubmit, formState } = useForm<RecordingSessionFormValues>({
    defaultValues: toDefaultValues(session),
  });
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(values: RecordingSessionFormValues) {
    setError(null);
    const result = session ? await updateSession(session.id, values) : await createSession(values);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onSaved(result.session);
    onOpenChange(false);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sessionDate">Data</Label>
          <Input id="sessionDate" type="date" {...register("sessionDate")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="availableMinutes">Tempo disponível (min)</Label>
          <Input id="availableMinutes" inputMode="numeric" placeholder="Ex.: 120" {...register("availableMinutes")} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="location">Local</Label>
        <Input id="location" {...register("location")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="scenario">Cenário</Label>
          <Input id="scenario" {...register("scenario")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="outfit">Roupa</Label>
          <Input id="outfit" {...register("outfit")} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="equipment">Equipamento</Label>
        <Textarea id="equipment" rows={2} {...register("equipment")} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" rows={2} {...register("notes")} />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Salvando..." : "Salvar sessão"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Diálogo de criar/editar uma sessão de gravação em lote. */
export function SessionFormDialog({ open, onOpenChange, session, onSaved }: SessionFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{session ? "Editar sessão de gravação" : "Nova sessão de gravação"}</DialogTitle>
          <DialogDescription>
            Agrupe conteúdos sob um mesmo cenário e roupa para reduzir trocas durante a gravação.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <SessionFormInner key={session?.id ?? "new"} session={session} onOpenChange={onOpenChange} onSaved={onSaved} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
