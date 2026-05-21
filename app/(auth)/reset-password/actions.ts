'use server'

import { createServerClient } from '@/lib/supabase'

export async function updatePassword(tokenHash: string, password: string): Promise<{ error: string | null }> {
  const supabase = createServerClient()

  const { error: verifyError } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash })
  if (verifyError) return { error: verifyError.message }

  const { error } = await supabase.auth.updateUser({ password })
  return { error: error?.message ?? null }
}
