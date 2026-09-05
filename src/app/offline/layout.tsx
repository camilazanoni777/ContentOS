import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Você está offline — Cami Content OS",
};

export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
