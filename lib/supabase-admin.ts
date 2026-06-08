import { createClient } from '@supabase/supabase-js'

/**
 * Supabase admin client — uses the service role key.
 * Only for server-side operations that need elevated access
 * (e.g. inviting staff users). Never expose to the client.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
