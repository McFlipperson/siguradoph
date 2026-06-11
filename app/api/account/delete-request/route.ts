import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { sendDeletionConfirmation } from '@/lib/promo-emails'

export async function POST() {
  try {
    const user = await getSessionUser()
    if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'CLINIC_OWNER') return NextResponse.json({ error: 'Only the clinic owner can request deletion.' }, { status: 403 })

    const clinic = await prisma.clinic.findUnique({
      where: { id: user.clinicId },
      select: { id: true, name: true, email: true, deletionRequestedAt: true },
    })
    if (!clinic) return NextResponse.json({ error: 'Clinic not found.' }, { status: 404 })

    if (clinic.deletionRequestedAt) {
      return NextResponse.json({ error: 'Deletion already requested.' }, { status: 400 })
    }

    const deletionDate = new Date()
    deletionDate.setDate(deletionDate.getDate() + 30)

    await prisma.clinic.update({
      where: { id: clinic.id },
      data: { deletionRequestedAt: new Date() },
    })

    if (clinic.email) {
      await sendDeletionConfirmation(clinic.email, clinic.name, deletionDate)
    }

    return NextResponse.json({ ok: true, deletionDate: deletionDate.toISOString() })
  } catch (err) {
    console.error('[account/delete-request]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}

export async function DELETE() {
  // Cancel a pending deletion
  try {
    const user = await getSessionUser()
    if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'CLINIC_OWNER') return NextResponse.json({ error: 'Only the clinic owner can cancel deletion.' }, { status: 403 })

    await prisma.clinic.update({
      where: { id: user.clinicId },
      data: { deletionRequestedAt: null },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[account/delete-request DELETE]', err)
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 })
  }
}
