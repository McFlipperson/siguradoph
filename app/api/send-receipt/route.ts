import { NextRequest, NextResponse } from 'next/server'
import { sendReceiptEmail, type ReceiptEmailData } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ReceiptEmailData
    await sendReceiptEmail(body)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
