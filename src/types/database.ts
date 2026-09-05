/**
 * Tipos do banco de dados, escritos manualmente para espelhar exatamente as
 * migrations em supabase/migrations/*.sql.
 *
 * Quando o projeto Supabase real existir, este arquivo pode ser substituído
 * (ou conferido) rodando:
 *
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 *
 * Observação: o campo `Relationships` (usado pelo client do Supabase para
 * embeds automáticos) foi omitido deliberadamente — não usamos embeds
 * automáticos, a camada de acesso a dados (src/lib/data) resolve relações
 * explicitamente.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ContentStatus =
  | "idea"
  | "researching"
  | "scripting"
  | "ready_to_record"
  | "recorded"
  | "editing"
  | "awaiting_approval"
  | "scheduled"
  | "published"
  | "repurpose"
  | "archived"
  | "canceled";

export type MetricWindow = "24h" | "7d" | "30d" | "custom";
export type CampaignType = "barter" | "paid_post" | "ambassador" | "affiliate" | "event_appearance" | "exclusive_content" | "image_licensing" | "other";
export type NegotiationStatus = "prospecting" | "first_contact" | "proposal_sent" | "negotiating" | "approved" | "declined" | "standby";
export type ContractStatus = "not_applicable" | "not_sent" | "sent" | "under_review" | "signed";
export type DeliveryStatus = "not_started" | "in_production" | "sent_for_approval" | "approved" | "published" | "late";
export type CampaignPaymentStatus = "not_applicable" | "to_be_agreed" | "awaiting_invoice" | "awaiting_payment" | "partially_paid" | "paid" | "overdue" | "canceled";
export type PaymentInstallmentStatus = "awaiting_invoice" | "awaiting_payment" | "partially_paid" | "paid" | "overdue" | "canceled";
export type DeliverableStatus = "pending" | "in_progress" | "sent_for_approval" | "approved" | "published" | "canceled";
export type ProductStatus = "draft" | "active" | "inactive" | "archived";
export type SalesRecordSource = "manual" | "metric_snapshot";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          id: string;
          user_id: string;
          timezone: string;
          pillars: string[];
          formats: string[];
          objectives: string[];
          ctas: string[];
          priorities: string[];
          weekly_publish_target: number | null;
          stalled_idea_days: number;
          minimum_ideas_per_pillar: number;
          extra: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          timezone?: string;
          pillars?: string[];
          formats?: string[];
          objectives?: string[];
          ctas?: string[];
          priorities?: string[];
          weekly_publish_target?: number | null;
          stalled_idea_days?: number;
          minimum_ideas_per_pillar?: number;
          extra?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          timezone?: string;
          pillars?: string[];
          formats?: string[];
          objectives?: string[];
          ctas?: string[];
          priorities?: string[];
          weekly_publish_target?: number | null;
          stalled_idea_days?: number;
          minimum_ideas_per_pillar?: number;
          extra?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      instagram_accounts: {
        Row: {
          id: string;
          user_id: string;
          handle: string;
          display_name: string | null;
          is_primary: boolean;
          connected_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          handle: string;
          display_name?: string | null;
          is_primary?: boolean;
          connected_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          handle?: string;
          display_name?: string | null;
          is_primary?: boolean;
          connected_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      content_series: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          brand_name: string | null;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          contact_notes: string | null;
          first_contact_date: string | null;
          campaign_type: CampaignType;
          account_id: string | null;
          delivery_due_date: string | null;
          published_at: string | null;
          contracted_fee: number | null;
          currency: string;
          negotiation_status: NegotiationStatus;
          contract_status: ContractStatus;
          delivery_status: DeliveryStatus;
          payment_status: CampaignPaymentStatus;
          expected_payment_date: string | null;
          briefing_url: string | null;
          contract_url: string | null;
          folder_url: string | null;
          publication_url: string | null;
          responsible_name: string | null;
          notes: string | null;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          brand_name?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          contact_notes?: string | null;
          first_contact_date?: string | null;
          campaign_type?: CampaignType;
          account_id?: string | null;
          delivery_due_date?: string | null;
          published_at?: string | null;
          contracted_fee?: number | null;
          currency?: string;
          negotiation_status?: NegotiationStatus;
          contract_status?: ContractStatus;
          delivery_status?: DeliveryStatus;
          payment_status?: CampaignPaymentStatus;
          expected_payment_date?: string | null;
          briefing_url?: string | null;
          contract_url?: string | null;
          folder_url?: string | null;
          publication_url?: string | null;
          responsible_name?: string | null;
          notes?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          brand_name?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          contact_notes?: string | null;
          first_contact_date?: string | null;
          campaign_type?: CampaignType;
          account_id?: string | null;
          delivery_due_date?: string | null;
          published_at?: string | null;
          contracted_fee?: number | null;
          currency?: string;
          negotiation_status?: NegotiationStatus;
          contract_status?: ContractStatus;
          delivery_status?: DeliveryStatus;
          payment_status?: CampaignPaymentStatus;
          expected_payment_date?: string | null;
          briefing_url?: string | null;
          contract_url?: string | null;
          folder_url?: string | null;
          publication_url?: string | null;
          responsible_name?: string | null;
          notes?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          reference_price: number | null;
          status: ProductStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          reference_price?: number | null;
          status?: ProductStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          reference_price?: number | null;
          status?: ProductStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      campaign_deliverables: {
        Row: { id: string; user_id: string; campaign_id: string; content_item_id: string | null; title: string; quantity: number; status: DeliverableStatus; due_date: string | null; completed_at: string | null; notes: string | null; sort_order: number; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; campaign_id: string; content_item_id?: string | null; title: string; quantity?: number; status?: DeliverableStatus; due_date?: string | null; completed_at?: string | null; notes?: string | null; sort_order?: number; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; campaign_id?: string; content_item_id?: string | null; title?: string; quantity?: number; status?: DeliverableStatus; due_date?: string | null; completed_at?: string | null; notes?: string | null; sort_order?: number; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      campaign_payments: {
        Row: { id: string; user_id: string; campaign_id: string; amount: number; received_amount: number | null; due_date: string | null; received_at: string | null; status: PaymentInstallmentStatus; notes: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; campaign_id: string; amount: number; received_amount?: number | null; due_date?: string | null; received_at?: string | null; status?: PaymentInstallmentStatus; notes?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; campaign_id?: string; amount?: number; received_amount?: number | null; due_date?: string | null; received_at?: string | null; status?: PaymentInstallmentStatus; notes?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      sales_records: {
        Row: { id: string; user_id: string; product_id: string; campaign_id: string | null; content_item_id: string | null; metric_snapshot_id: string | null; source: SalesRecordSource; sale_date: string; cta: string | null; link_clicks: number | null; leads: number | null; sales_count: number | null; revenue: number | null; notes: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; product_id: string; campaign_id?: string | null; content_item_id?: string | null; metric_snapshot_id?: string | null; source?: SalesRecordSource; sale_date: string; cta?: string | null; link_clicks?: number | null; leads?: number | null; sales_count?: number | null; revenue?: number | null; notes?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; user_id?: string; product_id?: string; campaign_id?: string | null; content_item_id?: string | null; metric_snapshot_id?: string | null; source?: SalesRecordSource; sale_date?: string; cta?: string | null; link_clicks?: number | null; leads?: number | null; sales_count?: number | null; revenue?: number | null; notes?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      content_items: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          title: string;
          hook: string | null;
          summary: string | null;
          script: string | null;
          caption: string | null;
          format: string | null;
          pillar: string | null;
          objective: string | null;
          cta: string | null;
          priority: string | null;
          status: ContentStatus;
          potential: string | null;
          production_ease: string | null;
          can_be_series: boolean;
          series_id: string | null;
          reference_text: string | null;
          reference_url: string | null;
          audience_intent: string | null;
          planned_at: string | null;
          production_due_at: string | null;
          scheduled_at: string | null;
          published_at: string | null;
          published_url: string | null;
          campaign_id: string | null;
          product_id: string | null;
          source_content_id: string | null;
          recording_notes: string | null;
          editing_notes: string | null;
          cover_notes: string | null;
          notes: string | null;
          tags: string[];
          hook_variations: Json;
          script_structure: Json;
          on_screen_text: string | null;
          shot_list: Json;
          estimated_duration_seconds: number | null;
          script_checklist: Json;
          raw_file_url: string | null;
          edited_file_url: string | null;
          editor_name: string | null;
          edit_visual_references: Json;
          edit_cuts_notes: string | null;
          edit_on_screen_text_notes: string | null;
          edit_captions_notes: string | null;
          edit_audio_notes: string | null;
          recording_checklist: Json;
          edit_checklist: Json;
          hashtags: string[];
          cover_image_url: string | null;
          scheduling_checklist: Json;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id?: string | null;
          title: string;
          hook?: string | null;
          summary?: string | null;
          script?: string | null;
          caption?: string | null;
          format?: string | null;
          pillar?: string | null;
          objective?: string | null;
          cta?: string | null;
          priority?: string | null;
          status?: ContentStatus;
          potential?: string | null;
          production_ease?: string | null;
          can_be_series?: boolean;
          series_id?: string | null;
          reference_text?: string | null;
          reference_url?: string | null;
          audience_intent?: string | null;
          planned_at?: string | null;
          production_due_at?: string | null;
          scheduled_at?: string | null;
          published_at?: string | null;
          published_url?: string | null;
          campaign_id?: string | null;
          product_id?: string | null;
          source_content_id?: string | null;
          recording_notes?: string | null;
          editing_notes?: string | null;
          cover_notes?: string | null;
          notes?: string | null;
          tags?: string[];
          hook_variations?: Json;
          script_structure?: Json;
          on_screen_text?: string | null;
          shot_list?: Json;
          estimated_duration_seconds?: number | null;
          script_checklist?: Json;
          raw_file_url?: string | null;
          edited_file_url?: string | null;
          editor_name?: string | null;
          edit_visual_references?: Json;
          edit_cuts_notes?: string | null;
          edit_on_screen_text_notes?: string | null;
          edit_captions_notes?: string | null;
          edit_audio_notes?: string | null;
          recording_checklist?: Json;
          edit_checklist?: Json;
          hashtags?: string[];
          cover_image_url?: string | null;
          scheduling_checklist?: Json;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string | null;
          title?: string;
          hook?: string | null;
          summary?: string | null;
          script?: string | null;
          caption?: string | null;
          format?: string | null;
          pillar?: string | null;
          objective?: string | null;
          cta?: string | null;
          priority?: string | null;
          status?: ContentStatus;
          potential?: string | null;
          production_ease?: string | null;
          can_be_series?: boolean;
          series_id?: string | null;
          reference_text?: string | null;
          reference_url?: string | null;
          audience_intent?: string | null;
          planned_at?: string | null;
          production_due_at?: string | null;
          scheduled_at?: string | null;
          published_at?: string | null;
          published_url?: string | null;
          campaign_id?: string | null;
          product_id?: string | null;
          source_content_id?: string | null;
          recording_notes?: string | null;
          editing_notes?: string | null;
          cover_notes?: string | null;
          notes?: string | null;
          tags?: string[];
          hook_variations?: Json;
          script_structure?: Json;
          on_screen_text?: string | null;
          shot_list?: Json;
          estimated_duration_seconds?: number | null;
          script_checklist?: Json;
          raw_file_url?: string | null;
          edited_file_url?: string | null;
          editor_name?: string | null;
          edit_visual_references?: Json;
          edit_cuts_notes?: string | null;
          edit_on_screen_text_notes?: string | null;
          edit_captions_notes?: string | null;
          edit_audio_notes?: string | null;
          recording_checklist?: Json;
          edit_checklist?: Json;
          hashtags?: string[];
          cover_image_url?: string | null;
          scheduling_checklist?: Json;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      content_script_versions: {
        Row: {
          id: string;
          user_id: string;
          content_item_id: string;
          snapshot: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_item_id: string;
          snapshot: Json;
          created_at?: string;
        };
        // Imutável (só select/insert) — mesmo padrão de content_status_history.
        Update: Record<string, never>;
        Relationships: [];
      };
      recording_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_date: string | null;
          location: string | null;
          scenario: string | null;
          outfit: string | null;
          equipment: string | null;
          available_minutes: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_date?: string | null;
          location?: string | null;
          scenario?: string | null;
          outfit?: string | null;
          equipment?: string | null;
          available_minutes?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_date?: string | null;
          location?: string | null;
          scenario?: string | null;
          outfit?: string | null;
          equipment?: string | null;
          available_minutes?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recording_session_items: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          content_item_id: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          content_item_id: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          content_item_id?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      content_review_comments: {
        Row: {
          id: string;
          user_id: string;
          content_item_id: string;
          author_name: string | null;
          body: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_item_id: string;
          author_name?: string | null;
          body: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_item_id?: string;
          author_name?: string | null;
          body?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      content_status_history: {
        Row: {
          id: string;
          content_item_id: string;
          user_id: string;
          previous_status: ContentStatus | null;
          new_status: ContentStatus;
          changed_at: string;
        };
        // Gerado exclusivamente por trigger; a aplicação nunca insere/atualiza
        // esta tabela diretamente (Insert/Update sem chaves válidas impede
        // chamadas .insert()/.update() com dados reais via client tipado).
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      metric_snapshots: {
        Row: {
          id: string;
          content_item_id: string;
          user_id: string;
          window_type: MetricWindow;
          window_start: string | null;
          window_end: string | null;
          captured_at: string;
          views: number | null;
          reach: number | null;
          impressions: number | null;
          likes: number | null;
          comments: number | null;
          shares: number | null;
          saves: number | null;
          replies: number | null;
          profile_visits: number | null;
          followers_gained: number | null;
          link_clicks: number | null;
          leads: number | null;
          sales: number | null;
          revenue: number | null;
          average_watch_time_seconds: number | null;
          video_duration_seconds: number | null;
          three_second_views: number | null;
          completed_views: number | null;
          retention_rate: number | null;
          story_exits: number | null;
          taps_forward: number | null;
          taps_back: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_item_id: string;
          user_id: string;
          window_type: MetricWindow;
          window_start?: string | null;
          window_end?: string | null;
          captured_at?: string;
          views?: number | null;
          reach?: number | null;
          impressions?: number | null;
          likes?: number | null;
          comments?: number | null;
          shares?: number | null;
          saves?: number | null;
          replies?: number | null;
          profile_visits?: number | null;
          followers_gained?: number | null;
          link_clicks?: number | null;
          leads?: number | null;
          sales?: number | null;
          revenue?: number | null;
          average_watch_time_seconds?: number | null;
          video_duration_seconds?: number | null;
          three_second_views?: number | null;
          completed_views?: number | null;
          retention_rate?: number | null;
          story_exits?: number | null;
          taps_forward?: number | null;
          taps_back?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          content_item_id?: string;
          user_id?: string;
          window_type?: MetricWindow;
          window_start?: string | null;
          window_end?: string | null;
          captured_at?: string;
          views?: number | null;
          reach?: number | null;
          impressions?: number | null;
          likes?: number | null;
          comments?: number | null;
          shares?: number | null;
          saves?: number | null;
          replies?: number | null;
          profile_visits?: number | null;
          followers_gained?: number | null;
          link_clicks?: number | null;
          leads?: number | null;
          sales?: number | null;
          revenue?: number | null;
          average_watch_time_seconds?: number | null;
          video_duration_seconds?: number | null;
          three_second_views?: number | null;
          completed_views?: number | null;
          retention_rate?: number | null;
          story_exits?: number | null;
          taps_forward?: number | null;
          taps_back?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profile_snapshots: {
        Row: {
          id: string;
          account_id: string;
          user_id: string;
          snapshot_date: string;
          followers: number | null;
          following: number | null;
          posts_count: number | null;
          profile_visits: number | null;
          reach: number | null;
          impressions: number | null;
          website_clicks: number | null;
          views: number | null;
          accounts_engaged: number | null;
          interactions: number | null;
          messages: number | null;
          leads: number | null;
          sales: number | null;
          revenue: number | null;
          stories_count: number | null;
          hours_invested: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          user_id: string;
          snapshot_date: string;
          followers?: number | null;
          following?: number | null;
          posts_count?: number | null;
          profile_visits?: number | null;
          reach?: number | null;
          impressions?: number | null;
          website_clicks?: number | null;
          views?: number | null;
          accounts_engaged?: number | null;
          interactions?: number | null;
          messages?: number | null;
          leads?: number | null;
          sales?: number | null;
          revenue?: number | null;
          stories_count?: number | null;
          hours_invested?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          user_id?: string;
          snapshot_date?: string;
          followers?: number | null;
          following?: number | null;
          posts_count?: number | null;
          profile_visits?: number | null;
          reach?: number | null;
          impressions?: number | null;
          website_clicks?: number | null;
          views?: number | null;
          accounts_engaged?: number | null;
          interactions?: number | null;
          messages?: number | null;
          leads?: number | null;
          sales?: number | null;
          revenue?: number | null;
          stories_count?: number | null;
          hours_invested?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_checkins: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          checkin_date: string;
          objective_main: string | null;
          priorities: Json;
          main_content_item_id: string | null;
          planned_stories: string | null;
          focus_product_id: string | null;
          focus_campaign_id: string | null;
          observed_trend: string | null;
          community_action: string | null;
          notes: string | null;
          daily_learning: string | null;
          evening_wins: string | null;
          evening_blockers: string | null;
          tomorrow_priority: string | null;
          night_closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          checkin_date: string;
          objective_main?: string | null;
          priorities?: Json;
          main_content_item_id?: string | null;
          planned_stories?: string | null;
          focus_product_id?: string | null;
          focus_campaign_id?: string | null;
          observed_trend?: string | null;
          community_action?: string | null;
          notes?: string | null;
          daily_learning?: string | null;
          evening_wins?: string | null;
          evening_blockers?: string | null;
          tomorrow_priority?: string | null;
          night_closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          checkin_date?: string;
          objective_main?: string | null;
          priorities?: Json;
          main_content_item_id?: string | null;
          planned_stories?: string | null;
          focus_product_id?: string | null;
          focus_campaign_id?: string | null;
          observed_trend?: string | null;
          community_action?: string | null;
          notes?: string | null;
          daily_learning?: string | null;
          evening_wins?: string | null;
          evening_blockers?: string | null;
          tomorrow_priority?: string | null;
          night_closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      checklist_items: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      daily_actions: {
        Row: {
          id: string;
          user_id: string;
          checkin_id: string | null;
          checklist_item_id: string | null;
          action_date: string;
          title: string;
          is_done: boolean;
          is_active: boolean;
          sort_order: number;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          checkin_id?: string | null;
          checklist_item_id?: string | null;
          action_date: string;
          title: string;
          is_done?: boolean;
          is_active?: boolean;
          sort_order?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          checkin_id?: string | null;
          checklist_item_id?: string | null;
          action_date?: string;
          title?: string;
          is_done?: boolean;
          is_active?: boolean;
          sort_order?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          period_type: "weekly" | "monthly";
          period_start: string;
          period_end: string;
          metric: string;
          target_value: number | null;
          initial_value: number | null;
          achieved_value: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_type: "weekly" | "monthly";
          period_start: string;
          period_end: string;
          metric: string;
          target_value?: number | null;
          initial_value?: number | null;
          achieved_value?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          period_type?: "weekly" | "monthly";
          period_start?: string;
          period_end?: string;
          metric?: string;
          target_value?: number | null;
          initial_value?: number | null;
          achieved_value?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      weekly_reviews: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          auto_summary: Json;
          strategic_analysis: string | null;
          decision: string | null;
          strategic_focus: string | null;
          weekly_experiment: string | null;
          priority_content_id: string | null;
          active_campaign_id: string | null;
          planned_hours: number | null;
          what_worked: string | null;
          what_didnt_work: string | null;
          what_to_repeat: string | null;
          what_to_stop: string | null;
          what_to_test: string | null;
          key_learning: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start: string;
          auto_summary?: Json;
          strategic_analysis?: string | null;
          decision?: string | null;
          strategic_focus?: string | null;
          weekly_experiment?: string | null;
          priority_content_id?: string | null;
          active_campaign_id?: string | null;
          planned_hours?: number | null;
          what_worked?: string | null;
          what_didnt_work?: string | null;
          what_to_repeat?: string | null;
          what_to_stop?: string | null;
          what_to_test?: string | null;
          key_learning?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start?: string;
          auto_summary?: Json;
          strategic_analysis?: string | null;
          decision?: string | null;
          strategic_focus?: string | null;
          weekly_experiment?: string | null;
          priority_content_id?: string | null;
          active_campaign_id?: string | null;
          planned_hours?: number | null;
          what_worked?: string | null;
          what_didnt_work?: string | null;
          what_to_repeat?: string | null;
          what_to_stop?: string | null;
          what_to_test?: string | null;
          key_learning?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      calendar_important_dates: {
        Row: {
          id: string;
          user_id: string;
          event_date: string;
          label: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_date: string;
          label: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_date?: string;
          label?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      alert_dismissals: {
        Row: {
          id: string;
          user_id: string;
          alert_key: string;
          dismissed: boolean;
          snoozed_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          alert_key: string;
          dismissed?: boolean;
          snoozed_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          alert_key?: string;
          dismissed?: boolean;
          snoozed_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      taxonomy_options: {
        Row: { id:string; user_id:string; kind:"pillar"|"format"|"objective"|"cta"|"priority"; value:string; is_system:boolean; archived_at:string|null; created_at:string; updated_at:string };
        Insert: { id?:string; user_id:string; kind:"pillar"|"format"|"objective"|"cta"|"priority"; value:string; is_system?:boolean; archived_at?:string|null; created_at?:string; updated_at?:string };
        Update: { value?:string; archived_at?:string|null; updated_at?:string }; Relationships: [];
      };
      taxonomy_change_audit: { Row:{id:string;user_id:string;kind:string;old_value:string;new_value:string|null;action:"archive"|"replace";affected_rows:number;created_at:string};Insert:never;Update:never;Relationships:[] };
      import_batches: {
        Row:{id:string;user_id:string;account_id:string|null;file_name:string;file_hash:string;status:"preview"|"confirmed"|"completed"|"failed";schema_version:string;detected_sheets:Json;mapping:Json;payload:Json;report:Json;confirmed_at:string|null;completed_at:string|null;created_at:string;updated_at:string};
        Insert:{id?:string;user_id:string;account_id?:string|null;file_name:string;file_hash:string;status?:"preview"|"confirmed"|"completed"|"failed";schema_version?:string;detected_sheets?:Json;mapping?:Json;payload?:Json;report?:Json};
        Update:{status?:"preview"|"confirmed"|"completed"|"failed";confirmed_at?:string|null;completed_at?:string|null;report?:Json};Relationships:[];
      };
      import_entity_links:{Row:{id:string;user_id:string;import_batch_id:string;module:string;legacy_id:string;entity_id:string;created_at:string};Insert:never;Update:never;Relationships:[]};
    };
    Views: Record<string, never>;
    Functions: {
      replace_taxonomy_option:{Args:{p_kind:string;p_old:string;p_new:string};Returns:number};
      apply_import_batch:{Args:{p_batch_id:string};Returns:Json};
    };
  };
}
