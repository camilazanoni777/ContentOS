"use client";

import * as React from "react";
import { Plus, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/states";
import { ProfileSnapshotDrawer } from "./profile-snapshot-drawer";
import { FollowersTrendChart, ReachViewsTrendChart } from "./perfil-charts";
import { computeProfileSnapshotDerived, sortSnapshotsByDate } from "@/lib/perfil";
import { todayISODate } from "@/lib/dates";
import type { ContentItem, InstagramAccount, ProfileSnapshot } from "@/types/domain";

function formatNumber(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("pt-BR");
}

function formatSigned(value: number | null): string {
  if (value === null) return "—";
  const formatted = Math.abs(value).toLocaleString("pt-BR");
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return "0";
}

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface PerfilWorkspaceProps {
  initialSnapshots: ProfileSnapshot[];
  accounts: InstagramAccount[];
  contentItems: ContentItem[];
}

export function PerfilWorkspace({ initialSnapshots, accounts, contentItems }: PerfilWorkspaceProps) {
  const [snapshots, setSnapshots] = React.useState(initialSnapshots);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ProfileSnapshot | null>(null);

  const defaultAccountId = accounts[0]?.id ?? "";
  const sorted = React.useMemo(() => sortSnapshotsByDate(snapshots), [snapshots]);
  const reversed = React.useMemo(() => [...sorted].reverse(), [sorted]);

  function handleSaved(snapshot: ProfileSnapshot) {
    setSnapshots((prev) => {
      const next = prev.filter((s) => s.id !== snapshot.id);
      next.push(snapshot);
      return next;
    });
  }

  function handleDeleted(id: string) {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  }

  function openNew() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(snapshot: ProfileSnapshot) {
    setEditing(snapshot);
    setDrawerOpen(true);
  }

  if (accounts.length === 0) {
    return (
      <EmptyState
        title="Nenhuma conta do Instagram cadastrada"
        description="Cadastre uma conta em Configurações antes de registrar leituras de perfil."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Registrar perfil do dia
        </Button>
      </div>

      {snapshots.length === 0 ? (
        <EmptyState
          title="Nenhuma leitura de perfil registrada"
          description="Registre uma leitura periódica do seu perfil para começar a ver a evolução aqui."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Seguidores</CardTitle>
              </CardHeader>
              <CardContent>
                <FollowersTrendChart snapshots={sorted} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alcance e views</CardTitle>
              </CardHeader>
              <CardContent>
                <ReachViewsTrendChart snapshots={sorted} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registros</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3">Data</th>
                    <th className="py-2 pr-3">Seguidores</th>
                    <th className="py-2 pr-3">Ganhos</th>
                    <th className="py-2 pr-3">Cresc. %</th>
                    <th className="py-2 pr-3">Alcance (var.)</th>
                    <th className="py-2 pr-3">Views (var.)</th>
                    <th className="py-2 pr-3">Conteúdos (cruzado)</th>
                    <th className="py-2 pr-3">Receita acum. mês</th>
                    <th className="py-2 pr-3">Resultado/h</th>
                    <th className="py-2 pr-1" />
                  </tr>
                </thead>
                <tbody>
                  {reversed.map((snapshot) => {
                    const derived = computeProfileSnapshotDerived(sorted, snapshot.id, contentItems);
                    return (
                      <tr key={snapshot.id} className="border-b border-border/60 last:border-0">
                        <td className="py-2 pr-3 font-medium">{snapshot.snapshot_date}</td>
                        <td className="py-2 pr-3">{formatNumber(snapshot.followers)}</td>
                        <td className="py-2 pr-3">{formatSigned(derived.followersGained)}</td>
                        <td className="py-2 pr-3">{formatPercent(derived.followersGrowthPercent)}</td>
                        <td className="py-2 pr-3">{formatSigned(derived.reachVariation)}</td>
                        <td className="py-2 pr-3">{formatSigned(derived.viewsVariation)}</td>
                        <td className="py-2 pr-3">
                          {derived.contentPublishedOnDate}
                          {snapshot.posts_count !== null ? (
                            <span className="text-xs text-muted-foreground"> (autodeclarado: {snapshot.posts_count})</span>
                          ) : null}
                        </td>
                        <td className="py-2 pr-3">{formatCurrency(derived.cumulativeRevenueMonth)}</td>
                        <td className="py-2 pr-3">{formatCurrency(derived.resultPerHour)}</td>
                        <td className="py-2 pr-1 text-right">
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => openEdit(snapshot)}>
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            Editar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      <ProfileSnapshotDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        accounts={accounts}
        defaultAccountId={defaultAccountId}
        defaultDate={todayISODate()}
        editSnapshot={editing}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
