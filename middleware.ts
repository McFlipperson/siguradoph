import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'sigurado.xyz'

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || ''
  const url = req.nextUrl.clone()
  const host = hostname.replace(/:\d+$/, '')

  // Vercel preview deployments — serve normally
  if (host.endsWith('.vercel.app')) {
    return NextResponse.next()
  }

  // Root domain (sigurado.xyz / www.sigurado.xyz / localhost)
  if (
    host === ROOT_DOMAIN ||
    host === `www.${ROOT_DOMAIN}` ||
    host === 'localhost'
  ) {
    // Supabase auth emails land here with ?code= when the redirectTo fallback
    // kicks in — forward to the callback handler so the session is established
    if (url.pathname === '/' && url.searchParams.get('code')) {
      const dest = new URL('/auth/callback', url.origin)
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
    return NextResponse.next()
  }

  // Clinic subdomains (mine.sigurado.xyz, omega.sigurado.xyz, etc.)
  // CPA portal
  const subdomain = host.replace(`.${ROOT_DOMAIN}`, '')
  if (subdomain === 'cpa') {
    url.pathname = `/cpa${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // All other subdomains pass through to the main Next.js app as-is
  // mine.sigurado.xyz/          → dashboard (/)
  // mine.sigurado.xyz/login     → login page
  // mine.sigurado.xyz/patients  → patients page
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
