import { type EmailOtpType } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/onboarding'

  if (token_hash && type) {
    // For password recovery, pass the token through to the reset-password page
    // so the server action can verify it and update the password in one step.
    // This avoids relying on Set-Cookie headers surviving CDN redirects.
    if (type === 'recovery') {
      const dest = new URL('/reset-password', origin)
      dest.searchParams.set('token_hash', token_hash)
      return NextResponse.redirect(dest)
    }

    const response = NextResponse.redirect(new URL(next, origin))

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) return response
  }

  return NextResponse.redirect(new URL('/login?error=confirmation_failed', origin))
}
