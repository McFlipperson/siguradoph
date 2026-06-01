import { redirect } from 'next/navigation'
import { getCheckoutData } from './actions'
import CheckoutClient from './CheckoutClient'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: { visitId?: string }
}) {
  const visitId = searchParams.visitId
  if (!visitId) redirect('/patients')

  let data
  try {
    data = await getCheckoutData(visitId)
  } catch {
    redirect('/patients')
  }

  // If visit already has an invoice, redirect to it.
  // getCheckoutData already verified this visit belongs to the caller's clinic.
  const { withClinicDb } = await import('@/lib/clinic-db')
  const existing = await withClinicDb(data.visitData.clinic.id, (tx) =>
    tx.invoice.findUnique({ where: { visitId } })
  )
  if (existing) redirect(`/invoices/${existing.id}`)

  return (
    <div className="max-w-lg mx-auto space-y-2">
      <div className="pb-2">
        <h1 className="text-xl font-bold">Checkout</h1>
        <p className="text-sm text-muted-foreground">{data.visitData.patientName}</p>
      </div>
      <CheckoutClient visitData={data.visitData} />
    </div>
  )
}
