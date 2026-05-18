import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'sigurado.xyz'

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || ''
  const url = req.nextUrl.clone()

  // Strip port for local dev
  const host = hostname.replace(/:\d+$/, '')

  // Root domain, www, localhost, and Vercel preview deployments serve normally
  if (
    host === ROOT_DOMAIN ||
    host === `www.${ROOT_DOMAIN}` ||
    host === 'localhost' ||
    host.endsWith('.vercel.app')
  ) {
    return NextResponse.next()
  }

  // Extract subdomain
  const subdomain = host.replace(`.${ROOT_DOMAIN}`, '')

  if (!subdomain || subdomain === 'www') {
    return NextResponse.next()
  }

  // CPA portal lives at cpa.sigurado.xyz
  if (subdomain === 'cpa') {
    url.pathname = `/cpa${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // Otherwise treat as clinic slug
  // Root of subdomain goes straight to intake form
  if (url.pathname === '/') {
    url.pathname = `/clinic/${subdomain}/intake`
    return NextResponse.rewrite(url)
  }
  url.pathname = `/clinic/${subdomain}${url.pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
