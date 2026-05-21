'use server'

import { createServerClient } from '@/lib/supabase'

export async function signIn(email: string, password: string): Promise<{ error: string | null }> {
  const supabase = createServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error: error?.message ?? null }
}
