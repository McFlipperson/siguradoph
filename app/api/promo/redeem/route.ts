import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { sendPromoWelcome } from '@/lib/promo-emails'

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'CLINIC_OWNER') return NextResponse.json({ error: 'Only the clinic owner can redeem a promo code.' }, { status: 403 })

    const { code } = await req.json() as { code?: string }
    if (!code?.trim()) return NextResponse.json({ error: 'Enter a promo code.' }, { status: 400 })

    const validCode = process.env.PROMO_CODE
    if (!validCode || code.trim() !== validCode) {
      return NextResponse.json({ error: 'Invalid promo code.' }, { status: 400 })
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: user.clinicId },
      select: { id: true, plan: true, promoCode: true, email: true, name: true },
    })
    if (!clinic) return NextResponse.json({ error: 'Clinic not found.' }, { status: 404 })

    if (clinic.promoCode) {
      return NextResponse.json({ error: 'A promo code has already been redeemed for this clinic.' }, { status: 400 })
    }

    const promoExpiresAt = new Date()
    promoExpiresAt.setMonth(promoExpiresAt.getMonth() + 3)

    await prisma.clinic.update({
      where: { id: clinic.id },
      data: {
        plan: 'PRO',
        promoCode: code.trim(),
        promoExpiresAt,
      },
    })

    // Schedule drip emails as PromoEmail records
    const now = new Date()
    function daysFromNow(d: number) {
      const dt = new Date(now)
      dt.setDate(dt.getDate() + d)
      dt.setHours(9, 0, 0, 0) // 9am Manila
      return dt
    }

    await prisma.promoEmail.createMany({
      data: [
        { clinicId: clinic.id, emailType: 'DAY_5',    scheduledFor: daysFromNow(5) },
        { clinicId: clinic.id, emailType: 'DAY_10',   scheduledFor: daysFromNow(10) },
        { clinicId: clinic.id, emailType: 'EXPIRY_7', scheduledFor: new Date(promoExpiresAt.getTime() - 7 * 24 * 60 * 60 * 1000) },
        { clinicId: clinic.id, emailType: 'EXPIRY_3', scheduledFor: new Date(promoExpiresAt.getTime() - 3 * 24 * 60 * 60 * 1000) },
        { clinicId: clinic.id, emailType: 'EXPIRY_0', scheduledFor: new Date(promoExpiresAt) },
      ],
    })

    // Day 1 welcome email fires immediately
    if (clinic.email) {
      await sendPromoWelcome(clinic.email, clinic.name, promoExpiresAt)
    }

    return NextResponse.json({ ok: true, promoExpiresAt: promoExpiresAt.toISOString() })
  } catch (err) {
    console.error('[promo/redeem]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
