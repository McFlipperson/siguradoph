import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

/**
 * Supabase email confirmation callback.
 *
 * After a user clicks the confirmation link in their email, Supabase redirects
 * here with ?code=XXXX. We exchange that code for a session, which sets the
 * auth cookies, then send the user into the app.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = (searchParams.get('type') ?? '') as 'signup' | 'recovery' | 'email_change' | ''
  const next = searchParams.get('next')

  const supabase = createServerClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/reset-password', origin))
      }
      return NextResponse.redirect(new URL(next ?? '/onboarding', origin))
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/reset-password', origin))
      }
      return NextResponse.redirect(new URL(next ?? '/onboarding', origin))
    }
  }

  // Something went wrong — send to login with an error hint
  return NextResponse.redirect(new URL('/login?error=confirmation_failed', origin))
}
