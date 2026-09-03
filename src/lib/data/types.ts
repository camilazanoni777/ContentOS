import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Toda função da camada de acesso a dados recebe o client Supabase como
 * primeiro argumento (em vez de importar um singleton), para funcionar tanto
 * no servidor (src/lib/supabase/server.ts) quanto no navegador
 * (src/lib/supabase/client.ts) sem duplicar código.
 */
export type DbClient = SupabaseClient<Database>;
