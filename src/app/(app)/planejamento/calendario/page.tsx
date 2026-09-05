import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { CalendarMonthView } from "@/features/planejamento/calendar-month-view";
import { listCampaigns } from "@/lib/data/campaigns";
import { listContentItems } from "@/lib/data/content-items";
import { listCalendarImportantDates } from "@/lib/data/calendar-important-dates";
import { DataAccessError } from "@/lib/data/errors";
import { CALENDAR_VISIBLE_STATUSES, getMonthGridRange } from "@/lib/calendario";
import { rangeInstantBounds, todayISODate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Calendário — Planejar — Cami Content OS" };

export default async function PlanejamentoCalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const today = todayISODate();
  const monthISO = month && /^\d{4}-\d{2}-\d{2}$/.test(month) ? month : `${today.slice(0, 7)}-01`;

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return <ErrorState title="Supabase não configurado" description="Defina as variáveis públicas do Supabase no .env.local." />;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?proximo=/planejamento/calendario");

  const gridRange = getMonthGridRange(monthISO);
  const instantRange = rangeInstantBounds(gridRange.start, gridRange.end);

  let data: {
    items: Awaited<ReturnType<typeof listContentItems>>;
    importantDates: Awaited<ReturnType<typeof listCalendarImportantDates>>;
    campaigns: Awaited<ReturnType<typeof listCampaigns>>;
  } | null = null;
  let loadError: string | null = null;
  try {
    const [allVisibleItems, importantDates, campaigns] = await Promise.all([
      listContentItems(supabase, { status: CALENDAR_VISIBLE_STATUSES }),
      listCalendarImportantDates(supabase, { fromISO: gridRange.start, toISO: gridRange.end }),
      listCampaigns(supabase),
    ]);
    // listContentItems já filtra por status (scheduled/published); aqui restringimos à
    // janela visual da grade do mês (scheduled_at para agendados, published_at para publicados).
    const items = allVisibleItems.filter((item) => {
      const relevant = item.status === "published" ? item.published_at : item.scheduled_at;
      return relevant ? relevant >= instantRange.startInstant && relevant < instantRange.endInstant : false;
    });
    data = { items, importantDates, campaigns };
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar o Calendário.";
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calendário"
        description="Visão mensal do seu editorial — arraste conteúdos entre datas para reorganizar a agenda."
        breadcrumbs={[{ label: "Planejar" }, { label: "Calendário" }]}
      />
      {data ? (
        <CalendarMonthView
          monthISO={monthISO}
          today={today}
          initialItems={data.items}
          initialImportantDates={data.importantDates}
          campaigns={data.campaigns}
        />
      ) : (
        <ErrorState title="Não foi possível carregar o Calendário" description={loadError ?? undefined} />
      )}
    </div>
  );
}
