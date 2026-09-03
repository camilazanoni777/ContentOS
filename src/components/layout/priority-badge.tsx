import { cn } from "@/lib/utils";
import { toneClasses } from "@/lib/tone-classes";
import { getPriorityMeta } from "@/lib/content-status-meta";

export function PriorityBadge({ priority, className }: { priority: string | null; className?: string }) {
  const meta = getPriorityMeta(priority);
  if (!meta) return null;
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
