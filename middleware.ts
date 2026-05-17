import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register', '/intake']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // /intake/[clinicId] is fully public — no auth check
  if (pathname.startsWith('/intake')) return res

  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p))

  // Unauthenticated user hitting a protected route
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Authenticated user hitting auth pages
  if (session && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
