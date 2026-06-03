'use server'

import { prisma } from '@/lib/prisma'
import { getActor } from '@/lib/auth'
import { PLAN_PRICES } from '@/lib/billing-constants'
import { Resend } from 'resend'

const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateRefCode(plan: 'BASIC' | 'PRO'): string {
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)]
  }
  return `SIG-${plan === 'BASIC' ? 'BSC' : 'PRO'}-${suffix}`
}

/**
 * Returns an existing non-expired PENDING or SELF_REPORTED upgrade for this
 * clinic+plan, or creates a fresh PENDING one. Called when the payment panel opens.
 */
export async function getOrCreatePendingUpgrade(
  plan: 'BASIC' | 'PRO',
): Promise<{ referenceCode: string; amountCents: number; expiresAt: string }> {
  const { clinicId } = await getActor()

  const existing = await prisma.pendingUpgrade.findFirst({
    where: {
      clinicId,
      plan,
      status: { in: ['PENDING', 'SELF_REPORTED'] },
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (existing) {
    return {
      referenceCode: existing.referenceCode,
      amountCents: existing.amountCents,
      expiresAt: existing.expiresAt.toISOString(),
    }
  }

  let referenceCode = generateRefCode(plan)
  let attempts = 0
  while (attempts < 5) {
    const clash = await prisma.pendingUpgrade.findUnique({ where: { referenceCode } })
    if (!clash) break
    referenceCode = generateRefCode(plan)
    attempts++
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const upgrade = await prisma.pendingUpgrade.create({
    data: { clinicId, plan, referenceCode, amountCents: PLAN_PRICES[plan], expiresAt },
  })

  return {
    referenceCode: upgrade.referenceCode,
    amountCents: upgrade.amountCents,
    expiresAt: upgrade.expiresAt.toISOString(),
  }
}

/**
 * Called when clinic taps "I've paid". Grants access immediately (honor system)
 * and marks the upgrade SELF_REPORTED so the Gmail agent can verify later.
 */
export async function selfReportPayment(
  plan: 'BASIC' | 'PRO',
): Promise<{ ok: boolean; error?: string }> {
  const { clinicId, userEmail } = await getActor()

  try {
    // Get or create the pending upgrade record
    const existing = await prisma.pendingUpgrade.findFirst({
      where: {
        clinicId,
        plan,
        status: { in: ['PENDING', 'SELF_REPORTED'] },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    let upgradeId: string
    let referenceCode: string

    if (existing) {
      upgradeId = existing.id
      referenceCode = existing.referenceCode
    } else {
      // Create one on the fly (e.g. renewal — clinic already on that plan)
      let code = generateRefCode(plan)
      let attempts = 0
      while (attempts < 5) {
        const clash = await prisma.pendingUpgrade.findUnique({ where: { referenceCode: code } })
        if (!clash) break
        code = generateRefCode(plan)
        attempts++
      }
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const created = await prisma.pendingUpgrade.create({
        data: { clinicId, plan, referenceCode: code, amountCents: PLAN_PRICES[plan], expiresAt },
      })
      upgradeId = created.id
      referenceCode = created.referenceCode
    }

    const now = new Date()

    // Grant access + mark self-reported in a transaction
    const [, clinic] = await prisma.$transaction([
      prisma.pendingUpgrade.update({
        where: { id: upgradeId },
        data: { status: 'SELF_REPORTED', selfReportedAt: now },
      }),
      prisma.clinic.update({
        where: { id: clinicId },
        data: { plan },
        select: { name: true, email: true },
      }),
      prisma.adminAuditLog.create({
        data: {
          actorEmail: userEmail,
          action: 'SET_PLAN',
          targetClinicId: clinicId,
          detail: `Self-reported payment — ${plan} plan (ref: ${referenceCode}) · awaiting GCash verification`,
        },
      }),
    ])

    // Send confirmation email
    if (clinic.email && process.env.RESEND_API_KEY) {
      const planLabel = plan === 'BASIC' ? 'Basic (₱499/mo)' : 'Pro (₱999/mo)'
      const nextHour = new Date(now)
      nextHour.setUTCHours(nextHour.getUTCHours() + 1, 0, 0, 0)
      const nextWindow = nextHour.toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        month: 'long', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      })

      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'noreply@sigurado.xyz',
          to: clinic.email,
          subject: `Welcome to Sigurado ${plan === 'BASIC' ? 'Basic' : 'Pro'}! 🎉`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;">
              <h2 style="color:#16a34a;">You're all set!</h2>
              <p>Hi ${clinic.name},</p>
              <p>Thanks for subscribing to the <strong>${planLabel}</strong> plan. Your account is active and all features are available right now.</p>
              <p>We'll verify your GCash payment in the background — no action needed from you.</p>
              <p style="margin-top:24px;">
                <a href="https://mine.sigurado.xyz" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                  Open Sigurado
                </a>
              </p>
              <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;">
              <p style="font-size:13px;color:#374151;">
                <strong>Next payment processing window:</strong> ${nextWindow}<br>
                <span style="color:#6b7280;font-size:12px;">When you renew next month, send the same GCash amount and tap "I've paid" again.</span>
              </p>
              <p style="font-size:12px;color:#6b7280;margin-top:12px;">
                Reference: ${referenceCode} ·
                Questions? <a href="mailto:support@sigurado.xyz">support@sigurado.xyz</a>
              </p>
            </div>
          `,
        })
      } catch {
        // Non-fatal
      }
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Something went wrong' }
  }
}
