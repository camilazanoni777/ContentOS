"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { MetricSnapshot } from "@/types/domain";
import type { RankedContentItem } from "@/lib/metricas";

/** Comparação de views entre as janelas 24h/7d/30d de um conteúdo — vazio quando não há nenhuma leitura com views informado. */
export function ViewsComparisonChart({ snapshots }: { snapshots: MetricSnapshot[] }) {
  const data = (["24h", "7d", "30d"] as const)
    .map((window) => {
      const snapshot = snapshots.find((s) => s.window_type === window);
      return { window, views: snapshot?.views ?? null };
    })
    .filter((point) => point.views !== null);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem views registradas em nenhuma janela fixa ainda.</p>;
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="window" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} />
          <Tooltip
            formatter={(value) => [Number(value).toLocaleString("pt-BR"), "Views"]}
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="views" radius={[4, 4, 0, 0]} fill="var(--color-tone-info-fg)" maxBarSize={64} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const TIER_BAR_COLOR: Record<string, string> = {
  below_average: "var(--color-tone-warning-fg)",
  average: "var(--color-tone-neutral-fg)",
  above_average: "var(--color-tone-success-fg)",
  viral: "var(--color-tone-progress-fg)",
};

/** Ranking visual (barras horizontais) dos conteúdos com maior índice de performance na janela comparada. */
export function PerformanceRankingChart({ ranked }: { ranked: RankedContentItem[] }) {
  if (ranked.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum conteúdo com índice calculável ainda nesta janela.</p>;
  }

  const data = ranked.map((entry) => ({
    title: entry.item.title.length > 28 ? `${entry.item.title.slice(0, 27)}…` : entry.item.title,
    index: entry.result.index ?? 0,
    tier: entry.result.tier ?? "average",
  }));

  return (
    <div style={{ height: Math.max(160, data.length * 36) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
          <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis type="category" dataKey="title" tickLine={false} axisLine={false} fontSize={12} width={140} />
          <Tooltip formatter={(value) => [Number(value), "Índice"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="index" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((entry, index) => (
              <Cell key={index} fill={TIER_BAR_COLOR[entry.tier] ?? TIER_BAR_COLOR.average} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
