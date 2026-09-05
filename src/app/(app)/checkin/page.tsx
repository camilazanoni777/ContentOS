import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { DbClient } from "@/lib/data/types";
import { getActiveAccount } from "@/lib/data/instagram-accounts";
import { getDailyCheckin } from "@/lib/data/daily-checkins";
import { ensureDailyActionsForDate } from "@/lib/data/daily-actions";
import { listContentItems } from "@/lib/data/content-items";
import { listProducts } from "@/lib/data/products";
import { listCampaigns } from "@/lib/data/campaigns";
import { listGoals } from "@/lib/data/goals";
import { todayISODate } from "@/lib/dates";
import { DataAccessError } from "@/lib/data/errors";
import { CheckinForm } from "@/features/checkin/checkin-form";
import { ChecklistSection } from "@/features/checkin/checklist-section";
import type { Campaign, ContentItem, DailyAction, DailyCheckin, Goal, InstagramAccount, Product } from "@/types/domain";

export const metadata: Metadata = { title: "Check-in — Cami Content OS" };

interface CheckinPageData {
  account: InstagramAccount | null;
  checkin: DailyCheckin | null;
  actions: DailyAction[];
  contentItems: ContentItem[];
  products: Product[];
  campaigns: Campaign[];
  goals: Goal[];
}

/** Busca de dados isolada do JSX (ver mesma explicação em src/app/(app)/hoje/page.tsx). */
async function loadCheckinData(supabase: DbClient, userId: string, today: string): Promise<CheckinPageData> {
  const account = await getActiveAccount(supabase);

  if (!account) {
    return { account: null, checkin: null, actions: [], contentItems: [], products: [], campaigns: [], goals: [] };
  }

  const [checkin, contentItems, products, campaigns, goals] = await Promise.all([
    getDailyCheckin(supabase, account.id, today),
    listContentItems(supabase, {
      status: [
        "idea",
        "researching",
        "scripting",
        "ready_to_record",
        "recorded",
        "editing",
        "awaiting_approval",
        "scheduled",
      ],
    }),
    listProducts(supabase),
    listCampaigns(supabase),
    listGoals(supabase),
  ]);

  const actions = await ensureDailyActionsForDate(supabase, userId, today, checkin?.id ?? null);

  return { account, checkin, actions, contentItems, products, campaigns, goals };
}

export default async function CheckinPage() {
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
    redirect("/login?proximo=/checkin");
  }

  let data: CheckinPageData | null = null;
  let loadError: string | null = null;
  try {
    data = await loadCheckinData(supabase, user.id, todayISODate());
  } catch (error) {
    loadError = error instanceof DataAccessError ? error.message : "Não foi possível carregar o check-in.";
  }

  if (!data) {
    return <ErrorState title="Algo deu errado ao carregar o check-in" description={loadError ?? undefined} />;
  }

  if (!data.account) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Check-in"
          description="Um registro rápido de manhã e à noite: foco do dia, prioridades e o que rolou na produção."
        />
        <EmptyState
          title="Cadastre uma conta do Instagram para começar"
          description="O check-in é feito por conta — cadastre a sua em Configurações para liberar esta tela."
          className="py-16"
        />
        <Button asChild className="self-center">
          <Link href="/configuracoes">Ir para Configurações</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Check-in Diário"
        description={`Ritmo de @${data.account.handle} — planejamento matinal e encerramento noturno. Suas respostas são salvas automaticamente.`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/hoje">Voltar para Hoje</Link>
          </Button>
        }
      />
      <ChecklistSection initialActions={data.actions} />
      <CheckinForm
        initialCheckin={data.checkin}
        contentItems={data.contentItems}
        products={data.products}
        campaigns={data.campaigns}
        goals={data.goals}
      />
    </div>
  );
}
