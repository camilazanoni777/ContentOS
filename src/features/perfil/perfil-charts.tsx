"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { ProfileSnapshot } from "@/types/domain";
import { movingAverage, sortSnapshotsByDate } from "@/lib/perfil";

function formatDateLabel(dateISO: string): string {
  const [, month, day] = dateISO.split("-");
  return `${day}/${month}`;
}

/** Evolução de seguidores no tempo, com a média móvel de 7 dias sobreposta — vazio quando não há nenhuma leitura de seguidores. */
export function FollowersTrendChart({ snapshots }: { snapshots: ProfileSnapshot[] }) {
  const sorted = sortSnapshotsByDate(snapshots);
  const data = sorted
    .filter((s) => typeof s.followers === "number")
    .map((s) => ({
      date: formatDateLabel(s.snapshot_date),
      seguidores: s.followers,
      mediaMovel7d: movingAverage(sorted, s.snapshot_date, 7, "followers"),
    }));

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem leituras de seguidores registradas ainda.</p>;
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(value, name) => [Number(value).toLocaleString("pt-BR"), name]} />
          <Line type="monotone" dataKey="seguidores" stroke="var(--color-tone-info-fg)" strokeWidth={2} dot={false} name="Seguidores" />
          <Line
            type="monotone"
            dataKey="mediaMovel7d"
            stroke="var(--color-tone-progress-fg)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            name="Média móvel 7d"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Evolução de alcance e views no tempo — vazio quando não há nenhuma leitura de nenhum dos dois. */
export function ReachViewsTrendChart({ snapshots }: { snapshots: ProfileSnapshot[] }) {
  const sorted = sortSnapshotsByDate(snapshots);
  const data = sorted
    .filter((s) => typeof s.reach === "number" || typeof s.views === "number")
    .map((s) => ({
      date: formatDateLabel(s.snapshot_date),
      alcance: s.reach,
      views: s.views,
    }));

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem leituras de alcance ou views registradas ainda.</p>;
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(value, name) => [Number(value).toLocaleString("pt-BR"), name]} />
          <Line type="monotone" dataKey="alcance" stroke="var(--color-tone-success-fg)" strokeWidth={2} dot={false} name="Alcance" connectNulls />
          <Line type="monotone" dataKey="views" stroke="var(--color-tone-warning-fg)" strokeWidth={2} dot={false} name="Views" connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
