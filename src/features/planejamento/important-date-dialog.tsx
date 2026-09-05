"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Trash2 } from "lucide-react";

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
import { createImportantDate, deleteImportantDate, updateImportantDate } from "@/lib/actions/calendario";
import type { CalendarImportantDate } from "@/types/domain";

interface ImportantDateFormValues {
  eventDate: string;
  label: string;
  notes: string;
}

interface ImportantDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: string;
  date?: CalendarImportantDate | null;
  onSaved: (date: CalendarImportantDate) => void;
  onDeleted?: (id: string) => void;
}

function ImportantDateFormInner({
  defaultDate,
  date,
  onOpenChange,
  onSaved,
  onDeleted,
}: {
  defaultDate: string;
  date?: CalendarImportantDate | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (date: CalendarImportantDate) => void;
  onDeleted?: (id: string) => void;
}) {
  const { register, handleSubmit, formState } = useForm<ImportantDateFormValues>({
    defaultValues: {
      eventDate: date?.event_date ?? defaultDate,
      label: date?.label ?? "",
      notes: date?.notes ?? "",
    },
  });
  const [error, setError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  async function onSubmit(values: ImportantDateFormValues) {
    setError(null);
    const result = date ? await updateImportantDate(date.id, values) : await createImportantDate(values);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onSaved(result.date);
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!date) return;
    setDeleting(true);
    setError(null);
    const result = await deleteImportantDate(date.id);
    setDeleting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onDeleted?.(date.id);
    onOpenChange(false);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="eventDate">Data</Label>
        <Input id="eventDate" type="date" required {...register("eventDate", { required: true })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="label">Nome</Label>
        <Input id="label" required placeholder="Ex.: Lançamento do produto X" {...register("label", { required: true })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" rows={3} {...register("notes")} />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <DialogFooter className="sm:justify-between">
        {date ? (
          <Button type="button" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" disabled={deleting} onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {deleting ? "Excluindo..." : "Excluir"}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

/** Diálogo de criar/editar/excluir uma data importante do calendário editorial. */
export function ImportantDateDialog({ open, onOpenChange, defaultDate, date, onSaved, onDeleted }: ImportantDateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{date ? "Editar data importante" : "Nova data importante"}</DialogTitle>
          <DialogDescription>Datas de campanhas, lançamentos ou eventos que devem aparecer no calendário editorial.</DialogDescription>
        </DialogHeader>
        {open ? (
          <ImportantDateFormInner key={date?.id ?? defaultDate} defaultDate={defaultDate} date={date} onOpenChange={onOpenChange} onSaved={onSaved} onDeleted={onDeleted} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
