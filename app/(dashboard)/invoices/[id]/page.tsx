import { getInvoice } from '../actions'
import { notFound } from 'next/navigation'
import InvoiceDetailClient from './InvoiceDetailClient'

export const dynamic = 'force-dynamic'

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const invoice = await getInvoice(params.id)
  if (!invoice) notFound()
  return <InvoiceDetailClient invoice={invoice} />
}
