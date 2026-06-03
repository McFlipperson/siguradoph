import { type EmailOtpType } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'sigurado.xyz'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding'

  // OAuth (Google/Apple) and magic-link PKCE flow: exchange the code for a session.
  if (code) {
    const cookieJar: { name: string; value: string; options?: CookieOptions }[] = []
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieJar.push({ name, value, options }))
          },
        },
      }
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(new URL('/login?error=confirmation_failed', origin))

    // Returning user with a clinic → their subdomain. New user → onboarding.
    let destUrl = new URL(next, origin)
    const email = data.user?.email
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { clinic: { select: { slug: true } } },
      })
      const slug = user?.clinic?.slug
      if (slug) destUrl = new URL(`https://${slug}.${ROOT_DOMAIN}/`)
    }

    const res = NextResponse.redirect(destUrl)
    cookieJar.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  }

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
