"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Clock, ExternalLink, X } from "lucide-react";

import { EmptyState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { dismissAlertAction, deferAlertAction } from "@/lib/actions/alerts";
import {
  ALERT_TYPE_LABELS,
  computeAlerts,
  filterActiveAlerts,
  type AlertDismissalState,
  type AlertItem,
} from "@/lib/alerts";
import type { GoalComputed } from "@/lib/metas";
import type { AlertDismissal, Campaign, CampaignPayment, ContentItem, ContentStatusHistory, MetricSnapshot } from "@/types/domain";

interface AlertsWorkspaceProps {
  activeItems: ContentItem[];
  statusHistory: ContentStatusHistory[];
  publishedItems: ContentItem[];
  metricSnapshots: MetricSnapshot[];
  knownPillars: string[];
  computedGoals: GoalComputed[];
  campaigns: Campaign[];
  campaignPayments: CampaignPayment[];
  initialDismissals: AlertDismissal[];
}

function snoozedUntilIso(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

const ALERT_TYPE_TONE: Record<AlertItem["type"], string> = {
  overdue: "border-l-tone-danger-fg",
  missing_url: "border-l-tone-warning-fg",
  metrics_pending: "border-l-tone-warning-fg",
  stalled_idea: "border-l-tone-neutral-fg",
  pillar_understocked: "border-l-tone-neutral-fg",
  goal_at_risk: "border-l-tone-danger-fg",
  deadline_approaching: "border-l-tone-warning-fg",
  campaign_delivery_overdue: "border-l-tone-danger-fg",
  campaign_payment_overdue: "border-l-tone-danger-fg",
  campaign_missing_content: "border-l-tone-warning-fg",
};

export function AlertsWorkspace({
  activeItems,
  statusHistory,
  publishedItems,
  metricSnapshots,
  knownPillars,
  computedGoals,
  campaigns,
  campaignPayments,
  initialDismissals,
}: AlertsWorkspaceProps) {
  const [dismissals, setDismissals] = React.useState<AlertDismissalState[]>(
    initialDismissals.map((d) => ({ alert_key: d.alert_key, dismissed: d.dismissed, snoozed_until: d.snoozed_until })),
  );
  const [pendingKey, setPendingKey] = React.useState<string | null>(null);

  const metricSnapshotsByItemId = React.useMemo(() => {
    const map = new Map<string, MetricSnapshot[]>();
    for (const snapshot of metricSnapshots) {
      const list = map.get(snapshot.content_item_id) ?? [];
      list.push(snapshot);
      map.set(snapshot.content_item_id, list);
    }
    return map;
  }, [metricSnapshots]);

  const allAlerts = React.useMemo(
    () =>
      computeAlerts({
        activeItems,
        statusHistory,
        publishedItems,
        metricSnapshotsByItemId,
        knownPillars,
        computedGoals,
        campaigns,
        campaignPayments,
        now: new Date(),
      }),
    [activeItems, statusHistory, publishedItems, metricSnapshotsByItemId, knownPillars, computedGoals, campaigns, campaignPayments],
  );

  const activeAlerts = React.useMemo(() => filterActiveAlerts(allAlerts, dismissals, new Date()), [allAlerts, dismissals]);

  async function handleDismiss(key: string) {
    setPendingKey(key);
    setDismissals((current) => [...current.filter((d) => d.alert_key !== key), { alert_key: key, dismissed: true, snoozed_until: null }]);
    await dismissAlertAction(key);
    setPendingKey(null);
  }

  async function handleDefer(key: string, days: number) {
    setPendingKey(key);
    const snoozedUntil = snoozedUntilIso(days);
    setDismissals((current) => [...current.filter((d) => d.alert_key !== key), { alert_key: key, dismissed: false, snoozed_until: snoozedUntil }]);
    await deferAlertAction(key, days);
    setPendingKey(null);
  }

  if (activeAlerts.length === 0) {
    return <EmptyState title="Tudo em dia" description="Nenhum alerta pendente agora — nada atrasado, nenhuma métrica faltando, nenhuma ideia parada." />;
  }

  const grouped = new Map<AlertItem["type"], AlertItem[]>();
  for (const alert of activeAlerts) {
    const list = grouped.get(alert.type) ?? [];
    list.push(alert);
    grouped.set(alert.type, list);
  }

  return (
    <div className="flex flex-col gap-4">
      {[...grouped.entries()].map(([type, alerts]) => (
        <div key={type} className="flex flex-col gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            {ALERT_TYPE_LABELS[type]} ({alerts.length})
          </h2>
          {alerts.map((alert) => (
            <Card key={alert.key} className={`border-l-4 ${ALERT_TYPE_TONE[alert.type]}`}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{alert.title}</span>
                  <span className="text-xs text-muted-foreground">{alert.description}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {alert.href ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={alert.href}>
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        {alert.actionLabel ?? "Ver"}
                      </Link>
                    </Button>
                  ) : null}
                  {alert.canDefer ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pendingKey === alert.key}
                      onClick={() => handleDefer(alert.key, 3)}
                      aria-label="Adiar por 3 dias"
                    >
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      Adiar
                    </Button>
                  ) : null}
                  {alert.canDismiss ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pendingKey === alert.key}
                      onClick={() => handleDismiss(alert.key)}
                      aria-label="Dispensar alerta"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      Dispensar
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
