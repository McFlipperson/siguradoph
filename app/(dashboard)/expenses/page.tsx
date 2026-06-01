import { prisma } from '@/lib/prisma'
import { withClinicDb } from '@/lib/clinic-db'
import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import ExpensesClient from './ExpensesClient'

export const dynamic = 'force-dynamic'

export default async function ExpensesPage() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: authUser.email! },
    select: { clinicId: true },
  })
  if (!user?.clinicId) redirect('/onboarding')
  const clinicId = user.clinicId

  const suppliers = await withClinicDb(clinicId, (tx) => tx.supplier.findMany({
    where: { clinicId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, category: true },
  }))

  return <ExpensesClient initialSuppliers={suppliers} />
}
