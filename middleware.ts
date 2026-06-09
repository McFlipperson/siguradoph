import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'sigurado.xyz'

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || ''
  const url = req.nextUrl.clone()
  const host = hostname.replace(/:\d+$/, '')

  // Start with a response that we'll thread through Supabase for cookie handling
  let res = NextResponse.next({ request: req })

  // Wire up Supabase SSR cookie proxy — required for session refresh
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          const cookieDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
            ? `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
            : undefined
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, { ...options, domain: cookieDomain })
          )
        },
      },
    }
  )

  // Refresh session if expired — must be called before any routing logic
  await supabase.auth.getUser()

  // Vercel preview deployments — serve normally
  if (host.endsWith('.vercel.app')) {
    return res
  }

  // Root domain (sigurado.xyz / www.sigurado.xyz / localhost)
  if (
    host === ROOT_DOMAIN ||
    host === `www.${ROOT_DOMAIN}` ||
    host === 'localhost'
  ) {
    // Supabase auth emails land here with ?code= when redirectTo fallback kicks in
    if (url.pathname === '/' && url.searchParams.get('code')) {
      const dest = new URL('/auth/confirm', url.origin)
      dest.searchParams.set('code', url.searchParams.get('code')!)
      const type = url.searchParams.get('type')
      if (type) dest.searchParams.set('type', type)
      return NextResponse.redirect(dest)
    }

    // Rewrite / to the coming soon page
    if (url.pathname === '/') {
      url.pathname = '/landing'
      return NextResponse.rewrite(url)
    }

    return res
  }

  // CPA portal subdomain
  const subdomain = host.replace(`.${ROOT_DOMAIN}`, '')
  if (subdomain === 'cpa') {
    url.pathname = `/cpa${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // Clinic subdomains — pass through
  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
