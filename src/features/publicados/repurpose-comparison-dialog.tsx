"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildRepurposeComparison } from "@/lib/publicados";
import type { ContentItem } from "@/types/domain";

interface RepurposeComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  original: ContentItem;
  repurposed: ContentItem;
}

/** Comparação lado a lado entre o conteúdo original e sua versão reaproveitada (source_content_id). */
export function RepurposeComparisonDialog({ open, onOpenChange, original, repurposed }: RepurposeComparisonDialogProps) {
  const fields = buildRepurposeComparison(original, repurposed);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Original × Reaproveitado</DialogTitle>
          <DialogDescription>Comparação entre &quot;{original.title}&quot; e sua versão reaproveitada.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Campo</th>
                <th className="py-2 pr-3 font-medium">Original</th>
                <th className="py-2 font-medium">Reaproveitado</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field.key} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-3 font-medium text-muted-foreground">{field.label}</td>
                  <td className="py-2 pr-3 whitespace-pre-wrap">{field.original ?? "—"}</td>
                  <td className={`py-2 whitespace-pre-wrap ${field.changed ? "font-medium text-tone-info-fg" : ""}`}>
                    {field.repurposed ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
