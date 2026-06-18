import { NextRequest, NextResponse } from 'next/server'
import { sendPromoDay5 } from '@/lib/promo-emails'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const to = req.nextUrl.searchParams.get('to') ?? 'nubesmcgee@gmail.com'
  await sendPromoDay5(to, 'My Denty')
  return NextResponse.json({ ok: true, sent: to })
}
