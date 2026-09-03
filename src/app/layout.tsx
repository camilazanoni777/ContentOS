import type { Metadata } from "next";

import { Providers } from "@/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Cami Content OS",
  description:
    "Sistema único para criação de conteúdo no Instagram: da ideia à publicação e à análise de resultados.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
