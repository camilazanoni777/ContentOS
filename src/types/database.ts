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
          weekly_publish_target: number | null;
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
          weekly_publish_target?: number | null;
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
          weekly_publish_target?: number | null;
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
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          status: "planned" | "active" | "completed" | "canceled";
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          status?: "planned" | "active" | "completed" | "canceled";
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          status?: "planned" | "active" | "completed" | "canceled";
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          price: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          price?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          price?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
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
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
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
          created_at?: string;
        };
        Relationships: [];
      };
      daily_checkins: {
        Row: {
          id: string;
          user_id: string;
          checkin_date: string;
          morning_mood: string | null;
          morning_focus: string | null;
          morning_notes: string | null;
          evening_summary: string | null;
          evening_wins: string | null;
          evening_blockers: string | null;
          evening_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          checkin_date: string;
          morning_mood?: string | null;
          morning_focus?: string | null;
          morning_notes?: string | null;
          evening_summary?: string | null;
          evening_wins?: string | null;
          evening_blockers?: string | null;
          evening_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          checkin_date?: string;
          morning_mood?: string | null;
          morning_focus?: string | null;
          morning_notes?: string | null;
          evening_summary?: string | null;
          evening_wins?: string | null;
          evening_blockers?: string | null;
          evening_notes?: string | null;
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
          action_date: string;
          title: string;
          is_done: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          checkin_id?: string | null;
          action_date: string;
          title: string;
          is_done?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          checkin_id?: string | null;
          action_date?: string;
          title?: string;
          is_done?: boolean;
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
          metric: string;
          target_value: number | null;
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
          metric: string;
          target_value?: number | null;
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
          metric?: string;
          target_value?: number | null;
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
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
