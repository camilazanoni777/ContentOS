import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ChecklistSection } from "@/features/checkin/checklist-section";
import { CheckinForm } from "@/features/checkin/checkin-form";
import type { Campaign, ContentItem, DailyAction, DailyCheckin, Goal, Product } from "@/types/domain";

const mockActions: DailyAction[] = [
  {
    id: "act-1",
    user_id: "u1",
    checkin_id: "c1",
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
    user_id: "u1",
    checkin_id: "c1",
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
    user_id: "u1",
    checkin_id: "c1",
    checklist_item_id: null,
    action_date: "2026-09-05",
    title: "Enviar arquivo bruto para corte e edição final",
    is_done: false,
    is_active: true,
    sort_order: 3,
    completed_at: null,
    created_at: "2026-09-05T08:00:00Z",
    updated_at: "2026-09-05T08:00:00Z",
  },
  {
    id: "act-4",
    user_id: "u1",
    checkin_id: "c1",
    checklist_item_id: null,
    action_date: "2026-09-05",
    title: "Responder comentários e direct de potenciais clientes",
    is_done: false,
    is_active: true,
    sort_order: 4,
    completed_at: null,
    created_at: "2026-09-05T08:00:00Z",
    updated_at: "2026-09-05T08:00:00Z",
  },
];

const mockContentItems: ContentItem[] = [
  {
    id: "c1",
    user_id: "u1",
    account_id: "acc1",
    campaign_id: null,
    format: "reels",
    pillar: "Autoridade",
    title: "Reel Principal: Como destravar consistência no Instagram",
    hook: null,
    cta: null,
    notes: null,
    status: "ready_to_record",
    planned_at: "2026-09-05T10:00:00Z",
    recorded_at: null,
    published_at: null,
    published_url: null,
    archived_at: null,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-05T00:00:00Z",
  } as unknown as ContentItem,
  {
    id: "c2",
    user_id: "u1",
    account_id: "acc1",
    campaign_id: null,
    format: "carousel",
    pillar: "Educação",
    title: "Carrossel de Ferramentas de IA",
    hook: null,
    cta: null,
    notes: null,
    status: "scripting",
    planned_at: "2026-09-05T16:00:00Z",
    recorded_at: null,
    published_at: null,
    published_url: null,
    archived_at: null,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-05T00:00:00Z",
  } as unknown as ContentItem,
];

const mockProducts: Product[] = [
  {
    id: "p1",
    user_id: "u1",
    name: "Mentoria Content Master",
    description: null,
    status: "active",
    reference_price: 2500,
    notes: null,
    archived_at: null,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
];

const mockCampaigns: Campaign[] = [
  {
    id: "cmp1",
    user_id: "u1",
    account_id: "acc1",
    name: "Lançamento Turma 4",
    brand_name: "Própria",
    negotiation_status: "approved",
    currency: "BRL",
    notes: null,
    archived_at: null,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  } as unknown as Campaign,
];

const mockGoals: Goal[] = [
  {
    id: "g1",
    user_id: "u1",
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
  },
];

const mockInitialCheckin: DailyCheckin = {
  id: "chk-1",
  user_id: "u1",
  account_id: "acc1",
  checkin_date: "2026-09-05",
  objective_main: "Gravar o Reel principal e alinhar os cortes com a editora",
  priorities: JSON.stringify([
    { label: "Gravar Reel de posicionamento no teleprompter", contentItemId: "c1" },
    { label: "Revisar estrutura do carrossel da semana", contentItemId: "c2" },
    { label: "Responder DMs de pessoas interessadas na mentoria", goalId: "g1" },
  ]),
  main_content_item_id: "c1",
  planned_stories: "3 stories com enquete sobre rotina de gravação",
  focus_product_id: "p1",
  focus_campaign_id: "cmp1",
  observed_trend: "Ganchos curtos de 2 segundos com corte seco",
  community_action: "Responder os 10 primeiros comentários da manhã",
  notes: "Ajustar a luz suave de contra",
  daily_learning: "Escrever o roteiro direto no Content OS economizou 30 minutos",
  evening_wins: "Reel gravado na primeira tomada e áudio impecável",
  evening_blockers: "Pequena demora para renderizar os títulos",
  tomorrow_priority: "Gravar sequência de stories de oferta às 10h",
  night_closed_at: null,
  created_at: "2026-09-05T08:00:00Z",
  updated_at: "2026-09-05T08:00:00Z",
};

export default function PreviewCheckinPage() {
  return (
    <div className="min-h-svh bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl flex flex-col gap-6">
        <PageHeader
          title="Check-in Diário"
          description="Ritmo de @camilazanoni — planejamento matinal e encerramento noturno. Suas respostas são salvas automaticamente."
          actions={
            <Button variant="outline" size="sm">
              Voltar para Hoje
            </Button>
          }
        />
        <ChecklistSection initialActions={mockActions} />
        <CheckinForm
          initialCheckin={mockInitialCheckin}
          contentItems={mockContentItems}
          products={mockProducts}
          campaigns={mockCampaigns}
          goals={mockGoals}
        />
      </div>
    </div>
  );
}
