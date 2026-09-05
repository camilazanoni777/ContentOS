import { AlertTriangle, CheckCircle2, Clock, Gauge, TrendingUp, Trophy, type LucideIcon } from "lucide-react";

import type { StatusTone } from "@/lib/content-status-meta";
import type { GoalStatus } from "@/lib/metas";

interface GoalStatusMeta {
  icon: LucideIcon;
  tone: StatusTone;
}

/** Ícone + tom de cor de cada status de meta — status é sempre identificável por texto + cor + ícone, nunca cor sozinha (mesma regra de StatusBadge). */
export const GOAL_STATUS_META: Record<GoalStatus, GoalStatusMeta> = {
  not_started: { icon: Clock, tone: "neutral" },
  in_progress: { icon: TrendingUp, tone: "info" },
  on_pace: { icon: Gauge, tone: "progress" },
  at_risk: { icon: AlertTriangle, tone: "warning" },
  achieved: { icon: CheckCircle2, tone: "success" },
  exceeded: { icon: Trophy, tone: "success" },
};
