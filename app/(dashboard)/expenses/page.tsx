import { getActorDb } from '@/lib/auth'
import ExpensesClient from './ExpensesClient'

export const dynamic = 'force-dynamic'

export default async function ExpensesPage() {
  const { clinicId, db } = await getActorDb()

  const suppliers = await db((tx) => tx.supplier.findMany({
    where: { clinicId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, category: true },
  }))

  return <ExpensesClient initialSuppliers={suppliers} />
}
