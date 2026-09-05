import Link from "next/link";
import { AlertTriangle, BarChart3, PartyPopper } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toneClasses } from "@/lib/tone-classes";
import { CONTENT_STATUS_ROUTE } from "@/lib/content-status-meta";
import type { HojeActionableItem } from "@/lib/data/hoje";

const TYPE_META: Record<HojeActionableItem["type"], { label: string; icon: typeof AlertTriangle; tone: "danger" | "warning" }> = {
  atrasado: { label: "Atrasado", icon: AlertTriangle, tone: "danger" },
  metrica_pendente: { label: "Métrica pendente", icon: BarChart3, tone: "warning" },
};

/** Pendências acionáveis do dia: conteúdo atrasado ou publicado sem métrica lida ainda. */
export function ActionableCard({ items }: { items: HojeActionableItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pendências acionáveis</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <PartyPopper className="h-6 w-6 text-tone-success-fg" aria-hidden="true" />
            <p className="text-sm font-medium">Tudo em dia por aqui!</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Nenhum conteúdo atrasado ou métrica pendente de leitura agora.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {items.map((item) => {
              const meta = TYPE_META[item.type];
              const Icon = meta.icon;
              const href =
                item.type === "metrica_pendente" ? "/metricas/conteudos" : item.status ? CONTENT_STATUS_ROUTE[item.status] : "/ideias";
              return (
                <li key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={href} className="min-w-0 flex-1 truncate text-sm font-medium text-foreground hover:text-accent">
                    {item.title}
                  </Link>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses(meta.tone)}`}>
                    <Icon className="h-3 w-3" aria-hidden="true" />
                    {meta.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
