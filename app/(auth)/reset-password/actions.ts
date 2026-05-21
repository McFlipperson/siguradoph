'use server'

import { createServerClient } from '@/lib/supabase'

export async function updatePassword(tokenHash: string, password: string): Promise<{ error: string | null }> {
  console.log('[reset-password] tokenHash length:', tokenHash?.length, 'preview:', tokenHash?.slice(0, 12))

  const supabase = createServerClient()

  const { error: verifyError } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash })
  console.log('[reset-password] verifyOtp:', verifyError ? `FAIL: ${verifyError.message}` : 'OK')
  if (verifyError) return { error: verifyError.message }

  const { error } = await supabase.auth.updateUser({ password })
  return { error: error?.message ?? null }
}
