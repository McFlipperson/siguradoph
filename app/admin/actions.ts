'use server'

import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { isAdminEmail } from '@/lib/admin'
import { revalidatePath } from 'next/cache'
import type { Plan } from '@/lib/entitlements'
import { Resend } from 'resend'

/** Set a clinic's subscription plan. Sigurado-admin only. */
export async function setClinicPlan(clinicId: string, plan: Plan): Promise<void> {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!isAdminEmail(authUser?.email)) throw new Error('Forbidden')

  if (!['FREE', 'BASIC', 'PRO'].includes(plan)) throw new Error('Invalid plan')

  const before = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { name: true, plan: true },
  })
  if (!before) throw new Error('Clinic not found')
  if (before.plan === plan) return // no-op, don't log

  await prisma.clinic.update({ where: { id: clinicId }, data: { plan } })

  // Tamper-evident record of who changed what, when.
  await prisma.adminAuditLog.create({
    data: {
      actorEmail: authUser!.email!,
      action: 'SET_PLAN',
      targetClinicId: clinicId,
      detail: `${before.name}: ${before.plan} → ${plan}`,
    },
  })

  revalidatePath('/admin')
}

/** Revert a clinic to FREE and mark the pending upgrade as EXPIRED. */
export async function downgradeClinic(upgradeId: string): Promise<void> {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!isAdminEmail(authUser?.email)) throw new Error('Forbidden')

  const upgrade = await prisma.pendingUpgrade.findUnique({
    where: { id: upgradeId },
    include: { clinic: { select: { id: true, name: true, plan: true } } },
  })
  if (!upgrade) throw new Error('Upgrade not found')

  await prisma.$transaction([
    prisma.clinic.update({ where: { id: upgrade.clinicId }, data: { plan: 'FREE' } }),
    prisma.pendingUpgrade.update({ where: { id: upgradeId }, data: { status: 'EXPIRED' } }),
    prisma.adminAuditLog.create({
      data: {
        actorEmail: authUser!.email!,
        action: 'SET_PLAN',
        targetClinicId: upgrade.clinicId,
        detail: `${upgrade.clinic.name}: ${upgrade.clinic.plan} → FREE (downgraded — unverified payment, ref: ${upgrade.referenceCode})`,
      },
    }),
  ])

  revalidatePath('/admin')
}

/** Manually confirm a pending upgrade (admin fallback when GCash note was missing). */
export async function confirmPendingUpgrade(upgradeId: string): Promise<void> {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!isAdminEmail(authUser?.email)) throw new Error('Forbidden')

  const upgrade = await prisma.pendingUpgrade.findUnique({
    where: { id: upgradeId },
    include: { clinic: { select: { id: true, name: true, email: true, plan: true } } },
  })
  if (!upgrade) throw new Error('Upgrade not found')
  if (upgrade.status === 'CONFIRMED') return // idempotent

  const targetPlan = upgrade.plan

  await prisma.$transaction([
    prisma.clinic.update({
      where: { id: upgrade.clinicId },
      data: { plan: targetPlan },
    }),
    prisma.pendingUpgrade.update({
      where: { id: upgradeId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedBy: authUser!.email!,
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorEmail: authUser!.email!,
        action: 'SET_PLAN',
        targetClinicId: upgrade.clinicId,
        detail: `${upgrade.clinic.name}: ${upgrade.clinic.plan} → ${targetPlan} (manual confirm — ref: ${upgrade.referenceCode})`,
      },
    }),
  ])

  // Email the clinic
  const planLabel = targetPlan === 'BASIC' ? 'Basic (₱499/mo)' : 'Pro (₱999/mo)'
  const now = new Date()
  const nextHour = new Date(now)
  nextHour.setUTCHours(nextHour.getUTCHours() + 1, 0, 0, 0)
  const nextWindow = nextHour.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })

  if (upgrade.clinic.email && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'noreply@sigurado.xyz',
        to: upgrade.clinic.email,
        subject: `Your Sigurado plan is now active — ${targetPlan}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;">
            <h2 style="color:#16a34a;">🎉 Plan activated!</h2>
            <p>Hi ${upgrade.clinic.name},</p>
            <p>Your Sigurado subscription has been upgraded to the <strong>${planLabel}</strong> plan.</p>
            <p>Your new features are available immediately.</p>
            <p style="margin-top:24px;">
              <a href="https://sigurado.xyz" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
                Open Sigurado
              </a>
            </p>
            <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;">
            <p style="font-size:13px;color:#374151;">
              <strong>Next payment processing window:</strong> ${nextWindow}<br>
              <span style="color:#6b7280;font-size:12px;">Payments are processed once per hour. If you renew next month, your plan will be activated within the hour after we receive your GCash payment.</span>
            </p>
            <p style="font-size:12px;color:#6b7280;margin-top:12px;">
              Reference: ${upgrade.referenceCode}
            </p>
          </div>
        `,
      })
    } catch {
      // Non-fatal
    }
  }

  revalidatePath('/admin')
}
