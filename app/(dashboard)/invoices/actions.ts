'use server'

import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function getClinicId() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
  if (!user?.clinicId) redirect('/onboarding')
  return user.clinicId
}

export async function getInvoices() {
  const clinicId = await getClinicId()
  const invoices = await prisma.invoice.findMany({
    where: { clinicId },
    orderBy: { transactionDate: 'desc' },
    include: {
      visit: {
        include: { patient: true },
      },
    },
  })
  return invoices.map((inv) => ({
    id: inv.id,
    orNumber: inv.orNumber,
    patientName: inv.visit?.patient
      ? `${inv.visit.patient.firstName} ${inv.visit.patient.lastName}`
      : inv.buyerName ?? 'Unknown',
    transactionDate: inv.transactionDate.toISOString(),
    serviceDescription: inv.serviceDescription,
    grossAmount: Number(inv.grossAmount),
    paymentMethod: inv.paymentMethod,
    status: inv.status,
  }))
}

export async function getInvoice(id: string) {
  const clinicId = await getClinicId()
  const inv = await prisma.invoice.findFirst({
    where: { id, clinicId },
    include: {
      visit: { include: { patient: true } },
      clinic: true,
    },
  })
  if (!inv) return null

  const usage = inv.loyaltyCardId
    ? await prisma.loyaltyCardUsage.findFirst({
        where: { invoiceId: id },
        include: { loyaltyCard: true },
      })
    : null

  return {
    id: inv.id,
    orNumber: inv.orNumber,
    status: inv.status,
    transactionDate: inv.transactionDate.toISOString(),
    serviceDescription: inv.serviceDescription,
    toothNumber: inv.visit?.toothNumber ?? null,
    grossAmount: Number(inv.grossAmount),
    netAmount: Number(inv.netAmount),
    vatAmount: Number(inv.vatAmount),
    discountAmount: Number(inv.discountAmount),
    paymentMethod: inv.paymentMethod,
    notes: inv.notes ?? null,
    loyaltyCardId: inv.loyaltyCardId ?? null,
    loyaltyUsage: usage
      ? {
          cardNumber: usage.loyaltyCard.cardNumber,
          discountPct: Number(usage.discountPct),
          discountAmount: Number(usage.discountAmount),
        }
      : null,
    patient: inv.visit?.patient
      ? {
          id: inv.visit.patient.id,
          firstName: inv.visit.patient.firstName,
          lastName: inv.visit.patient.lastName,
          address: inv.visit.patient.address,
          email: inv.visit.patient.email ?? null,
        }
      : null,
    clinic: {
      name: inv.clinic.name,
      street: inv.clinic.street,
      city: inv.clinic.city,
      province: inv.clinic.province,
      zip: inv.clinic.zip,
      tin: inv.clinic.tin,
    },
    sellerName: inv.sellerName,
    sellerAddress: inv.sellerAddress,
    sellerTin: inv.sellerTin,
    buyerName: inv.buyerName ?? null,
    buyerAddress: inv.buyerAddress ?? null,
  }
}

export async function voidInvoice(id: string) {
  const clinicId = await getClinicId()
  const inv = await prisma.invoice.findFirst({ where: { id, clinicId } })
  if (!inv) throw new Error('Invoice not found')
  if (inv.status === 'VOID') throw new Error('Already voided')
  await prisma.invoice.update({ where: { id }, data: { status: 'VOID' } })
  revalidatePath(`/invoices/${id}`)
  revalidatePath('/invoices')
}
