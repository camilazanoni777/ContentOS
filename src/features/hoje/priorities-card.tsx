import Link from "next/link";
import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/states";
import { CONTENT_STATUS_ROUTE } from "@/lib/content-status-meta";
import type { CheckinPriority, ContentItem, Goal } from "@/types/domain";

interface PrioritiesCardProps {
  priorities: CheckinPriority[];
  contentById: Map<string, ContentItem>;
  goalById: Map<string, Goal>;
}

/** Mostra até 3 prioridades do check-in de hoje, resolvendo o vínculo (conteúdo/meta) quando houver. */
export function PrioritiesCard({ priorities, contentById, goalById }: PrioritiesCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <Target className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <CardTitle className="text-base">Prioridades de hoje</CardTitle>
      </CardHeader>
      <CardContent>
        {priorities.length === 0 ? (
          <EmptyState
            title="Nenhuma prioridade definida ainda"
            description="Defina até 3 prioridades no check-in de hoje."
            className="py-8"
          />
        ) : (
          <ol className="flex flex-col gap-2.5">
            {priorities.map((priority, index) => {
              const linkedContent = priority.contentItemId ? contentById.get(priority.contentItemId) : null;
              const linkedGoal = priority.goalId ? goalById.get(priority.goalId) : null;
              return (
                <li key={`${priority.label}-${index}`} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                    {index + 1}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground">{priority.label}</span>
                    {linkedContent ? (
                      <Link
                        href={CONTENT_STATUS_ROUTE[linkedContent.status]}
                        className="text-xs text-accent underline-offset-2 hover:underline"
                      >
                        Vinculado a “{linkedContent.title}”
                      </Link>
                    ) : null}
                    {linkedGoal ? (
                      <Link href="/metas" className="text-xs text-accent underline-offset-2 hover:underline">
                        Vinculado à meta “{linkedGoal.metric}”
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
