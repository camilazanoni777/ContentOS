"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Tema claro como padrão; tema escuro é opcional (usuária escolhe pelo
 * ThemeToggle). attribute="class" aplica/remove a classe `.dark` na tag
 * <html>, que é o gatilho para os tokens em globals.css.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
