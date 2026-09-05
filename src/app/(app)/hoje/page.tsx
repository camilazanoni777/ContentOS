import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { StatCard } from "@/components/layout/stat-card";
import { ErrorState } from "@/components/feedback/states";
import { createClient } from "@/lib/supabase/server";
import type { DbClient } from "@/lib/data/types";
import { getProfile } from "@/lib/data/profiles";
import { getAppSettings } from "@/lib/data/app-settings";
import { listInstagramAccounts, pickActiveAccount } from "@/lib/data/instagram-accounts";
import { getHojeSummary, type HojeSummary } from "@/lib/data/hoje";
import { getDailyCheckin, listDailyCheckins } from "@/lib/data/daily-checkins";
import { listDailyActions } from "@/lib/data/daily-actions";
import { getContentItemById } from "@/lib/data/content-items";
import { getGoalsByIds } from "@/lib/data/goals";
import { addDaysISO, getWeekRange, todayISODate } from "@/lib/dates";
import { parseCheckinPriorities } from "@/lib/checkin";
import { getGreeting } from "@/features/hoje/greeting";
import { TodayHeader } from "@/features/hoje/today-header";
import { DailyFocus } from "@/features/hoje/daily-focus";
import { TodayContentList } from "@/features/hoje/today-content-list";
import { AttentionQueue } from "@/features/hoje/attention-queue";
import { WeeklyRhythm, type WeeklyRhythmDay } from "@/features/hoje/weekly-rhythm";
import { WelcomeGuide } from "@/features/hoje/welcome-guide";
import { DataAccessError } from "@/lib/data/errors";
import type { CheckinPriority, ContentItem, DailyAction, DailyCheckin, Goal, InstagramAccount } from "@/types/domain";

export const metadata: Metadata = { title: "Hoje — Cami Content OS" };

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

interface HojePageData {
  greeting: string;
  formattedDate: string;
  activeAccount: InstagramAccount | null;
  summary: HojeSummary;
  todayCheckin: DailyCheckin | null;
  todayActions: DailyAction[];
  hasAccount: boolean;
  priorities: CheckinPriority[];
  contentById: Map<string, ContentItem>;
  goalById: Map<string, Goal>;
  weeklyRhythmDays: WeeklyRhythmDay[];
}

/**
 * Toda a busca de dados (que pode lançar DataAccessError) fica isolada
 * aqui, fora de qualquer JSX — renderizar componentes dentro de um
 * try/catch não captura erros de render (só de código síncrono), então o
 * try/catch do componente da página envolve só esta chamada, nunca o JSX.
 */
async function loadHojeData(supabase: DbClient, userId: string, today: string): Promise<HojePageData> {
  const [profile, appSettings, accounts] = await Promise.all([
    getProfile(supabase, userId),
    getAppSettings(supabase, userId),
    listInstagramAccounts(supabase),
  ]);

  const activeAccount = pickActiveAccount(accounts);
  const accountFilter = accounts.length > 1 ? (activeAccount?.id ?? null) : null;
  const weekRange = getWeekRange(today);

  const [summary, todayCheckin, todayActions, weeklyCheckins] = await Promise.all([
    getHojeSummary(supabase, {
      userId,
      today,
      accountFilter,
      weeklyTarget: appSettings?.weekly_publish_target ?? null,
    }),
    activeAccount ? getDailyCheckin(supabase, activeAccount.id, today) : Promise.resolve(null),
    listDailyActions(supabase, today),
    activeAccount ? listDailyCheckins(supabase, activeAccount.id, { from: weekRange.start, to: weekRange.end }) : Promise.resolve([]),
  ]);

  const priorities = parseCheckinPriorities(todayCheckin?.priorities);

  const [contentEntries, goalEntries] = await Promise.all([
    Promise.all(
      priorities
        .filter((p) => p.contentItemId)
        .map(async (p) => [p.contentItemId as string, await getContentItemById(supabase, p.contentItemId as string)] as const),
    ),
    getGoalsByIds(
      supabase,
      priorities.map((p) => p.goalId).filter((id): id is string => Boolean(id)),
    ),
  ]);

  const contentById = new Map<string, ContentItem>(
    contentEntries.filter((entry): entry is [string, ContentItem] => entry[1] !== null),
  );
  const goalById = new Map<string, Goal>(goalEntries.map((g) => [g.id, g]));

  const formattedDateRaw = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  const weeklyRhythmDays: WeeklyRhythmDay[] = Array.from({ length: 7 }, (_, i) => {
    const dateStr = addDaysISO(weekRange.start, i);
    const checkinForDay = weeklyCheckins.find((c) => c.checkin_date === dateStr);
    const isToday = dateStr === today;
    return {
      date: dateStr,
      dayLabel: DAY_LABELS[i],
      dayNumber: dateStr.split("-")[2],
      isToday,
      hasCheckin: Boolean(checkinForDay),
      nightClosed: Boolean(checkinForDay?.night_closed_at),
      publishedCount: isToday ? summary.publishedTodayCount : 0,
    };
  });

  return {
    greeting: `${getGreeting()}, ${profile?.display_name?.trim() || "Camila"}`,
    formattedDate: formattedDateRaw.charAt(0).toUpperCase() + formattedDateRaw.slice(1),
    activeAccount,
    summary,
    todayCheckin,
    todayActions,
    hasAccount: Boolean(activeAccount),
    priorities,
    contentById,
    goalById,
    weeklyRhythmDays,
  };
}

export default async function HojePage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return (
      <ErrorState
        title="Supabase não configurado"
        description="Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no seu .env.local."
      />
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?proximo=/hoje");
  }

  let data: HojePageData | null = null;
  let loadError: string | null = null;
  try {
    data = await loadHojeData(supabase, user.id, todayISODate());
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar sua página Hoje.";
  }

  if (!data) {
    return <ErrorState title="Algo deu errado ao carregar Hoje" description={loadError ?? undefined} />;
  }

  const isZeroData =
    !data.todayCheckin &&
    data.summary.plannedTodayCount === 0 &&
    data.summary.publishedTodayCount === 0 &&
    data.summary.actionableItems.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header do Dia */}
      <TodayHeader
        greeting={data.greeting}
        formattedDate={data.formattedDate}
        activeAccount={data.activeAccount}
      />

      {/* Guia inicial quando não há dados cadastrados */}
      {isZeroData ? (
        <WelcomeGuide
          hasCheckinToday={Boolean(data.todayCheckin)}
          hasIdeas={data.summary.actionableItems.length > 0}
          hasPlanned={data.summary.plannedTodayCount > 0}
        />
      ) : null}

      {/* 2. Bloco Executivo: Foco e Prioridades do Dia */}
      <DailyFocus
        todayObjective={data.todayCheckin?.objective_main ?? null}
        priorities={data.priorities}
        contentById={data.contentById}
        goalById={data.goalById}
        monthlyGoal={data.summary.monthlyGoal}
        actions={data.todayActions}
        hasCheckin={Boolean(data.todayCheckin)}
        nightClosed={Boolean(data.todayCheckin?.night_closed_at)}
        nightClosedAt={data.todayCheckin?.night_closed_at ?? null}
      />

      {/* 3. Indicadores de Decisão (StatCards em grade responsiva) */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Planejados hoje" value={data.summary.plannedTodayCount} />
        <StatCard label="Publicados hoje" value={data.summary.publishedTodayCount} />
        <StatCard label="Atrasados" value={data.summary.overdueCount} />
        <StatCard label="Métricas pendentes" value={data.summary.metricsPendingCount} />
        <StatCard label="Publicados na semana" value={data.summary.publishedThisWeekCount} />
        <StatCard
          label="Meta semanal"
          value={data.summary.weeklyTarget !== null ? `${data.summary.publishedThisWeekCount}/${data.summary.weeklyTarget}` : null}
          helpText={data.summary.weeklyPercent !== null ? `${data.summary.weeklyPercent}% executado` : "Defina em Metas"}
        />
      </div>

      {/* 4. Ritmo Semanal */}
      <WeeklyRhythm
        days={data.weeklyRhythmDays}
        publishedThisWeek={data.summary.publishedThisWeekCount}
        weeklyTarget={data.summary.weeklyTarget}
        weeklyPercent={data.summary.weeklyPercent}
      />

      {/* 5. Hoje na Pauta & Fila de Atenção */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TodayContentList items={data.summary.plannedToday} />
        <AttentionQueue items={data.summary.actionableItems} />
      </div>
    </div>
  );
}
