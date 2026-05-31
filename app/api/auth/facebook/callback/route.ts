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

  const returnTo = req.cookies.get('fb_oauth_return')?.value

  const redirectUrl = (flag: string) => {
    const path = returnTo === 'onboarding' ? '/onboarding' : '/reminders'
    const u = new URL(path, req.url)
    u.searchParams.set('messenger', flag)
    return u
  }

  // keep old name as alias so existing references below still work
  const remindersUrl = redirectUrl

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

  // ── Multiple pages → show picker so clinic selects the right one ──────────
  if (pages.length > 1) {
    const pickData = Buffer.from(
      JSON.stringify({ pages, clinicId, returnTo: returnTo ?? 'reminders' })
    ).toString('base64url')

    const pickUrl = new URL('/auth/pick-page', req.url)
    const res = NextResponse.redirect(pickUrl)
    res.cookies.set('fb_page_pick', pickData, {
      httpOnly: true,
      secure: true,
      maxAge: 600,
      sameSite: 'lax',
      path: '/',
    })
    res.cookies.delete('fb_oauth_state')
    res.cookies.delete('fb_oauth_return')
    return res
  }

  const page = pages[0]

  return await connectPage({ page, clinicId, appId, appSecret, returnTo, req })
}

// ── Shared: long-lived token exchange + save + subscribe ─────────────────────
export async function connectPage({
  page, clinicId, appId, appSecret, returnTo, req,
}: {
  page: { id: string; name: string; access_token: string }
  clinicId: string
  appId: string
  appSecret: string
  returnTo?: string | null
  req: NextRequest
}): Promise<NextResponse> {
  const destination = (flag: string) => {
    const path = returnTo === 'onboarding' ? '/onboarding' : '/reminders'
    const u = new URL(path, req.url)
    u.searchParams.set('messenger', flag)
    return u
  }

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

  await prisma.clinic.update({
    where: { id: clinicId },
    data: { messengerToken: finalToken, messengerPageId: page.id },
  })

  try {
    await fetch(`https://graph.facebook.com/v19.0/${page.id}/subscribed_apps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        subscribed_fields: 'messages,messaging_referrals',
        access_token: finalToken,
      }),
      cache: 'no-store',
    })
  } catch (err) {
    console.error('[fb] webhook subscription failed', err)
  }

  return NextResponse.redirect(destination('connected'))
}
