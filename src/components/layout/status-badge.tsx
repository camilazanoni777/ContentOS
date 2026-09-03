import { cn } from "@/lib/utils";
import { toneClasses } from "@/lib/tone-classes";
import { CONTENT_STATUS_META } from "@/lib/content-status-meta";
import type { ContentStatus } from "@/types/domain";

/**
 * Status sempre identificável por texto + cor + ícone (nunca cor sozinha) —
 * requisito de acessibilidade e de legibilidade editorial.
 */
export function StatusBadge({ status, className }: { status: ContentStatus; className?: string }) {
  const meta = CONTENT_STATUS_META[status];
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses(meta.tone),
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {meta.label}
    </span>
  );
}
