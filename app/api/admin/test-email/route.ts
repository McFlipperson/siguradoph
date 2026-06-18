import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const to = req.nextUrl.searchParams.get('to') ?? 'nubesmcgee@gmail.com'

  await resend.emails.send({
    from: 'Sigurado <hello@sigurado.xyz>',
    to,
    subject: "Most of this month's patients won't come back",
    html: `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111;line-height:1.7">
      <p>Most of the patients you treated this month?</p>
      <p>You'll never see them again.</p>
      <p>It's the most expensive problem in dentistry. And almost no one fixes it.</p>
      <p>You spend to get them in the door once.<br/>Then you just… hope.</p>
      <p>Here's the fix — and it's already in your PRO plan.</p>
      <p><strong>The loyalty card.</strong></p>
      <p>Watch what happens when a patient buys one:</p>
      <p>They've prepaid to come back.<br/>Nobody buys a card and uses it once. They return to get their money's worth.<br/>You just turned a one-timer into a regular.</p>
      <p>And a regular isn't worth one cleaning.<br/>They're worth every visit for the next 5–10 years. Plus everyone they refer.</p>
      <p>The "discount"? Not a loss.<br/>It's the cheapest patient you'll ever buy — one who comes back on their own, with cash you already collected.</p>
      <p><strong>One card sold today = a patient for life.</strong></p>
      <p>You set the price. You set the tiers. Sigurado tracks the rest.</p>
      <p><a href="https://sigurado.xyz/loyalty" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">Set up loyalty cards →</a></p>
      <p>Sell five this month.<br/>Then look at what your December turns into.</p>
      <p>— Nova, Sigurado</p>
      <hr style="margin-top:40px;border:none;border-top:1px solid #eee"/>
      <p style="font-size:12px;color:#999">Sigurado · sigurado.xyz · For Philippine dental clinics</p>
    </body></html>`,
  })

  return NextResponse.json({ ok: true, sent: to })
}
