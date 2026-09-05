import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { WeeklyPlanWorkspace } from "@/features/planejamento/weekly-plan-workspace";
import { listCampaigns } from "@/lib/data/campaigns";
import { listContentItems } from "@/lib/data/content-items";
import { getWeeklyReview } from "@/lib/data/weekly-reviews";
import { getWeeklyPlanStats } from "@/lib/data/weekly-plan";
import { DataAccessError } from "@/lib/data/errors";
import { getWeekRange, todayISODate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Semana — Planejar — Cami Content OS" };

export default async function PlanejamentoSemanaPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return <ErrorState title="Supabase não configurado" description="Defina as variáveis públicas do Supabase no .env.local." />;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?proximo=/planejamento/semana");

  const { start: weekStart, end: weekEnd } = getWeekRange(week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : todayISODate());

  let data: {
    review: Awaited<ReturnType<typeof getWeeklyReview>>;
    stats: Awaited<ReturnType<typeof getWeeklyPlanStats>>;
    candidateContentItems: Awaited<ReturnType<typeof listContentItems>>;
    campaigns: Awaited<ReturnType<typeof listCampaigns>>;
  } | null = null;
  let loadError: string | null = null;
  try {
    const [review, stats, candidateContentItems, campaigns] = await Promise.all([
      getWeeklyReview(supabase, weekStart),
      getWeeklyPlanStats(supabase, { weekStart, weekEnd, accountFilter: null }),
      listContentItems(supabase, {
        status: ["idea", "researching", "scripting", "ready_to_record", "recorded", "editing", "awaiting_approval", "scheduled"],
      }),
      listCampaigns(supabase),
    ]);
    data = { review, stats, candidateContentItems, campaigns };
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar o Planejamento Semanal.";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Semana"
        description="Foco da semana, experimento em andamento e o conteúdo prioritário para os próximos dias."
        breadcrumbs={[{ label: "Planejar" }, { label: "Semana" }]}
      />
      {data ? (
        <WeeklyPlanWorkspace
          weekStart={weekStart}
          weekEnd={weekEnd}
          review={data.review}
          stats={data.stats}
          candidateContentItems={data.candidateContentItems}
          campaigns={data.campaigns}
        />
      ) : (
        <ErrorState title="Não foi possível carregar o Planejamento Semanal" description={loadError ?? undefined} />
      )}
    </div>
  );
}
