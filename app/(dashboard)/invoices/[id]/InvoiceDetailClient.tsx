'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, Printer, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { voidInvoice } from '../actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Invoice = {
  id: string
  orNumber: string
  status: string
  transactionDate: string
  serviceDescription: string
  toothNumber: string | null
  grossAmount: number
  netAmount: number
  vatAmount: number
  discountAmount: number
  paymentMethod: string
  notes: string | null
  loyaltyCardId: string | null
  loyaltyUsage: {
    cardNumber: string
    discountPct: number
    discountAmount: number
  } | null
  patient: {
    id: string
    firstName: string
    lastName: string
    address: string
    email: string | null
  } | null
  clinic: {
    name: string
    logoUrl: string | null
    street: string
    city: string
    province: string
    zip: string
    tin: string
  }
  sellerName: string
  sellerAddress: string
  sellerTin: string
  buyerName: string | null
  buyerAddress: string | null
}

type Props = {
  invoice: Invoice
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(n)
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InvoiceDetailClient({ invoice }: Props) {
  const router = useRouter()
  const [voiding, setVoiding] = useState(false)
  const [showVoidConfirm, setShowVoidConfirm] = useState(false)
  const [reprinting, setReprinting] = useState(false)
  const [emailing, setEmailing] = useState(false)

  const patientName = invoice.patient
    ? `${invoice.patient.firstName} ${invoice.patient.lastName}`
    : invoice.buyerName ?? 'Unknown'

  const patientAddress = invoice.patient?.address ?? invoice.buyerAddress ?? ''

  async function handleReprint() {
    setReprinting(true)
    try {
      const { printReceipt } = await import('@/lib/print')
      await printReceipt({
        orNumber: invoice.orNumber,
        transactionDate: invoice.transactionDate,
        netAmount: invoice.netAmount,
        vatAmount: invoice.vatAmount,
        grossAmount: invoice.grossAmount,
        discountAmount: invoice.discountAmount,
        discountLabel: invoice.loyaltyUsage
          ? `Loyalty Card ${invoice.loyaltyUsage.discountPct}% off`
          : undefined,
        paymentMethod: invoice.paymentMethod,
        notes: invoice.notes,
        serviceDescription: invoice.serviceDescription,
        toothNumber: invoice.toothNumber,
        patientFirstName: invoice.patient?.firstName ?? invoice.buyerName ?? '',
        patientLastName: invoice.patient?.lastName ?? '',
        clinicName: invoice.clinic.name,
        clinicLogoUrl: invoice.clinic.logoUrl,
        clinicStreet: invoice.clinic.street,
        clinicCity: invoice.clinic.city,
        clinicProvince: invoice.clinic.province,
        clinicZip: invoice.clinic.zip,
        clinicTin: invoice.clinic.tin,
      })
      toast.success('Receipt printed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Print failed')
    } finally {
      setReprinting(false)
    }
  }

  async function handleEmailReprint() {
    if (!invoice.patient?.email) return
    setEmailing(true)
    try {
      const clinicAddress = `${invoice.clinic.street}, ${invoice.clinic.city}, ${invoice.clinic.province} ${invoice.clinic.zip}`
      const res = await fetch('/api/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: invoice.patient.email,
          clinicName: invoice.clinic.name,
          clinicLogoUrl: invoice.clinic.logoUrl,
          clinicAddress,
          clinicTin: invoice.clinic.tin,
          orNumber: invoice.orNumber,
          transactionDate: invoice.transactionDate,
          patientName,
          serviceDescription: invoice.serviceDescription,
          toothNumber: invoice.toothNumber,
          netAmount: invoice.grossAmount,   // VAT-exempt: net = gross
          vatAmount: 0,
          grossAmount: invoice.grossAmount,
          discountAmount: invoice.discountAmount,
          paymentMethod: invoice.paymentMethod,
          notes: invoice.notes,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Server error ${res.status}`)
      }
      toast.success(`Receipt emailed to ${invoice.patient.email}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setEmailing(false)
    }
  }

  async function handleVoidConfirm() {
    setVoiding(true)
    try {
      await voidInvoice(invoice.id)
      toast.success('Receipt voided')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to void')
    } finally {
      setVoiding(false)
      setShowVoidConfirm(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground active:text-foreground transition-colors min-h-[48px]"
      >
        <ChevronLeft className="w-4 h-4" />
        Receipts
      </button>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Official Receipt</h1>
            <p className="text-3xl font-bold mt-1">OR #{invoice.orNumber}</p>
          </div>
          <span
            className={[
              'text-sm font-semibold px-3 py-1.5 rounded-full mt-1',
              invoice.status === 'ISSUED'
                ? 'bg-green-100 text-green-800'
                : invoice.status === 'VOID'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-700',
            ].join(' ')}
          >
            {invoice.status}
          </span>
        </div>
      </div>

      {/* Clinic Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Clinic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="font-semibold">{invoice.sellerName}</p>
          <p className="text-muted-foreground">{invoice.sellerAddress}</p>
          <p className="text-muted-foreground">TIN: {invoice.sellerTin}</p>
        </CardContent>
      </Card>

      {/* Transaction Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Transaction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span>{fmtDate(invoice.transactionDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Patient</span>
            <span className="font-medium text-right max-w-[60%]">{patientName}</span>
          </div>
          {patientAddress && (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground shrink-0">Address</span>
              <span className="text-right text-xs text-muted-foreground">{patientAddress}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items / Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Service</span>
            <span className="text-right max-w-[65%]">{invoice.serviceDescription}</span>
          </div>
          {invoice.toothNumber && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tooth</span>
              <span>{invoice.toothNumber}</span>
            </div>
          )}
          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Net amount (VAT-ex)</span>
              <span>₱{fmt(invoice.netAmount)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>VAT 12%</span>
              <span>₱{fmt(invoice.vatAmount)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>Before discount</span>
                  <span>₱{fmt(invoice.grossAmount + invoice.discountAmount)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Loyalty Discount</span>
                  <span>-₱{fmt(invoice.discountAmount)}</span>
                </div>
              </>
            )}
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-base">
            <span>TOTAL</span>
            <span>₱{fmt(invoice.grossAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment</span>
            <span
              className={[
                'font-medium px-2 py-0.5 rounded-full text-xs',
                invoice.paymentMethod === 'GCASH'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700',
              ].join(' ')}
            >
              {invoice.paymentMethod}
            </span>
          </div>
          {invoice.notes && (
            <div className="flex justify-between gap-3 pt-1 border-t">
              <span className="text-muted-foreground shrink-0">Notes</span>
              <span className="text-right text-xs">{invoice.notes}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loyalty Card Info */}
      {invoice.loyaltyUsage && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Loyalty Card Used</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Card #</span>
              <span className="font-medium">{invoice.loyaltyUsage.cardNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>{invoice.loyaltyUsage.discountPct}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount saved</span>
              <span className="text-green-700 font-medium">₱{fmt(invoice.loyaltyUsage.discountAmount)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions — only if ISSUED */}
      {invoice.status === 'ISSUED' && (
        <div className="space-y-3">
          {/* Reprint */}
          <Button
            variant="outline"
            className="w-full min-h-[56px] gap-2"
            onClick={handleReprint}
            disabled={reprinting}
          >
            <Printer className="w-4 h-4" />
            {reprinting ? 'Printing…' : 'Reprint Receipt'}
          </Button>

          {/* Email option */}
          {invoice.patient?.email && (
            <Button
              variant="ghost"
              className="w-full min-h-[48px] gap-2 text-muted-foreground"
              onClick={handleEmailReprint}
              disabled={emailing}
            >
              <Mail className="w-4 h-4" />
              {emailing ? 'Sending…' : `Email to ${invoice.patient.email}`}
            </Button>
          )}

          {/* Void */}
          {!showVoidConfirm ? (
            <Button
              variant="outline"
              className="w-full min-h-[56px] border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => setShowVoidConfirm(true)}
            >
              Void Receipt
            </Button>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-4">
              <p className="text-sm text-red-900 font-medium">
                Are you sure you want to void OR No. {invoice.orNumber}? This cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="min-h-[48px]"
                  onClick={() => setShowVoidConfirm(false)}
                  disabled={voiding}
                >
                  Cancel
                </Button>
                <Button
                  className="min-h-[48px] bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleVoidConfirm}
                  disabled={voiding}
                >
                  {voiding ? 'Voiding…' : 'Confirm Void'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
