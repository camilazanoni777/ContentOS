import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { ErrorState } from "@/components/feedback/states";
import { createClient } from "@/lib/supabase/server";
import type { DbClient } from "@/lib/data/types";
import { getProfile } from "@/lib/data/profiles";
import { getAppSettings } from "@/lib/data/app-settings";
import { listInstagramAccounts, pickActiveAccount } from "@/lib/data/instagram-accounts";
import { getHojeSummary, type HojeSummary } from "@/lib/data/hoje";
import { getDailyCheckin } from "@/lib/data/daily-checkins";
import { listDailyActions } from "@/lib/data/daily-actions";
import { getContentItemById } from "@/lib/data/content-items";
import { getGoalsByIds } from "@/lib/data/goals";
import { todayISODate } from "@/lib/dates";
import { parseCheckinPriorities } from "@/lib/checkin";
import { getGreeting } from "@/features/hoje/greeting";
import { FocusCard } from "@/features/hoje/focus-card";
import { PrioritiesCard } from "@/features/hoje/priorities-card";
import { PlannedTodayCard } from "@/features/hoje/planned-today-card";
import { ActionableCard } from "@/features/hoje/actionable-card";
import { CheckinCtaCard } from "@/features/hoje/checkin-cta-card";
import { WelcomeGuide } from "@/features/hoje/welcome-guide";
import { DataAccessError } from "@/lib/data/errors";
import type { CheckinPriority, ContentItem, DailyAction, DailyCheckin, Goal } from "@/types/domain";

export const metadata: Metadata = { title: "Hoje — Cami Content OS" };

interface HojePageData {
  greeting: string;
  formattedDate: string;
  summary: HojeSummary;
  todayCheckin: DailyCheckin | null;
  todayActions: DailyAction[];
  hasAccount: boolean;
  priorities: CheckinPriority[];
  contentById: Map<string, ContentItem>;
  goalById: Map<string, Goal>;
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

  const [summary, todayCheckin, todayActions] = await Promise.all([
    getHojeSummary(supabase, {
      userId,
      today,
      accountFilter,
      weeklyTarget: appSettings?.weekly_publish_target ?? null,
    }),
    activeAccount ? getDailyCheckin(supabase, activeAccount.id, today) : Promise.resolve(null),
    listDailyActions(supabase, today),
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

  return {
    greeting: `${getGreeting()}, ${profile?.display_name?.trim() || "bem-vinda de volta"}`,
    formattedDate: formattedDateRaw.charAt(0).toUpperCase() + formattedDateRaw.slice(1),
    summary,
    todayCheckin,
    todayActions,
    hasAccount: Boolean(activeAccount),
    priorities,
    contentById,
    goalById,
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
      <PageHeader title={data.greeting} description={data.formattedDate} />

      {isZeroData ? (
        <WelcomeGuide
          hasCheckinToday={Boolean(data.todayCheckin)}
          hasIdeas={data.summary.actionableItems.length > 0}
          hasPlanned={data.summary.plannedTodayCount > 0}
        />
      ) : null}

      <FocusCard todayObjective={data.todayCheckin?.objective_main ?? null} monthlyGoal={data.summary.monthlyGoal} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Planejados hoje" value={data.summary.plannedTodayCount} />
        <StatCard label="Publicados hoje" value={data.summary.publishedTodayCount} />
        <StatCard label="Atrasados" value={data.summary.overdueCount} />
        <StatCard label="Métricas pendentes" value={data.summary.metricsPendingCount} />
        <StatCard label="Publicados na semana" value={data.summary.publishedThisWeekCount} />
        <StatCard
          label="Meta semanal"
          value={data.summary.weeklyTarget !== null ? `${data.summary.publishedThisWeekCount}/${data.summary.weeklyTarget}` : null}
          helpText={data.summary.weeklyPercent !== null ? `${data.summary.weeklyPercent}% executado` : "Defina em Configurações"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PrioritiesCard priorities={data.priorities} contentById={data.contentById} goalById={data.goalById} />
        <CheckinCtaCard hasAccount={data.hasAccount} checkin={data.todayCheckin} actions={data.todayActions} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PlannedTodayCard items={data.summary.plannedToday} />
        <ActionableCard items={data.summary.actionableItems} />
      </div>
    </div>
  );
}
