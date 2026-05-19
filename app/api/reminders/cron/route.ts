import { NextRequest, NextResponse } from 'next/server'

// GET — Vercel Cron endpoint, secured by CRON_SECRET
// Schedule: "0 0 * * *" UTC = 8:00 AM Manila time (UTC+8)
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Delegate to the process route with the internal secret header
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sigurado.xyz'
  const res = await fetch(`${baseUrl}/api/reminders/process`, {
    method: 'POST',
    headers: { 'x-internal-secret': process.env.CRON_SECRET! },
  })

  const data = await res.json() as { processed?: number; sent?: number; failed?: number; error?: string }
  return NextResponse.json({ ok: true, ...data })
}
