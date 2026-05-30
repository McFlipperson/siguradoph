'use server'

import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { startOfYear, endOfYear } from 'date-fns'

async function getClinicId() {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')
  const user = await prisma.user.findUnique({
    where: { email: authUser.email! },
    include: { clinic: true },
  })
  if (!user?.clinic) redirect('/onboarding')
  return { clinicId: user.clinic.id, clinic: user.clinic }
}

export async function getDashboardData() {
  const { clinicId, clinic } = await getClinicId()
  const now = new Date()
  // Use PHT (UTC+8) to define "today" — Vercel servers run UTC, so
  // startOfDay(now) would be UTC midnight, not Philippine midnight.
  const PHT_OFFSET = 8 * 60 * 60 * 1000
  const nowPHT = new Date(Date.now() + PHT_OFFSET)
  const dateStrPHT = nowPHT.toISOString().split('T')[0]
  const todayStart = new Date(`${dateStrPHT}T00:00:00+08:00`)
  const todayEnd = new Date(`${dateStrPHT}T23:59:59.999+08:00`)
  const yearStart = startOfYear(now)
  const yearEnd = endOfYear(now)

  const [
    patientsSeen,
    todayRevenue,
    todayAppointments,
    todayPendingPatients,
    todayQueue,
    recentInvoices,
    monthlyRevenue,
  ] = await Promise.all([
    prisma.visit.count({
      where: { clinicId, createdAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.invoice.aggregate({
      where: {
        clinicId,
        status: 'ISSUED',
        transactionDate: { gte: todayStart, lte: todayEnd },
      },
      _sum: { grossAmount: true },
    }),
    prisma.appointment.count({
      where: {
        clinicId,
        scheduledAt: { gte: todayStart, lte: todayEnd },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
    }),
    prisma.patient.findMany({
      where: {
        clinicId,
        enrolledAt: { gte: todayStart, lte: todayEnd },
        visits: { none: { visitDate: { gte: todayStart, lte: todayEnd } } },
      },
    }),
    prisma.appointment.findMany({
      where: {
        clinicId,
        scheduledAt: { gte: todayStart, lte: todayEnd },
      },
      include: { patient: true },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.invoice.findMany({
      where: { clinicId, status: 'ISSUED' },
      orderBy: { transactionDate: 'desc' },
      take: 5,
      include: { visit: { include: { patient: true } } },
    }),
    prisma.invoice.findMany({
      where: {
        clinicId,
        status: 'ISSUED',
        transactionDate: { gte: yearStart, lte: yearEnd },
      },
      select: { transactionDate: true, grossAmount: true },
    }),
  ])

  // All visits created today. Using createdAt (wall-clock server time) instead
  // of visitDate (a date string stored as UTC midnight) avoids timezone
  // mismatch between how the date is saved and how todayStart/todayEnd are computed.
  const walkIns = await prisma.visit.findMany({
    where: {
      clinicId,
      createdAt: { gte: todayStart, lte: todayEnd },
    },
    include: { patient: true },
    orderBy: { createdAt: 'asc' },
  })

  const byMonth: number[] = Array(12).fill(0)
  for (const inv of monthlyRevenue) {
    const month = new Date(inv.transactionDate).getMonth()
    byMonth[month] += Number(inv.grossAmount)
  }

  const pendingCount = todayPendingPatients.length

  return {
    clinicName: clinic.name,
    logoUrl: clinic.logoUrl ?? null,
    stats: {
      patientsSeen,
      todayRevenue: Number(todayRevenue._sum.grossAmount ?? 0),
      pending: pendingCount,
      appointments: todayAppointments,
    },
    appointments: todayQueue.map((a) => ({
      id: a.id,
      patientId: a.patientId,
      patientName: `${a.patient.firstName} ${a.patient.lastName}`,
      scheduledAt: a.scheduledAt.toISOString(),
      type: a.type,
      status: a.status,
    })),
    walkIns: walkIns.map((v) => ({
      id: v.patient.id,
      name: `${v.patient.firstName} ${v.patient.lastName}`,
      enrolledAt: v.visitDate.toISOString(),
      hasVisit: true,
    })),
    recentInvoices: recentInvoices.map((inv) => ({
      id: inv.id,
      orNumber: inv.orNumber,
      patientName: inv.visit?.patient
        ? `${inv.visit.patient.firstName} ${inv.visit.patient.lastName}`
        : inv.buyerName ?? 'Unknown',
      grossAmount: Number(inv.grossAmount),
      paymentMethod: inv.paymentMethod,
      transactionDate: inv.transactionDate.toISOString(),
    })),
    monthlyRevenue: byMonth,
    currentMonth: now.getMonth(),
  }
}

export async function acceptDPA(): Promise<void> {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')
  const user = await prisma.user.findUnique({
    where: { email: authUser.email! },
    select: { clinicId: true },
  })
  if (!user?.clinicId) return
  await prisma.clinic.update({
    where: { id: user.clinicId },
    data: { tosAcceptedAt: new Date() },
  })
}
