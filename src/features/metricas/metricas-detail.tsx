"use client";

import * as React from "react";
import { AlertTriangle, PlusCircle, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  DERIVED_METRIC_ROWS,
  RAW_METRIC_FIELDS,
  averageRetention,
  computePerformanceIndexForWindow,
  getCapturePendencies,
  getSnapshotByWindow,
  mostRecentSnapshot,
  viewsGrowth24hTo7d,
  type RawMetricFieldKind,
} from "@/lib/metricas";
import { removeMetricSnapshot } from "@/lib/actions/metricas";
import { METRIC_WINDOW_LABELS, type ContentItem, type MetricSnapshot, type MetricWindow } from "@/types/domain";
import { PerformanceIndexBreakdown } from "./performance-index-breakdown";
import { ViewsComparisonChart } from "./metricas-charts";
import { MetricCaptureDrawer } from "./metric-capture-drawer";
import { formatDateBR, formatDateTimeBR } from "@/lib/dates";

interface MetricasDetailProps {
  item: ContentItem;
  /** Todos os conteúdos publicados comparáveis (para a base histórica do índice) e todas as leituras deles. */
  allItems: ContentItem[];
  allSnapshots: MetricSnapshot[];
}

function formatValue(value: number | null, kind: RawMetricFieldKind): string {
  if (value === null || value === undefined) return "—";
  if (kind === "money") return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (kind === "seconds") return `${value.toLocaleString("pt-BR")}s`;
  if (kind === "percent") return `${value.toLocaleString("pt-BR")}%`;
  return value.toLocaleString("pt-BR");
}

const COMPARISON_WINDOWS: Extract<MetricWindow, "24h" | "7d" | "30d">[] = ["24h", "7d", "30d"];

export function MetricasDetail({ item, allItems, allSnapshots }: MetricasDetailProps) {
  const [snapshots, setSnapshots] = React.useState(() => allSnapshots.filter((s) => s.content_item_id === item.id));
  const [comparisonWindow, setComparisonWindow] = React.useState<(typeof COMPARISON_WINDOWS)[number]>("7d");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editSnapshot, setEditSnapshot] = React.useState<MetricSnapshot | null>(null);

  const snapshotsByItem = React.useMemo(() => {
    const map = new Map<string, MetricSnapshot[]>();
    for (const other of allItems) {
      map.set(
        other.id,
        other.id === item.id ? snapshots : allSnapshots.filter((s) => s.content_item_id === other.id),
      );
    }
    return map;
  }, [allItems, allSnapshots, item.id, snapshots]);

  const indexByItem = React.useMemo(
    () => computePerformanceIndexForWindow(allItems, snapshotsByItem, comparisonWindow),
    [allItems, snapshotsByItem, comparisonWindow],
  );
  const result = indexByItem.get(item.id)!;

  const fixedWindowSnapshots = COMPARISON_WINDOWS.map((window) => ({ window, snapshot: getSnapshotByWindow(snapshots, window) }));
  const customSnapshots = snapshots
    .filter((s) => s.window_type === "custom")
    .sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime());
  const columns = [...fixedWindowSnapshots, ...customSnapshots.map((s) => ({ window: "custom" as const, snapshot: s }))];

  const latest = mostRecentSnapshot(snapshots);
  const pendencies = getCapturePendencies(item, snapshots).filter((p) => p.due);
  const growth = viewsGrowth24hTo7d(getSnapshotByWindow(snapshots, "24h"), getSnapshotByWindow(snapshots, "7d"));
  const avgRetention = averageRetention(snapshots);

  function handleSaved(snapshot: MetricSnapshot) {
    setSnapshots((current) => [...current.filter((s) => s.id !== snapshot.id), snapshot]);
  }

  function handleDeleted(id: string) {
    setSnapshots((current) => current.filter((s) => s.id !== id));
  }

  async function handleQuickDelete(id: string) {
    const confirmed = window.confirm("Excluir esta captura de métricas?");
    if (!confirmed) return;
    const result = await removeMetricSnapshot(item.id, id);
    if (!("error" in result)) handleDeleted(id);
  }

  return (
    <div className="flex flex-col gap-6">
      {pendencies.length > 0 ? (
        <p className="flex items-center gap-1.5 rounded-lg bg-tone-warning-bg px-3 py-2 text-sm font-medium text-tone-warning-fg">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          Captura pendente: {pendencies.map((p) => p.window).join(", ")}.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {latest
            ? `Medição mais recente: ${METRIC_WINDOW_LABELS[latest.window_type]}, capturada em ${formatDateTimeBR(latest.captured_at)}.`
            : "Nenhuma leitura registrada ainda."}
        </p>
        <Button type="button" size="sm" className="gap-1.5" onClick={() => { setEditSnapshot(null); setDrawerOpen(true); }}>
          <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" /> Registrar métricas
        </Button>
      </div>

      {snapshots.length === 0 ? (
        <EmptyState title="Nenhuma métrica registrada ainda" description="Registre a primeira leitura (24h, 7 dias, 30 dias ou personalizada) para começar a acompanhar este conteúdo." />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-title">Comparação entre janelas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <ViewsComparisonChart snapshots={snapshots} />

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="p-2">Campo</th>
                      {columns.map((column, index) => (
                        <th key={index} className="p-2">
                          {column.window === "custom" ? "Personalizada" : METRIC_WINDOW_LABELS[column.window]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {RAW_METRIC_FIELDS.map((field) => (
                      <tr key={field.key}>
                        <td className="p-2 text-muted-foreground">{field.label}</td>
                        {columns.map((column, index) => (
                          <td key={index} className="p-2">
                            {column.snapshot ? formatValue(column.snapshot[field.key], field.kind) : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tbody className="divide-y divide-border border-t-2 border-border">
                    {DERIVED_METRIC_ROWS.map((row) => (
                      <tr key={row.label}>
                        <td className="p-2 font-medium">{row.label}</td>
                        {columns.map((column, index) => {
                          const value = column.snapshot ? row.compute(column.snapshot) : null;
                          return (
                            <td key={index} className="p-2 font-medium">
                              {value === null ? "—" : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}${row.suffix ?? ""}`}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Crescimento de views 24h → 7d</p>
                  <p className="text-lg font-semibold">{growth === null ? "—" : `${growth.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Retenção média (entre leituras informadas)</p>
                  <p className="text-lg font-semibold">{avgRetention === null ? "—" : `${avgRetention.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-serif text-title">Índice de performance</CardTitle>
              <Select
                aria-label="Janela usada no índice"
                value={comparisonWindow}
                onChange={(event) => setComparisonWindow(event.target.value as (typeof COMPARISON_WINDOWS)[number])}
                className="w-40"
              >
                {COMPARISON_WINDOWS.map((window) => (
                  <option key={window} value={window}>
                    {METRIC_WINDOW_LABELS[window]}
                  </option>
                ))}
              </Select>
            </CardHeader>
            <CardContent>
              <PerformanceIndexBreakdown result={result} />
            </CardContent>
          </Card>

          {customSnapshots.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-title">Capturas personalizadas</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {customSnapshots.map((snapshot) => (
                  <div key={snapshot.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-sm">
                    <span>
                      {snapshot.window_start ? formatDateBR(snapshot.window_start) : "?"} até{" "}
                      {snapshot.window_end ? formatDateBR(snapshot.window_end) : "?"} — {snapshot.views ?? "—"} views
                    </span>
                    <div className="flex gap-1">
                      <Button type="button" size="sm" variant="outline" onClick={() => { setEditSnapshot(snapshot); setDrawerOpen(true); }}>
                        Editar
                      </Button>
                      <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleQuickDelete(snapshot.id)}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </>
      )}

      {drawerOpen ? (
        <MetricCaptureDrawer
          open={drawerOpen}
          onOpenChange={(open) => {
            setDrawerOpen(open);
            if (!open) setEditSnapshot(null);
          }}
          contentItemId={item.id}
          snapshots={snapshots}
          editSnapshot={editSnapshot}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      ) : null}
    </div>
  );
}
