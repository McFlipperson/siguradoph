import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CpaClinicsPage() {
  const user = await getSessionUser()
  if (!user || user.role !== 'CPA') redirect('/')

  const assignments = await prisma.cpaClinicAssignment.findMany({
    where: { cpaUserId: user.id },
    include: {
      clinic: {
        include: {
          invoices: {
            where: { status: 'ISSUED' },
            select: { grossAmount: true, vatAmount: true, transactionDate: true },
          },
        },
      },
    },
    orderBy: { assignedAt: 'desc' },
  })

  const now = new Date()
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">My Clinics</h1>
        <p className="text-muted-foreground text-sm mt-1">{assignments.length} clinic{assignments.length !== 1 ? 's' : ''} assigned</p>
      </div>

      <div className="grid gap-4">
        {assignments.length === 0 && (
          <p className="text-muted-foreground text-sm">No clinics assigned yet.</p>
        )}
        {assignments.map(({ clinic }) => {
          const qInvoices = clinic.invoices.filter(
            (inv) => new Date(inv.transactionDate) >= quarterStart
          )
          const qGross = qInvoices.reduce((s, i) => s + Number(i.grossAmount), 0)
          const qVat = qInvoices.reduce((s, i) => s + Number(i.vatAmount), 0)

          const address = `${clinic.street}, ${clinic.city}, ${clinic.province}`

          return (
            <div key={clinic.id} className="bg-white rounded-xl border p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-lg">{clinic.name}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{address}</p>
                  <div className="flex gap-4 mt-3 text-sm">
                    <span><span className="text-muted-foreground">TIN: </span>{clinic.tin}</span>
                    <span><span className="text-muted-foreground">VAT: </span>{clinic.vatRegistered ? 'Registered' : 'Non-VAT'}</span>
                  </div>
                  <div className="flex gap-6 mt-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">This Quarter — Gross Sales</p>
                      <p className="font-semibold">₱{qGross.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Output VAT</p>
                      <p className="font-semibold">₱{qVat.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/cpa/clinics/${clinic.id}`}
                  className="shrink-0 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  View Reports
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
