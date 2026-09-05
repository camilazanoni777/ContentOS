"use client";

import * as React from "react";
import { PwaProvider } from "./pwa-provider";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

/**
 * Ponto único de composição dos providers do app. Providers futuros
 * (tema, autenticação, etc.) devem ser adicionados aqui, não no layout raiz.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <PwaProvider>{children}</PwaProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
