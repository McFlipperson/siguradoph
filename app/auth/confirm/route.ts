import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/onboarding'

  if (token_hash && type) {
    const supabase = createServerClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      const dest = type === 'recovery' ? '/reset-password' : next
      return NextResponse.redirect(new URL(dest, origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=confirmation_failed', origin))
}
