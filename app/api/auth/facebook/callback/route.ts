import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

// GET — Facebook OAuth callback
// Facebook redirects here after the clinic owner authorizes.
// We exchange the code for a long-lived Page Access Token and save it to the clinic.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const remindersUrl = (flag: string) => {
    const u = new URL('/reminders', req.url)
    u.searchParams.set('messenger', flag)
    return u
  }

  // User cancelled or Facebook returned an error
  if (error) return NextResponse.redirect(remindersUrl('cancelled'))

  if (!code || !state) return NextResponse.redirect(remindersUrl('error'))

  // ── CSRF check ────────────────────────────────────────────────────────────
  const cookieState = req.cookies.get('fb_oauth_state')?.value
  if (!cookieState || state !== cookieState) {
    return NextResponse.redirect(remindersUrl('error'))
  }

  // ── Decode clinicId from state ────────────────────────────────────────────
  let clinicId: string
  try {
    clinicId = Buffer.from(state, 'base64url').toString()
    if (!clinicId) throw new Error('empty')
  } catch {
    return NextResponse.redirect(remindersUrl('error'))
  }

  // ── Verify the session user still owns this clinic ────────────────────────
  const user = await getSessionUser()
  if (!user || user.clinicId !== clinicId) {
    return NextResponse.redirect(remindersUrl('error'))
  }

  const appId     = process.env.FACEBOOK_APP_ID!
  const appSecret = process.env.FACEBOOK_APP_SECRET!
  const origin    = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin
  const redirectUri = `${origin}/api/auth/facebook/callback`

  // ── Step 1: exchange code → short-lived user access token ─────────────────
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
    new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code }),
    { cache: 'no-store' }
  )
  const tokenData = await tokenRes.json() as {
    access_token?: string
    error?: { message: string }
  }
  if (!tokenData.access_token) {
    console.error('[fb-callback] token exchange failed', tokenData.error)
    return NextResponse.redirect(remindersUrl('error'))
  }

  // ── Step 2: get Pages the user admins ─────────────────────────────────────
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token` +
    `&access_token=${tokenData.access_token}`,
    { cache: 'no-store' }
  )
  const pagesData = await pagesRes.json() as {
    data?: Array<{ id: string; name: string; access_token: string }>
    error?: { message: string }
  }
  const pages = pagesData.data ?? []

  if (pages.length === 0) {
    console.error('[fb-callback] no pages found', pagesData.error)
    return NextResponse.redirect(remindersUrl('nopage'))
  }

  // MVP: use the first page.
  // TODO: if the clinic has multiple pages, show a page-picker UI.
  const page = pages[0]

  // ── Step 3: exchange page short-lived token → long-lived page token ────────
  // Long-lived page tokens never expire — safe to store permanently.
  const llRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
    new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: page.access_token,
    }),
    { cache: 'no-store' }
  )
  const llData = await llRes.json() as { access_token?: string }
  const finalToken = llData.access_token ?? page.access_token

  // ── Save to clinic ─────────────────────────────────────────────────────────
  await prisma.clinic.update({
    where: { id: clinicId },
    data: {
      messengerToken:  finalToken,
      messengerPageId: page.id,
      // Keep existing facebookPageUrl if already set
    },
  })

  // Clear CSRF cookie and redirect to reminders with success flag
  const res = NextResponse.redirect(remindersUrl('connected'))
  res.cookies.delete('fb_oauth_state')
  return res
}
