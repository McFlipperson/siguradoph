import { getInvoices } from './actions'
import InvoiceListClient from './InvoiceListClient'

export const dynamic = 'force-dynamic'

export default async function InvoicesPage() {
  const invoices = await getInvoices()
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Receipts</h1>
      <InvoiceListClient invoices={invoices} />
    </div>
  )
}
