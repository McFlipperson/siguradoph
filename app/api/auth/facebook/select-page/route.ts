import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { connectPage } from '../callback/route'

type PickData = {
  pages: Array<{ id: string; name: string; access_token: string }>
  clinicId: string
  returnTo: string
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const raw = req.cookies.get('fb_page_pick')?.value
  if (!raw) return NextResponse.json({ error: 'No pending page selection' }, { status: 400 })

  let pickData: PickData
  try {
    pickData = JSON.parse(Buffer.from(raw, 'base64url').toString())
  } catch {
    return NextResponse.json({ error: 'Invalid cookie' }, { status: 400 })
  }

  if (pickData.clinicId !== user.clinicId) {
    return NextResponse.json({ error: 'Clinic mismatch' }, { status: 403 })
  }

  const { pageId } = await req.json() as { pageId: string }
  const page = pickData.pages.find(p => p.id === pageId)
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 400 })

  const appId     = process.env.FACEBOOK_APP_ID!
  const appSecret = process.env.FACEBOOK_APP_SECRET!

  const connectRes = await connectPage({
    page,
    clinicId: pickData.clinicId,
    appId,
    appSecret,
    returnTo: pickData.returnTo,
    req,
  })

  // connectPage returns a redirect response — extract the URL and return as JSON
  // so the client-side fetch can navigate to it
  const redirectUrl = connectRes.headers.get('location') ?? '/'

  // Clear the pick cookie
  const res = NextResponse.json({ redirect: redirectUrl })
  res.cookies.delete('fb_page_pick')
  return res
}
