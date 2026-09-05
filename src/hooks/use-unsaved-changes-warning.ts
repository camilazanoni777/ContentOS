"use client";

import * as React from "react";

/**
 * Confirma antes de fechar a aba/recarregar enquanto houver alterações não
 * salvas (autosave com `dirty: true`, ver useAutosave). Cobre fechar
 * aba/recarregar/navegar para fora do site — a limitação conhecida é que
 * não intercepta navegação interna do App Router (Next.js ainda não expõe
 * um bloqueio de navegação estável para Server Components/Actions; ver
 * TODO.md).
 */
export function useUnsavedChangesWarning(dirty: boolean) {
  React.useEffect(() => {
    if (!dirty) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      // Alguns navegadores exigem returnValue definido para mostrar o
      // diálogo de confirmação nativo.
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);
}
