import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// Cliente ADMIN (service role). USAR SOMENTE NO SERVIDOR (Route Handlers / scripts).
// Ignora a RLS — por isso NUNCA deve vazar para o navegador.
export function createAdminClient(): SupabaseClient {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
