import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { PLAN_PRICES } from '@/lib/billing-constants'

// Returns a human-readable Manila-time string for the next top-of-hour processing window.
function nextProcessingWindow(): string {
  const now = new Date()
  const next = new Date(now)
  next.setUTCHours(next.getUTCHours() + 1, 0, 0, 0)
  return next.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

// Normalize a Philippine mobile number to the 10-digit form without country code.
// Accepts: 09171234567 → 9171234567, +639171234567 → 9171234567
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('63') && digits.length === 12) return digits.slice(2)
  if (digits.startsWith('0') && digits.length === 11) return digits.slice(1)
  return digits
}

// Match amount within ±₱1.00 tolerance (GCash sometimes shows centavo rounding).
function amountMatches(sentCents: number, expectedCents: number): boolean {
  return Math.abs(sentCents - expectedCents) <= 100
}

export async function POST(req: NextRequest) {
  // Auth — must present BILLING_WEBHOOK_SECRET in x-billing-secret header
  const secret = req.headers.get('x-billing-secret')
  if (!process.env.BILLING_WEBHOOK_SECRET || secret !== process.env.BILLING_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    referenceCode?: string
    senderPhone?: string
    amount?: number        // in pesos, e.g. 499.00
    gcashTxRef?: string
    senderName?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { referenceCode, senderPhone, amount, gcashTxRef, senderName } = body

  if (!amount) {
    return NextResponse.json({ error: 'amount is required' }, { status: 400 })
  }

  const sentCents = Math.round(amount * 100)

  // ── Step 1: Try to find the pending upgrade ──────────────────────────────

  let upgrade = null

  // First try: match by reference code (most precise)
  if (referenceCode) {
    upgrade = await prisma.pendingUpgrade.findFirst({
      where: {
        referenceCode: referenceCode.trim().toUpperCase(),
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: { clinic: { select: { id: true, name: true, email: true, plan: true } } },
    })
  }

  // Second try: match by sender's GCash number (clinic.gcashNumber)
  if (!upgrade && senderPhone) {
    const normalized = normalizePhone(senderPhone)
    const clinics = await prisma.clinic.findMany({
      where: { gcashNumber: { not: null } },
      select: { id: true, gcashNumber: true },
    })

    const matchedClinic = clinics.find(
      (c) => c.gcashNumber && normalizePhone(c.gcashNumber) === normalized,
    )

    if (matchedClinic) {
      // Determine which plan this amount matches
      const plan = sentCents >= 99900 - 100 ? 'PRO' : sentCents >= 49900 - 100 ? 'BASIC' : null

      if (plan) {
        upgrade = await prisma.pendingUpgrade.findFirst({
          where: {
            clinicId: matchedClinic.id,
            plan,
            status: 'PENDING',
            expiresAt: { gt: new Date() },
          },
          include: { clinic: { select: { id: true, name: true, email: true, plan: true } } },
          orderBy: { createdAt: 'desc' },
        })

        // If no pending upgrade exists for this clinic+plan, create one now so we can still upgrade them
        if (!upgrade) {
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          const newUpgrade = await prisma.pendingUpgrade.create({
            data: {
              clinicId: matchedClinic.id,
              plan,
              referenceCode: `AUTO-${Date.now()}`,
              amountCents: PLAN_PRICES[plan],
              expiresAt,
            },
          })
          upgrade = await prisma.pendingUpgrade.findUnique({
            where: { id: newUpgrade.id },
            include: { clinic: { select: { id: true, name: true, email: true, plan: true } } },
          })
        }
      }
    }
  }

  if (!upgrade) {
    return NextResponse.json(
      { error: 'No matching pending upgrade found. Manual review required.', sentCents, referenceCode, senderPhone },
      { status: 404 },
    )
  }

  // ── Step 2: Verify amount ────────────────────────────────────────────────

  if (!amountMatches(sentCents, upgrade.amountCents)) {
    return NextResponse.json(
      {
        error: 'Amount mismatch',
        sentCents,
        expectedCents: upgrade.amountCents,
        clinicId: upgrade.clinicId,
      },
      { status: 422 },
    )
  }

  // ── Step 3: Already confirmed? (idempotency) ─────────────────────────────

  if (upgrade.status === 'CONFIRMED') {
    return NextResponse.json({ ok: true, alreadyConfirmed: true, clinicName: upgrade.clinic.name, plan: upgrade.plan })
  }

  // ── Step 4: Upgrade the clinic (skip if already on this plan via self-report) ──

  const targetPlan = upgrade.plan
  const clinicId = upgrade.clinicId
  const alreadyOnPlan = upgrade.status === 'SELF_REPORTED' // plan was already granted

  await prisma.$transaction([
    // Only update the plan if it wasn't already granted via self-report
    ...(alreadyOnPlan ? [] : [prisma.clinic.update({
      where: { id: clinicId },
      data: { plan: targetPlan },
    })]),
    prisma.pendingUpgrade.update({
      where: { id: upgrade.id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedBy: 'auto',
        gcashTxRef: gcashTxRef ?? null,
        senderName: senderName ?? null,
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorEmail: 'gcash-auto@sigurado.xyz',
        action: 'SET_PLAN',
        targetClinicId: clinicId,
        detail: `${upgrade.clinic.name}: ${upgrade.clinic.plan} → ${targetPlan} (GCash auto — ref: ${upgrade.referenceCode}${gcashTxRef ? `, tx: ${gcashTxRef}` : ''})`,
      },
    }),
  ])

  // ── Step 5: Email the clinic ─────────────────────────────────────────────

  const planLabel = targetPlan === 'BASIC' ? 'Basic (₱499/mo)' : 'Pro (₱999/mo)'
  const clinicEmail = upgrade.clinic.email
  const nextWindow = nextProcessingWindow()

  if (clinicEmail && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'noreply@sigurado.xyz',
        to: clinicEmail,
        subject: `Your Sigurado plan is now active — ${targetPlan}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;">
            <h2 style="color:#16a34a;">🎉 Plan activated!</h2>
            <p>Hi ${upgrade.clinic.name},</p>
            <p>Your Sigurado subscription has been successfully upgraded to the <strong>${planLabel}</strong> plan.</p>
            <p>Your new features are available immediately — log in to get started.</p>
            <p style="margin-top:24px;">
              <a href="https://mine.sigurado.xyz" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                Open Sigurado
              </a>
            </p>
            <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;">
            <p style="font-size:13px;color:#374151;">
              <strong>Next payment processing window:</strong> ${nextWindow}<br>
              <span style="color:#6b7280;font-size:12px;">Payments are processed once per hour. If you renew next month, your plan will be activated within the hour after we receive your GCash payment.</span>
            </p>
            <p style="font-size:12px;color:#6b7280;margin-top:12px;">
              Reference: ${upgrade.referenceCode} ·
              Questions? <a href="mailto:support@sigurado.xyz">support@sigurado.xyz</a>
            </p>
          </div>
        `,
      })
    } catch {
      // Email failure is non-fatal — plan is already upgraded
    }
  }

  return NextResponse.json({
    ok: true,
    clinicName: upgrade.clinic.name,
    plan: targetPlan,
    referenceCode: upgrade.referenceCode,
  })
}
