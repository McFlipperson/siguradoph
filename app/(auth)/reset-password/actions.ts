'use server'

import { createServerClient } from '@/lib/supabase'

export async function updatePassword(password: string): Promise<{ error: string | null }> {
  const supabase = createServerClient()
  const { error } = await supabase.auth.updateUser({ password })
  return { error: error?.message ?? null }
}
