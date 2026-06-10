import { NextRequest, NextResponse } from 'next/server'
import { sendReceiptEmail, type ReceiptEmailData } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ReceiptEmailData
    await sendReceiptEmail(body)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[send-receipt] Failed to send receipt email:', err)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
