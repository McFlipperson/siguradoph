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
  const next = searchParams.get('next') ?? '/onboarding'

  if (code) {
    const supabase = createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Confirmed & signed in — send to onboarding (or wherever next points)
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  // Something went wrong — send to login with an error hint
  return NextResponse.redirect(new URL('/login?error=confirmation_failed', origin))
}
