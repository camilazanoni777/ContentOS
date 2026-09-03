"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QuickCaptureDrawer } from "@/features/ideias/quick-capture-drawer";

/** Botão global de captura rápida — disponível na barra superior em qualquer rota. */
export function QuickCaptureButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Nova ideia</span>
      </Button>
      <QuickCaptureDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}
