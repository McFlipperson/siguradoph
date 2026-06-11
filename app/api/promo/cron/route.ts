import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withClinicDb } from '@/lib/clinic-db'
import {
  sendPromoDay5,
  sendPromoDay10,
  sendPromoExpiry7Days,
  sendPromoExpiry3Days,
  sendPromoExpiredToday,
} from '@/lib/promo-emails'

const FREE_PATIENT_LIMIT = 30

async function sendSmsNudge(phone: string, clinicName: string) {
  const apiKey = process.env.SEMAPHORE_API_KEY
  if (!apiKey || !phone) return
  const normalized = phone.replace(/\D/g, '').replace(/^0/, '63').replace(/^(\d{10})$/, '63$1')
  const message = `SIGURADO: Hi ${clinicName}! Your PRO trial ends in 3 days. Upgrade at sigurado.xyz/billing to keep unlimited patients and all features.`
  try {
    const res = await fetch('https://api.semaphore.co/api/v4/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apikey: apiKey, number: normalized, message, sendername: 'SIGURADO' }),
    })
    if (!res.ok) console.error('[promo-cron] SMS failed', await res.text())
  } catch (err) {
    console.error('[promo-cron] SMS error', err)
  }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results = { downgraded: 0, emailsSent: 0, smsSent: 0, deletionsWiped: 0 }

  // ── 1. Downgrade expired promos ──────────────────────────────────────────────
  const expired = await prisma.clinic.findMany({
    where: {
      promoExpiresAt: { lte: now },
      plan: 'PRO',
      promoCode: { not: null },
    },
    select: { id: true, email: true, name: true, phone: true },
  })

  for (const clinic of expired) {
    // Keep oldest 30 patients, archive the rest
    const allPatients = await withClinicDb(clinic.id, (tx) =>
      tx.patient.findMany({
        where: { clinicId: clinic.id, archived: false },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      })
    )

    const keepIds = allPatients.slice(0, FREE_PATIENT_LIMIT).map((p) => p.id)
    const archiveIds = allPatients.slice(FREE_PATIENT_LIMIT).map((p) => p.id)

    if (archiveIds.length > 0) {
      await withClinicDb(clinic.id, (tx) =>
        tx.patient.updateMany({
          where: { id: { in: archiveIds } },
          data: { archived: true },
        })
      )
    }

    await prisma.clinic.update({
      where: { id: clinic.id },
      data: { plan: 'FREE' },
    })

    if (clinic.email) {
      await sendPromoExpiredToday(clinic.email, clinic.name, keepIds.length, archiveIds.length)
      results.emailsSent++
    }

    results.downgraded++
  }

  // ── 2. Send scheduled drip emails ────────────────────────────────────────────
  const dueEmails = await prisma.promoEmail.findMany({
    where: { status: 'PENDING', scheduledFor: { lte: now } },
    include: { clinic: { select: { email: true, name: true, phone: true, promoExpiresAt: true, plan: true } } },
  })

  for (const item of dueEmails) {
    const { clinic, emailType } = item
    try {
      if (!clinic.email) continue

      if (emailType === 'DAY_5') {
        await sendPromoDay5(clinic.email, clinic.name)
      } else if (emailType === 'DAY_10') {
        await sendPromoDay10(clinic.email, clinic.name)
      } else if (emailType === 'EXPIRY_7' && clinic.promoExpiresAt) {
        await sendPromoExpiry7Days(clinic.email, clinic.name, clinic.promoExpiresAt)
      } else if (emailType === 'EXPIRY_3' && clinic.promoExpiresAt) {
        await sendPromoExpiry3Days(clinic.email, clinic.name, clinic.promoExpiresAt)
        // SMS nudge at the same time
        if (clinic.phone) {
          await sendSmsNudge(clinic.phone, clinic.name)
          results.smsSent++
        }
      } else if (emailType === 'EXPIRY_0') {
        // Already handled in the expiry block above — just mark done
      }

      await prisma.promoEmail.update({ where: { id: item.id }, data: { status: 'SENT', sentAt: now } })
      results.emailsSent++
    } catch (err) {
      console.error(`[promo-cron] Failed to send ${emailType} for clinic ${clinic.name}:`, err)
      await prisma.promoEmail.update({ where: { id: item.id }, data: { status: 'FAILED' } })
    }
  }

  // ── 3. Unarchive patients when clinic upgrades to paid plan ──────────────────
  // Handled inline in billing upgrade flow — see app/api/billing/upgrade/route.ts

  // ── 4. Account deletion wipe (30-day window elapsed) ─────────────────────────
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const pendingDeletions = await prisma.clinic.findMany({
    where: { deletionRequestedAt: { lte: thirtyDaysAgo } },
    include: { users: { select: { id: true, email: true } } },
  })

  for (const clinic of pendingDeletions) {
    const ownerEmail = clinic.users[0]?.email
    try {
      // Delete all tenant data — order matters for FK constraints
      await withClinicDb(clinic.id, async (tx) => {
        await tx.scheduledReminder.deleteMany({ where: { clinicId: clinic.id } })
        await tx.loyaltyCard.deleteMany({ where: { clinicId: clinic.id } })
        await tx.loyaltyCardTemplate.deleteMany({ where: { clinicId: clinic.id } })
        await tx.invoice.deleteMany({ where: { clinicId: clinic.id } })
        await tx.visit.deleteMany({ where: { clinicId: clinic.id } })
        await tx.patient.deleteMany({ where: { clinicId: clinic.id } })
        await tx.appointment.deleteMany({ where: { clinicId: clinic.id } })
        await tx.expense.deleteMany({ where: { clinicId: clinic.id } })
        await tx.recurringExpense.deleteMany({ where: { clinicId: clinic.id } })
        await tx.employee.deleteMany({ where: { clinicId: clinic.id } })
        await tx.supplier.deleteMany({ where: { clinicId: clinic.id } })
        await tx.equipment.deleteMany({ where: { clinicId: clinic.id } })
        await tx.serviceCatalog.deleteMany({ where: { clinicId: clinic.id } })
        await tx.cpaClinicAssignment.deleteMany({ where: { clinicId: clinic.id } })
        await tx.pendingUpgrade.deleteMany({ where: { clinicId: clinic.id } })
        await tx.promoEmail.deleteMany({ where: { clinicId: clinic.id } })
        await tx.quarterlyReportLog.deleteMany({ where: { clinicId: clinic.id } })
        await tx.thirteenthMonthRecord.deleteMany({ where: { clinicId: clinic.id } })
        await tx.recallRule.deleteMany({ where: { clinicId: clinic.id } })
        await tx.incidentLog.deleteMany({ where: { clinicId: clinic.id } })
        await tx.adminAuditLog.deleteMany({ where: { targetClinicId: clinic.id } })
        await tx.unlinkedMessenger.deleteMany({ where: { clinicId: clinic.id } })
        await tx.pendingMessengerLink.deleteMany({ where: { clinicId: clinic.id } })
        await tx.scPwdAuditLog.deleteMany({ where: { clinicId: clinic.id } })
      })

      // Delete users then clinic
      await prisma.user.deleteMany({ where: { clinicId: clinic.id } })
      await prisma.clinic.delete({ where: { id: clinic.id } })

      results.deletionsWiped++

      // Final confirmation email
      if (ownerEmail) {
        const { sendDeletionComplete } = await import('@/lib/promo-emails')
        await sendDeletionComplete(ownerEmail, clinic.name)
      }
    } catch (err) {
      console.error(`[promo-cron] Deletion wipe failed for clinic ${clinic.id}:`, err)
    }
  }

  return NextResponse.json({ ok: true, ...results })
}
