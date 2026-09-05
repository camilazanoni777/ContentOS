import { TodayHeader } from "@/features/hoje/today-header";
import { DailyFocus } from "@/features/hoje/daily-focus";
import { TodayContentList } from "@/features/hoje/today-content-list";
import { AttentionQueue } from "@/features/hoje/attention-queue";
import { WeeklyRhythm, type WeeklyRhythmDay } from "@/features/hoje/weekly-rhythm";
import { WelcomeGuide } from "@/features/hoje/welcome-guide";
import { StatCard } from "@/components/layout/stat-card";
import type { CheckinPriority, ContentItem, DailyAction, Goal, InstagramAccount } from "@/types/domain";
import type { HojeActionableItem } from "@/lib/data/hoje";

const mockAccount: InstagramAccount = {
  id: "acc-1",
  user_id: "user-1",
  handle: "camilazanoni",
  display_name: "Camila Zanoni",
  is_primary: true,
  connected_at: null,
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
};

const mockGoal: Goal = {
  id: "g-1",
  user_id: "user-1",
  period_type: "monthly",
  period_start: "2026-09-01",
  period_end: "2026-09-30",
  metric: "10k seguidores qualificados",
  target_value: 10000,
  initial_value: 7800,
  achieved_value: 8400,
  notes: null,
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
};

const mockContentItems: ContentItem[] = [
  {
    id: "c-1",
    user_id: "user-1",
    account_id: "acc-1",
    campaign_id: null,
    format: "reels",
    pillar: "Autoridade",
    title: "Como estruturar um funil de conteúdo que vende sem parecer vendedor",
    hook: "Se você posta todo dia e não vê vendas no direct...",
    cta: "Comente ESTRATEGIA",
    notes: null,
    status: "ready_to_record",
    planned_at: "2026-09-05T10:00:00Z",
    recorded_at: null,
    published_at: null,
    published_url: null,
    archived_at: null,
    created_at: "2026-09-04T00:00:00Z",
    updated_at: "2026-09-05T00:00:00Z",
  } as unknown as ContentItem,
  {
    id: "c-2",
    user_id: "user-1",
    account_id: "acc-1",
    campaign_id: null,
    format: "carousel",
    pillar: "Educação",
    title: "3 erros fatais que destroem a retenção dos seus Reels",
    hook: "O erro número 1 é demorar 4 segundos para entrar no tema.",
    cta: "Salve para consultar depois",
    notes: null,
    status: "scripting",
    planned_at: "2026-09-05T16:00:00Z",
    recorded_at: null,
    published_at: null,
    published_url: null,
    archived_at: null,
    created_at: "2026-09-04T00:00:00Z",
    updated_at: "2026-09-05T00:00:00Z",
  } as unknown as ContentItem,
  {
    id: "c-3",
    user_id: "user-1",
    account_id: "acc-1",
    campaign_id: null,
    format: "reels",
    pillar: "Growth",
    title: "Rotina real de criação: 1 roteiro em 15 minutos com IA",
    hook: "Bastidores do meu processo sem filtro.",
    cta: "Link na bio",
    notes: null,
    status: "published",
    planned_at: "2026-09-05T09:00:00Z",
    recorded_at: "2026-09-05T08:00:00Z",
    published_at: "2026-09-05T09:15:00Z",
    published_url: "https://instagram.com/p/mock",
    archived_at: null,
    created_at: "2026-09-04T00:00:00Z",
    updated_at: "2026-09-05T09:15:00Z",
  } as unknown as ContentItem,
];

const mockPriorities: CheckinPriority[] = [
  { label: "Gravar o Reel de autoridade no estúdio", contentItemId: "c-1" },
  { label: "Revisar roteiro do carrossel com hook forte", contentItemId: "c-2" },
  { label: "Responder DMs qualificadas e fechar 1 vaga de mentoria", goalId: "g-1" },
];

const mockActions: DailyAction[] = [
  {
    id: "act-1",
    user_id: "user-1",
    checkin_id: "chk-1",
    checklist_item_id: null,
    action_date: "2026-09-05",
    title: "Publicar stories de abertura de dia com enquete",
    is_done: true,
    is_active: true,
    sort_order: 1,
    completed_at: "2026-09-05T09:00:00Z",
    created_at: "2026-09-05T08:00:00Z",
    updated_at: "2026-09-05T09:00:00Z",
  },
  {
    id: "act-2",
    user_id: "user-1",
    checkin_id: "chk-1",
    checklist_item_id: null,
    action_date: "2026-09-05",
    title: "Gravar Reel de autoridade com teleprompter",
    is_done: true,
    is_active: true,
    sort_order: 2,
    completed_at: "2026-09-05T11:00:00Z",
    created_at: "2026-09-05T08:00:00Z",
    updated_at: "2026-09-05T11:00:00Z",
  },
  {
    id: "act-3",
    user_id: "user-1",
    checkin_id: "chk-1",
    checklist_item_id: null,
    action_date: "2026-09-05",
    title: "Enviar arquivo bruto para edição no corte final",
    is_done: false,
    is_active: true,
    sort_order: 3,
    completed_at: null,
    created_at: "2026-09-05T08:00:00Z",
    updated_at: "2026-09-05T08:00:00Z",
  },
  {
    id: "act-4",
    user_id: "user-1",
    checkin_id: "chk-1",
    checklist_item_id: null,
    action_date: "2026-09-05",
    title: "Interagir 15 minutos com criadoras do mesmo nicho",
    is_done: false,
    is_active: true,
    sort_order: 4,
    completed_at: null,
    created_at: "2026-09-05T08:00:00Z",
    updated_at: "2026-09-05T08:00:00Z",
  },
];

const mockWeeklyDays: WeeklyRhythmDay[] = [
  { date: "2026-09-01", dayLabel: "Seg", dayNumber: "01", isToday: false, hasCheckin: true, nightClosed: true, publishedCount: 1 },
  { date: "2026-09-02", dayLabel: "Ter", dayNumber: "02", isToday: false, hasCheckin: true, nightClosed: true, publishedCount: 1 },
  { date: "2026-09-03", dayLabel: "Qua", dayNumber: "03", isToday: false, hasCheckin: true, nightClosed: true, publishedCount: 0 },
  { date: "2026-09-04", dayLabel: "Qui", dayNumber: "04", isToday: false, hasCheckin: true, nightClosed: true, publishedCount: 1 },
  { date: "2026-09-05", dayLabel: "Sex", dayNumber: "05", isToday: true, hasCheckin: true, nightClosed: false, publishedCount: 1 },
  { date: "2026-09-06", dayLabel: "Sáb", dayNumber: "06", isToday: false, hasCheckin: false, nightClosed: false, publishedCount: 0 },
  { date: "2026-09-07", dayLabel: "Dom", dayNumber: "07", isToday: false, hasCheckin: false, nightClosed: false, publishedCount: 0 },
];

const mockActionableItems: HojeActionableItem[] = [
  { id: "act-item-1", title: "Carrossel de tendências com entrega atrasada para aprovação", type: "atrasado", status: "awaiting_approval" },
  { id: "act-item-2", title: "Reel sobre 3 ferramentas de IA publicado há 48h sem métricas registradas", type: "metrica_pendente", status: null },
];

export default async function PreviewHojePage({
  searchParams,
}: {
  searchParams: Promise<{ zero?: string }>;
}) {
  const { zero } = await searchParams;
  const isZero = zero === "1";

  const contentById = new Map<string, ContentItem>(mockContentItems.map((c) => [c.id, c]));
  const goalById = new Map<string, Goal>([[mockGoal.id, mockGoal]]);

  return (
    <div className="min-h-svh bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl flex flex-col gap-6">
        {/* Header da Central do Dia */}
        <TodayHeader
          greeting="Bom dia, Camila"
          formattedDate="Sexta-feira, 5 de setembro"
          activeAccount={isZero ? null : mockAccount}
        />

        {/* Guia inicial no caso de zero data */}
        {isZero ? (
          <WelcomeGuide
            hasCheckinToday={false}
            hasIdeas={false}
            hasPlanned={false}
          />
        ) : null}

        {/* Foco e Prioridades do Dia */}
        <DailyFocus
          todayObjective={isZero ? null : "Gravar e agendar o Reel principal sobre funil editorial"}
          priorities={isZero ? [] : mockPriorities}
          contentById={contentById}
          goalById={goalById}
          monthlyGoal={isZero ? null : mockGoal}
          actions={isZero ? [] : mockActions}
          hasCheckin={!isZero}
          nightClosed={false}
          nightClosedAt={null}
        />

        {/* Indicadores de Decisão (StatCards) */}
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Planejados hoje" value={isZero ? 0 : 2} />
          <StatCard label="Publicados hoje" value={isZero ? 0 : 1} />
          <StatCard label="Atrasados" value={isZero ? 0 : 1} />
          <StatCard label="Métricas pendentes" value={isZero ? 0 : 1} />
          <StatCard label="Publicados na semana" value={isZero ? 0 : 4} />
          <StatCard
            label="Meta semanal"
            value={isZero ? null : "4/5"}
            helpText={isZero ? "Defina em Metas" : "80% executado"}
          />
        </div>

        {/* Ritmo Semanal */}
        {!isZero ? (
          <WeeklyRhythm
            days={mockWeeklyDays}
            publishedThisWeek={4}
            weeklyTarget={5}
            weeklyPercent={80}
          />
        ) : null}

        {/* Hoje na Pauta & Fila de Atenção */}
        <div className="grid gap-6 lg:grid-cols-2">
          <TodayContentList items={isZero ? [] : mockContentItems} />
          <AttentionQueue items={isZero ? [] : mockActionableItems} />
        </div>
      </div>
    </div>
  );
}
