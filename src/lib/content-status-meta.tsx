import {
  Archive,
  Calendar,
  CheckCircle2,
  Clapperboard,
  Clock,
  FileEdit,
  Lightbulb,
  Recycle,
  ScrollText,
  Search,
  Send,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import type { ContentStatus } from "@/types/domain";

export type StatusTone = "neutral" | "progress" | "info" | "warning" | "success" | "danger";

interface StatusMeta {
  label: string;
  icon: LucideIcon;
  tone: StatusTone;
}

/**
 * Metadados visuais (ícone + tom de cor) para cada status do pipeline.
 * O rótulo em texto vem de CONTENT_STATUS_LABELS (types/domain.ts) — aqui só
 * associamos ícone e tom, para status ser sempre identificável por
 * texto + cor + ícone (nunca cor sozinha).
 */
export const CONTENT_STATUS_META: Record<ContentStatus, StatusMeta> = {
  idea: { label: "Ideia", icon: Lightbulb, tone: "neutral" },
  researching: { label: "Em pesquisa", icon: Search, tone: "info" },
  scripting: { label: "Roteiro", icon: ScrollText, tone: "progress" },
  ready_to_record: { label: "Pronto para gravar", icon: Clock, tone: "progress" },
  recorded: { label: "Gravado", icon: Clapperboard, tone: "progress" },
  editing: { label: "Em edição", icon: FileEdit, tone: "progress" },
  awaiting_approval: { label: "Aguardando aprovação", icon: Clock, tone: "warning" },
  scheduled: { label: "Agendado", icon: Calendar, tone: "info" },
  published: { label: "Publicado", icon: CheckCircle2, tone: "success" },
  repurpose: { label: "Reaproveitar", icon: Recycle, tone: "warning" },
  archived: { label: "Arquivado", icon: Archive, tone: "neutral" },
  canceled: { label: "Cancelado", icon: XCircle, tone: "danger" },
};

export type PriorityLevel = "alta" | "media" | "baixa";

interface PriorityMeta {
  label: string;
  icon: LucideIcon;
  tone: StatusTone;
}

/**
 * Convenção de UI para o campo livre `priority` de content_items. O banco
 * aceita qualquer texto (fica configurável no futuro, em Configurações);
 * estes três valores são o padrão sugerido pelo produto. Um valor fora
 * dessa lista ainda é exibido (texto cru, tom neutro) em vez de quebrar.
 */
export const PRIORITY_META: Record<PriorityLevel, PriorityMeta> = {
  alta: { label: "Alta prioridade", icon: Send, tone: "danger" },
  media: { label: "Prioridade média", icon: Clock, tone: "warning" },
  baixa: { label: "Prioridade baixa", icon: Clock, tone: "neutral" },
};

export function getPriorityMeta(priority: string | null): PriorityMeta | null {
  if (!priority) return null;
  const key = priority.trim().toLowerCase() as PriorityLevel;
  return PRIORITY_META[key] ?? { label: priority, icon: Clock, tone: "neutral" };
}
