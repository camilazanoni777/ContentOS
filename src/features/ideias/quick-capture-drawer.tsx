"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDrawer } from "@/components/layout/form-drawer";
import { createQuickContentIdea } from "@/lib/actions/content-items";
import { quickIdeaSchema, type QuickIdeaInput } from "@/lib/validations/content-item";

interface QuickCaptureDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emptyValues: QuickIdeaInput = { title: "", hook: "", pillar: "", referenceText: "" };

/** Formulário funcional da captura rápida: só o título é obrigatório. */
export function QuickCaptureDrawer({ open, onOpenChange }: QuickCaptureDrawerProps) {
  const [formError, setFormError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuickIdeaInput>({
    resolver: zodResolver(quickIdeaSchema),
    defaultValues: emptyValues,
  });

  React.useEffect(() => {
    if (!open) {
      // Limpa o formulário só depois que o drawer termina de fechar,
      // evitando o usuário ver os campos "piscarem" vazios durante a saída.
      const timeout = setTimeout(() => {
        reset(emptyValues);
        setFormError(null);
        setSuccess(false);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [open, reset]);

  async function onSubmit(values: QuickIdeaInput) {
    setFormError(null);
    const result = await createQuickContentIdea(values);
    if ("error" in result) {
      setFormError(result.error);
      return;
    }
    setSuccess(true);
    setTimeout(() => onOpenChange(false), 900);
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Nova ideia"
      description="Salve o essencial agora — você completa o resto depois, no Banco de ideias."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quick-title">
            Título <span aria-hidden="true">*</span>
            <span className="sr-only">(obrigatório)</span>
          </Label>
          <Input id="quick-title" autoFocus {...register("title")} />
          {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quick-hook">Gancho (opcional)</Label>
          <Input id="quick-hook" {...register("hook")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quick-pillar">Pilar (opcional)</Label>
          <Input id="quick-pillar" placeholder="Ex.: Bastidores, Educacional..." {...register("pillar")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quick-reference">Referência (opcional)</Label>
          <Input id="quick-reference" placeholder="Link ou nota rápida" {...register("referenceText")} />
        </div>

        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        {success ? (
          <p className="flex items-center gap-1.5 text-sm text-tone-success-fg">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Ideia salva!
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting} className="mt-auto">
          {isSubmitting ? "Salvando..." : "Salvar ideia"}
        </Button>
      </form>
    </FormDrawer>
  );
}
