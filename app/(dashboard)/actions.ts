'use server'

import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { startOfDay, endOfDay, startOfYear, endOfYear } from 'date-fns'

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
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
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
      where: { clinicId, visitDate: { gte: todayStart, lte: todayEnd } },
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

  // All visits today — this is the real "who came in today" list regardless
  // of when the patient was enrolled. Includes walk-ins and appointment patients.
  const walkIns = await prisma.visit.findMany({
    where: {
      clinicId,
      visitDate: { gte: todayStart, lte: todayEnd },
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
