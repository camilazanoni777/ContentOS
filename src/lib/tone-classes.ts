import type { StatusTone } from "./content-status-meta";

/** Classes Tailwind (bg/fg) para cada tom semântico — ver tokens --tone-* em globals.css. */
export function toneClasses(tone: StatusTone): string {
  const map: Record<StatusTone, string> = {
    neutral: "bg-tone-neutral-bg text-tone-neutral-fg",
    progress: "bg-tone-progress-bg text-tone-progress-fg",
    info: "bg-tone-info-bg text-tone-info-fg",
    warning: "bg-tone-warning-bg text-tone-warning-fg",
    success: "bg-tone-success-bg text-tone-success-fg",
    danger: "bg-tone-danger-bg text-tone-danger-fg",
  };
  return map[tone];
}
