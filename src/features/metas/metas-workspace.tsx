"use client";

import * as React from "react";
import { Plus, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/states";
import { GoalCard } from "./goal-card";
import { GoalFormDialog } from "./goal-form-dialog";
import { DefaultGoalsDialog } from "./default-goals-dialog";
import {
  computeGoal,
  getDefaultGoalTargets,
  getGoalStatusThresholds,
  GOAL_STATUS_RULE_EXPLANATION,
  type DefaultGoalTargets,
  type GoalMetricSources,
} from "@/lib/metas";
import { todayISODate } from "@/lib/dates";
import type { ContentItem, Goal, MetricSnapshot, ProfileSnapshot } from "@/types/domain";

interface MetasWorkspaceProps {
  initialGoals: Goal[];
  profileSnapshots: ProfileSnapshot[];
  contentItems: ContentItem[];
  metricSnapshots: MetricSnapshot[];
  appSettingsExtra: unknown;
}

export function MetasWorkspace({ initialGoals, profileSnapshots, contentItems, metricSnapshots, appSettingsExtra }: MetasWorkspaceProps) {
  const [goals, setGoals] = React.useState(initialGoals);
  const [extra, setExtra] = React.useState(appSettingsExtra);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [defaultsDialogOpen, setDefaultsDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Goal | null>(null);

  const today = todayISODate();

  const sources: GoalMetricSources = React.useMemo(() => {
    const metricSnapshotsByItemId = new Map<string, MetricSnapshot[]>();
    for (const snapshot of metricSnapshots) {
      const list = metricSnapshotsByItemId.get(snapshot.content_item_id) ?? [];
      list.push(snapshot);
      metricSnapshotsByItemId.set(snapshot.content_item_id, list);
    }
    return { profileSnapshots, contentItems, metricSnapshotsByItemId };
  }, [profileSnapshots, contentItems, metricSnapshots]);

  const thresholds = React.useMemo(() => getGoalStatusThresholds(extra), [extra]);
  const defaultTargets = React.useMemo<Record<"weekly" | "monthly", DefaultGoalTargets>>(
    () => ({ weekly: getDefaultGoalTargets(extra, "weekly"), monthly: getDefaultGoalTargets(extra, "monthly") }),
    [extra],
  );

  const computedGoals = React.useMemo(
    () =>
      goals
        .map((goal) => computeGoal(goal, sources, today, thresholds))
        .sort((a, b) => (a.goal.period_start < b.goal.period_start ? 1 : -1)),
    [goals, sources, today, thresholds],
  );

  const weekly = computedGoals.filter((c) => c.goal.period_type === "weekly");
  const monthly = computedGoals.filter((c) => c.goal.period_type === "monthly");

  function handleSaved(goal: Goal) {
    setGoals((prev) => {
      const next = prev.filter((g) => g.id !== goal.id);
      next.push(goal);
      return next;
    });
  }

  function handleDeleted(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(goal: Goal) {
    setEditing(goal);
    setDialogOpen(true);
  }

  function handleDefaultsSaved(periodType: "weekly" | "monthly", targets: DefaultGoalTargets) {
    setExtra((prev: unknown) => {
      const base = prev && typeof prev === "object" ? { ...(prev as Record<string, unknown>) } : {};
      const existing = base.default_goals && typeof base.default_goals === "object" ? { ...(base.default_goals as Record<string, unknown>) } : {};
      existing[periodType] = targets;
      base.default_goals = existing;
      return base;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Como o status é calculado:</strong> {GOAL_STATUS_RULE_EXPLANATION}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" className="gap-1.5" onClick={() => setDefaultsDialogOpen(true)}>
          <Settings2 className="h-4 w-4" aria-hidden="true" />
          Metas-padrão
        </Button>
        <Button className="gap-1.5" onClick={openNew}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nova meta
        </Button>
      </div>

      {computedGoals.length === 0 ? (
        <EmptyState
          title="Nenhuma meta cadastrada"
          description="Cadastre uma meta semanal ou mensal para acompanhar seu progresso ao longo do tempo."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {weekly.length > 0 ? (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Metas semanais</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {weekly.map((computed) => (
                  <GoalCard key={computed.goal.id} computed={computed} onEdit={() => openEdit(computed.goal)} />
                ))}
              </div>
            </div>
          ) : null}
          {monthly.length > 0 ? (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Metas mensais</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {monthly.map((computed) => (
                  <GoalCard key={computed.goal.id} computed={computed} onEdit={() => openEdit(computed.goal)} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      <GoalFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={editing}
        defaultTargets={defaultTargets}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
      <DefaultGoalsDialog open={defaultsDialogOpen} onOpenChange={setDefaultsDialogOpen} defaultTargets={defaultTargets} onSaved={handleDefaultsSaved} />
    </div>
  );
}
