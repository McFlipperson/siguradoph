import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'

// GET — kick off Facebook OAuth to connect a clinic's Page
// Redirects to Facebook, which redirects back to /api/auth/facebook/callback
export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user?.clinicId) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const appId = process.env.FACEBOOK_APP_ID
  if (!appId) {
    // App not configured — send back with error flag
    return NextResponse.redirect(new URL('/reminders?messenger=misconfigured', req.url))
  }

  // Use canonical app URL so the redirect URI is stable regardless of www redirect
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin
  const redirectUri = `${origin}/api/auth/facebook/callback`

  // State = base64url-encoded clinicId — doubles as CSRF token
  const state = Buffer.from(user.clinicId).toString('base64url')

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'pages_messaging,pages_show_list,pages_read_engagement',
    state,
    response_type: 'code',
  })

  const res = NextResponse.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
  )

  // Store state in a short-lived cookie for CSRF validation on callback
  res.cookies.set('fb_oauth_state', state, {
    httpOnly: true,
    secure: true,
    maxAge: 600, // 10 minutes
    sameSite: 'lax',
    path: '/',
  })

  return res
}
