import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/states";
import { StatusBadge } from "@/components/layout/status-badge";
import { CONTENT_STATUS_ROUTE } from "@/lib/content-status-meta";
import type { ContentItem } from "@/types/domain";

export function PlannedTodayCard({ items }: { items: ContentItem[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <CardTitle className="text-base">Conteúdos planejados para hoje</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            title="Nada planejado para hoje ainda"
            description="Conteúdos com data planejada para hoje aparecem aqui."
            className="py-8"
          />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link
                  href={CONTENT_STATUS_ROUTE[item.status]}
                  className="min-w-0 flex-1 truncate text-sm font-medium text-foreground hover:text-accent"
                >
                  {item.title}
                </Link>
                <StatusBadge status={item.status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
