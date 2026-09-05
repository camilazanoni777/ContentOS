import type { Metadata } from "next";
import { RoteirosList } from "@/features/roteiros/roteiros-list";

export const metadata: Metadata = { title: "Roteiros — Cami Content OS" };

export default function RoteirosPage() {
  return <RoteirosList />;
}
