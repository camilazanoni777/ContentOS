"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { AlertTriangle } from "lucide-react";

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
import { markAsPublished } from "@/lib/actions/agendamento";
import { toDateTimeLocalInput } from "@/lib/dates";
import type { ContentItem } from "@/types/domain";

interface MarkAsPublishedFormValues {
  publishedAt: string;
  publishedUrl: string;
}

interface MarkAsPublishedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ContentItem;
  onPublished: (item: ContentItem) => void;
}

function nowAsDateTimeLocal(): string {
  return toDateTimeLocalInput(new Date().toISOString());
}

/**
 * Formulário isolado num componente próprio montado só enquanto o diálogo
 * está aberto, para nascer sempre com valores/erro limpos sem precisar de
 * um efeito de reset (mesmo cuidado de SessionFormInner em Gravação).
 */
function MarkAsPublishedFormInner({
  item,
  onOpenChange,
  onPublished,
}: {
  item: ContentItem;
  onOpenChange: (open: boolean) => void;
  onPublished: (item: ContentItem) => void;
}) {
  const { register, handleSubmit, formState } = useForm<MarkAsPublishedFormValues>({
    defaultValues: {
      publishedAt: item.published_at ? toDateTimeLocalInput(item.published_at) : nowAsDateTimeLocal(),
      publishedUrl: item.published_url ?? "",
    },
  });
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(values: MarkAsPublishedFormValues) {
    setError(null);
    const result = await markAsPublished(item.id, values);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onPublished(result.item);
    onOpenChange(false);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="publishedAt">Data e hora reais de publicação</Label>
        <Input id="publishedAt" type="datetime-local" required {...register("publishedAt", { required: true })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="publishedUrl">URL do post (pode adicionar depois)</Label>
        <Input id="publishedUrl" type="url" placeholder="https://instagram.com/p/..." {...register("publishedUrl")} />
      </div>
      {!item.published_url ? (
        <p className="flex items-start gap-1.5 text-xs text-tone-warning-fg">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Sem URL, este conteúdo aparecerá como pendência em Publicados até você adicionar o link.
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Publicando..." : "Marcar como publicado"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Diálogo de "Marcar como publicado" — exige data/hora real; nunca publica sem ela (ver validations/agendamento.ts + CHECK constraint no banco). */
export function MarkAsPublishedDialog({ open, onOpenChange, item, onPublished }: MarkAsPublishedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar como publicado</DialogTitle>
          <DialogDescription>
            A data e hora reais são obrigatórias — não é possível marcar como publicado sem elas.
          </DialogDescription>
        </DialogHeader>
        {open ? <MarkAsPublishedFormInner item={item} onOpenChange={onOpenChange} onPublished={onPublished} /> : null}
      </DialogContent>
    </Dialog>
  );
}
