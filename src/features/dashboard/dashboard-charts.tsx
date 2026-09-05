"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { DailyPlannedPublishedPoint, DailyReachViewsPoint, FollowersSeriesPoint } from "@/lib/dashboard";

function formatDateShort(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/** "Como os seguidores evoluíram dia a dia neste período?" */
export function FollowersEvolutionChart({ points }: { points: FollowersSeriesPoint[] }) {
  const hasData = points.some((p) => p.followers !== null);
  if (!hasData) return <p className="text-sm text-muted-foreground">Sem check-ins de seguidores neste período ainda.</p>;

  const data = points.map((p) => ({ date: formatDateShort(p.date), followers: p.followers }));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} width={56} domain={["auto", "auto"]} />
          <Tooltip formatter={(value) => [Number(value).toLocaleString("pt-BR"), "Seguidores"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Line type="monotone" dataKey="followers" stroke="var(--color-tone-progress-fg)" strokeWidth={2} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** "Como alcance e views evoluíram dia a dia neste período?" */
export function ReachViewsChart({ points }: { points: DailyReachViewsPoint[] }) {
  const hasData = points.some((p) => p.views !== null || p.reach !== null);
  if (!hasData) return <p className="text-sm text-muted-foreground">Nenhum conteúdo publicado com leitura de views/alcance neste período.</p>;

  const data = points.map((p) => ({ date: formatDateShort(p.date), views: p.views, reach: p.reach }));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} width={56} />
          <Tooltip formatter={(value, name) => [Number(value).toLocaleString("pt-BR"), name === "views" ? "Views" : "Alcance"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Line type="monotone" dataKey="views" stroke="var(--color-tone-info-fg)" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="reach" stroke="var(--color-tone-success-fg)" strokeWidth={2} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** "Quanto do planejado por dia foi de fato publicado?" */
export function PlannedVsPublishedChart({ points }: { points: DailyPlannedPublishedPoint[] }) {
  const hasData = points.some((p) => p.planned > 0 || p.published > 0);
  if (!hasData) return <p className="text-sm text-muted-foreground">Nada planejado nem publicado neste período.</p>;

  const data = points.map((p) => ({ date: formatDateShort(p.date), planejado: p.planned, publicado: p.published }));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="planejado" fill="var(--color-tone-neutral-fg)" radius={[4, 4, 0, 0]} maxBarSize={20} />
          <Bar dataKey="publicado" fill="var(--color-tone-progress-fg)" radius={[4, 4, 0, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** "Qual grupo (formato/pilar/objetivo) performa melhor?" */
export function GroupPerformanceChart({ data, labelFor }: { data: { key: string; averageIndex: number; sampleSize: number }[]; labelFor: (key: string) => string }) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground">Nenhum conteúdo com índice calculável neste período.</p>;

  const chartData = data.map((d) => ({ label: labelFor(d.key), index: Math.round(d.averageIndex), sampleSize: d.sampleSize }));
  return (
    <div style={{ height: Math.max(140, chartData.length * 36) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
          <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} fontSize={12} width={110} />
          <Tooltip formatter={(value, _name, item) => [`Índice ${value} (${item.payload.sampleSize} conteúdo(s))`, ""]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="index" fill="var(--color-tone-info-fg)" radius={[0, 4, 4, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
