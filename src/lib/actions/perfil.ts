"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { recordProfileSnapshot, deleteProfileSnapshot } from "@/lib/data/profile-snapshots";
import { DataAccessError } from "@/lib/data/errors";
import { profileSnapshotSchema } from "@/lib/validations/profile-snapshot";
import type { ProfileSnapshot, ProfileSnapshotInsert } from "@/types/domain";

export type ProfileSnapshotResult = { error: string } | { success: true; snapshot: ProfileSnapshot };
export type SimpleResult = { error: string } | { success: true };

function revalidatePerfil() {
  revalidatePath("/metricas/perfil");
  revalidatePath("/metas");
}

async function authenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Salva um registro diário de Métricas do Perfil. Um registro por conta por
 * dia — reenviar a mesma conta+data edita o registro existente (upsert na
 * camada de dados, mesma constraint do banco).
 */
export async function saveProfileSnapshot(input: unknown): Promise<ProfileSnapshotResult> {
  const parsed = profileSnapshotSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os dados deste registro de perfil." };
  }
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };

  const data = parsed.data;
  const payload: ProfileSnapshotInsert = {
    account_id: data.accountId,
    user_id: user.id,
    snapshot_date: data.snapshotDate,
    followers: data.followers,
    following: data.following,
    views: data.views,
    reach: data.reach,
    impressions: data.impressions,
    accounts_engaged: data.accountsEngaged,
    interactions: data.interactions,
    profile_visits: data.profileVisits,
    website_clicks: data.websiteClicks,
    messages: data.messages,
    leads: data.leads,
    sales: data.sales,
    revenue: data.revenue,
    posts_count: data.postsCount,
    stories_count: data.storiesCount,
    hours_invested: data.hoursInvested,
    notes: data.notes,
  };

  try {
    const snapshot = await recordProfileSnapshot(supabase, payload);
    revalidatePerfil();
    return { success: true, snapshot };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível salvar este registro de perfil." };
  }
}

export async function removeProfileSnapshot(id: string): Promise<SimpleResult> {
  const { supabase, user } = await authenticatedClient();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };
  try {
    await deleteProfileSnapshot(supabase, id);
    revalidatePerfil();
    return { success: true };
  } catch (error) {
    return { error: error instanceof DataAccessError ? error.message : "Não foi possível excluir este registro." };
  }
}
