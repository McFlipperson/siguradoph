'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, Printer, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { confirmPayment, type CheckoutVisitData, type CheckoutLoyaltyCard } from './actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = {
  visitData: CheckoutVisitData
  loyaltyCard: CheckoutLoyaltyCard | null
  serviceCategory: string
}

type PrinterInfo = {
  type: 'bluetooth' | 'serial'
  name: string
} | null

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(n)
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Returns the available discount % for a given service category + loyalty card. */
function getAvailableDiscount(
  category: string,
  card: CheckoutLoyaltyCard | null
): { pct: number; isCheckup: boolean } {
  if (!card) return { pct: 0, isCheckup: false }

  switch (category) {
    case 'CHECKUP':
      return { pct: 100, isCheckup: true }
    case 'CLEANING':
      if (card.cleaningUses50 > 0) return { pct: 50, isCheckup: false }
      if (card.cleaningUses25 > 0) return { pct: 25, isCheckup: false }
      return { pct: 0, isCheckup: false }
    case 'FILLING':
      if (card.fillingUses50 > 0) return { pct: 50, isCheckup: false }
      if (card.fillingUses25 > 0) return { pct: 25, isCheckup: false }
      return { pct: 0, isCheckup: false }
    case 'RCT':
      return { pct: card.rctUses > 0 ? 10 : 0, isCheckup: false }
    case 'DENTURES':
      return { pct: card.dentureUses > 0 ? 15 : 0, isCheckup: false }
    case 'BRACES':
      return { pct: card.bracesUses > 0 ? 10 : 0, isCheckup: false }
    case 'EXTRACTION':
      return { pct: card.extractionUses > 0 ? 20 : 0, isCheckup: false }
    case 'WISDOM_TOOTH':
      return { pct: card.wisdomToothUses > 0 ? 10 : 0, isCheckup: false }
    default:
      return { pct: 0, isCheckup: false }
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CheckoutClient({ visitData, loyaltyCard, serviceCategory }: Props) {
  const router = useRouter()
  const LOYALTY_CARD_PRICE = 500

  // Discount logic
  const { pct: availablePct, isCheckup } = getAvailableDiscount(serviceCategory, loyaltyCard)
  const canApplyDiscount = availablePct > 0 && !!loyaltyCard

  // Pending loyalty card renewal: auto-enable purchase if no current card
  const hasPendingRenewal = visitData.pendingLoyaltyCardPurchase && !loyaltyCard

  // Form state
  const [applyDiscount, setApplyDiscount] = useState(canApplyDiscount)
  const [purchaseCard, setPurchaseCard] = useState(hasPendingRenewal)
  const [notes, setNotes] = useState('')
  const [sendEmail, setSendEmail] = useState(!!visitData.patientEmail)
  const [emailInput, setEmailInput] = useState(visitData.patientEmail ?? '')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'GCASH' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Printer state
  const [printer, setPrinter] = useState<PrinterInfo>(null)
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null)
  const [serialPort, setSerialPort] = useState<SerialPort | null>(null)

  // Confirmation state
  const [confirmed, setConfirmed] = useState(false)
  const [result, setResult] = useState<{
    invoiceId: string
    orNumber: string
    totalAmount: number
    newLoyaltyCardId?: string
  } | null>(null)

  // Read printer from localStorage on mount
  useEffect(() => {
    const type = localStorage.getItem('printer_type') as 'bluetooth' | 'serial' | null
    const name = localStorage.getItem('printer_name')
    if (type && name) setPrinter({ type, name })
  }, [])

  // Price calculations
  const gross = visitData.grossAmount
  const discountedGross = (() => {
    if (!applyDiscount) return gross
    if (isCheckup) return 0
    return Math.round(gross * (1 - availablePct / 100) * 100) / 100
  })()
  const loyaltyCardTotal = purchaseCard ? LOYALTY_CARD_PRICE : 0
  const combinedGross = discountedGross + loyaltyCardTotal

  const treatmentNet = Math.round((discountedGross / 1.12) * 100) / 100
  const treatmentVat = Math.round((discountedGross - treatmentNet) * 100) / 100
  const cardNet = purchaseCard ? Math.round((LOYALTY_CARD_PRICE / 1.12) * 100) / 100 : 0
  const cardVat = purchaseCard ? Math.round((LOYALTY_CARD_PRICE - cardNet) * 100) / 100 : 0
  const totalNet = Math.round((treatmentNet + cardNet) * 100) / 100
  const totalVat = Math.round((treatmentVat + cardVat) * 100) / 100
  const discountAmount =
    applyDiscount && availablePct > 0
      ? Math.round((gross - discountedGross) * 100) / 100
      : 0

  // Printer reconnect
  const handleReconnectBluetooth = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) return
    try {
      const device = await (navigator as Navigator & { bluetooth: { requestDevice: (o: object) => Promise<BluetoothDevice> } }).bluetooth.requestDevice({ acceptAllDevices: true })
      setBluetoothDevice(device)
      toast.success(`Connected to ${device.name ?? 'printer'}`)
    } catch {
      toast.error('Could not connect to Bluetooth printer')
    }
  }, [])

  const handleReconnectSerial = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('serial' in navigator)) return
    try {
      const port = await (navigator as Navigator & { serial: { requestPort: () => Promise<SerialPort> } }).serial.requestPort()
      setSerialPort(port)
      toast.success('Connected to serial printer')
    } catch {
      toast.error('Could not connect to serial printer')
    }
  }, [])

  // Print logic
  async function doPrint(bytes: Uint8Array) {
    const { printViaBluetooth, printViaSerial } = await import('@/lib/thermal')
    if (printer?.type === 'bluetooth') {
      const device = bluetoothDevice
      if (!device) throw new Error('Bluetooth device not connected. Use Reconnect.')
      await printViaBluetooth(device, bytes)
    } else if (printer?.type === 'serial') {
      const port = serialPort
      if (!port) throw new Error('Serial port not connected. Use Reconnect.')
      await printViaSerial(port, bytes)
    }
  }

  // Handle confirm
  async function handleConfirm() {
    if (!paymentMethod) return
    setLoading(true)
    setError(null)

    try {
      const res = await confirmPayment({
        visitId: visitData.id,
        paymentMethod,
        applyLoyaltyDiscount: applyDiscount,
        discountPct: isCheckup ? 100 : availablePct,
        loyaltyCardId: loyaltyCard?.id ?? null,
        purchaseNewLoyaltyCard: purchaseCard,
        notes: notes.trim() || undefined,
        emailRecipient: sendEmail ? emailInput.trim() : undefined,
      })

      setResult(res)
      setConfirmed(true)

      // Fire-and-forget email
      const emailAddress = sendEmail ? emailInput.trim() : ''
      if (emailAddress) {
        const clinicAddress = `${visitData.clinic.street}, ${visitData.clinic.city}, ${visitData.clinic.province} ${visitData.clinic.zip}`
        const discountLabel =
          applyDiscount && availablePct > 0
            ? isCheckup
              ? 'Loyalty Card — Free Check-up'
              : `Loyalty Card ${availablePct}% off`
            : undefined

        fetch('/api/send-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: emailAddress,
            clinicName: visitData.clinic.name,
            clinicAddress,
            clinicTin: visitData.clinic.tin,
            orNumber: res.orNumber,
            transactionDate: new Date().toISOString(),
            patientName: visitData.patientName,
            serviceDescription: visitData.treatment,
            toothNumber: visitData.toothNumber,
            netAmount: totalNet,
            vatAmount: totalVat,
            grossAmount: res.totalAmount,
            discountAmount,
            discountLabel,
            paymentMethod,
            notes: notes.trim() || undefined,
          }),
        }).catch(() => {
          // email failure is silent
        })
      }

      // Print receipt
      if (printer) {
        try {
          const { buildReceiptBytes } = await import('@/lib/thermal')
          const clinicAddress = `${visitData.clinic.street}, ${visitData.clinic.city}, ${visitData.clinic.province} ${visitData.clinic.zip}`
          const bytes = await buildReceiptBytes({
            clinicName: visitData.clinic.name,
            clinicAddress,
            clinicTin: visitData.clinic.tin,
            orNumber: res.orNumber,
            transactionDate: new Date(),
            patientName: visitData.patientName,
            serviceDescription: visitData.treatment,
            toothNumber: visitData.toothNumber,
            netAmount: totalNet,
            vatAmount: totalVat,
            grossAmount: res.totalAmount,
            discountAmount,
            discountLabel: applyDiscount && availablePct > 0 ? (isCheckup ? 'Free Check-up' : `${availablePct}% off`) : undefined,
            paymentMethod,
            notes: notes.trim() || undefined,
          })
          await doPrint(bytes)
        } catch (printErr) {
          toast.error(
            printErr instanceof Error ? printErr.message : 'Print failed'
          )
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment confirmation failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleReprint() {
    if (!result) return
    try {
      const { buildReceiptBytes } = await import('@/lib/thermal')
      const clinicAddress = `${visitData.clinic.street}, ${visitData.clinic.city}, ${visitData.clinic.province} ${visitData.clinic.zip}`
      const bytes = await buildReceiptBytes({
        clinicName: visitData.clinic.name,
        clinicAddress,
        clinicTin: visitData.clinic.tin,
        orNumber: result.orNumber,
        transactionDate: new Date(),
        patientName: visitData.patientName,
        serviceDescription: visitData.treatment,
        toothNumber: visitData.toothNumber,
        netAmount: totalNet,
        vatAmount: totalVat,
        grossAmount: result.totalAmount,
        discountAmount,
        paymentMethod: paymentMethod ?? 'CASH',
        notes: notes.trim() || undefined,
      })
      await doPrint(bytes)
      toast.success('Receipt printed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Print failed')
    }
  }

  // -------------------------------------------------------------------------
  // Confirmation screen
  // -------------------------------------------------------------------------
  if (confirmed && result) {
    return (
      <div className="space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
            <CheckCircle className="text-green-600 w-16 h-16" />
            <div>
              <p className="text-xl font-bold text-green-800">Payment Confirmed</p>
              <p className="text-sm text-green-700 mt-1">OR #{result.orNumber}</p>
            </div>
            <div className="w-full bg-white rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patient</span>
                <span className="font-medium">{visitData.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-base">₱{fmt(result.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium">{paymentMethod}</span>
              </div>
              {result.newLoyaltyCardId && (
                <div className="flex justify-between text-green-700">
                  <span>New loyalty card issued</span>
                  <span>✓</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          {printer && (
            <Button
              variant="outline"
              className="flex-1 min-h-[56px] gap-2"
              onClick={handleReprint}
            >
              <Printer className="w-4 h-4" />
              Reprint Receipt
            </Button>
          )}
          <Button
            className="flex-1 min-h-[56px]"
            onClick={() => router.push('/patients')}
          >
            Next Patient
          </Button>
        </div>

        {/* Reconnect printer if needed */}
        {printer?.type === 'bluetooth' && !bluetoothDevice && (
          <Button variant="outline" className="w-full min-h-[48px]" onClick={handleReconnectBluetooth}>
            Reconnect Printer
          </Button>
        )}
        {printer?.type === 'serial' && !serialPort && (
          <Button variant="outline" className="w-full min-h-[48px]" onClick={handleReconnectSerial}>
            Reconnect Printer
          </Button>
        )}
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Checkout form
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-5">

      {/* Error banner */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* ── Section 1: Visit Summary ────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Visit Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Patient</span>
            <span className="font-medium">{visitData.patientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span>{fmtDate(visitData.visitDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Treatment</span>
            <span className="text-right max-w-[60%]">{visitData.treatment}</span>
          </div>
          {visitData.toothNumber && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tooth</span>
              <span>{visitData.toothNumber}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Diagnosis</span>
            <span className="text-right max-w-[60%]">{visitData.diagnosis}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Amount</span>
            <span>₱{fmt(gross)}</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Loyalty Card ──────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Loyalty Card</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasPendingRenewal && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
              Loyalty card renewal pending for this patient.
            </div>
          )}
          {loyaltyCard ? (
            <>
              <div className="text-sm text-muted-foreground">
                Card #{loyaltyCard.cardNumber} · expires {fmtDate(loyaltyCard.expiryDate)}
              </div>

              {canApplyDiscount ? (
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="applyDiscount" className="flex-1 cursor-pointer">
                    {isCheckup
                      ? 'Apply free check-up (Loyalty Card)'
                      : `Apply ${availablePct}% discount`}
                  </Label>
                  <Switch
                    id="applyDiscount"
                    checked={applyDiscount}
                    onCheckedChange={setApplyDiscount}
                    className="shrink-0"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No discount available for this service category.
                </p>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This patient does not have a loyalty card.
              </p>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="purchaseCard" className="flex-1 cursor-pointer">
                  Purchase loyalty card — ₱{fmt(LOYALTY_CARD_PRICE)}
                </Label>
                <Switch
                  id="purchaseCard"
                  checked={purchaseCard}
                  onCheckedChange={setPurchaseCard}
                  className="shrink-0"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Price Breakdown ──────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Net amount (ex. VAT)</span>
            <span>₱{fmt(treatmentNet)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>VAT (12%)</span>
            <span>₱{fmt(treatmentVat)}</span>
          </div>
          {applyDiscount && discountAmount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Discount ({isCheckup ? 'Free Check-up' : `${availablePct}%`})</span>
              <span>-₱{fmt(discountAmount)}</span>
            </div>
          )}
          {purchaseCard && (
            <div className="flex justify-between text-muted-foreground">
              <span>Loyalty card</span>
              <span>₱{fmt(LOYALTY_CARD_PRICE)}</span>
            </div>
          )}
          <div className="border-t mt-2 pt-2 flex justify-between font-bold text-base">
            <span>Total</span>
            <span>₱{fmt(combinedGross)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Net</span>
            <span>₱{fmt(totalNet)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>VAT</span>
            <span>₱{fmt(totalVat)}</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: Notes ─────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Notes (optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add a note for this receipt…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="resize-none text-sm"
          />
        </CardContent>
      </Card>

      {/* ── Section 4: Email ──────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Email Receipt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="sendEmail" className="flex-1 cursor-pointer">
              Send receipt by email
            </Label>
            <Switch
              id="sendEmail"
              checked={sendEmail}
              onCheckedChange={setSendEmail}
              className="shrink-0"
            />
          </div>
          {sendEmail && (
            <div className="space-y-1">
              <Label htmlFor="emailInput" className="text-xs text-muted-foreground">
                Email address
              </Label>
              <Input
                id="emailInput"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="patient@example.com"
                className="min-h-[48px]"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 5: Payment Method ────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {(['CASH', 'GCASH'] as const).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={[
                  'rounded-xl border-2 font-semibold text-lg transition-colors',
                  'min-h-[80px] flex items-center justify-center',
                  paymentMethod === method
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground',
                ].join(' ')}
              >
                {method}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Section 6: Confirm ───────────────────────────────── */}
      <Button
        className="w-full min-h-[56px] text-base font-semibold"
        disabled={!paymentMethod || loading}
        onClick={handleConfirm}
      >
        {loading
          ? 'Processing…'
          : `Confirm Payment — ₱${fmt(combinedGross)}`}
      </Button>

      {/* Printer status */}
      <div className="flex items-center gap-2 text-sm px-1">
        {printer ? (
          <>
            <Wifi className="w-4 h-4 text-green-600 shrink-0" />
            <span className="text-green-700">Printer ready: {printer.name}</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              No printer connected — Set up in Settings → Receipt Printer
            </span>
          </>
        )}
      </div>

      {/* Reconnect button if printer stored but device not linked */}
      {printer?.type === 'bluetooth' && !bluetoothDevice && (
        <Button variant="outline" className="w-full min-h-[48px]" onClick={handleReconnectBluetooth}>
          Reconnect Printer
        </Button>
      )}
      {printer?.type === 'serial' && !serialPort && (
        <Button variant="outline" className="w-full min-h-[48px]" onClick={handleReconnectSerial}>
          Reconnect Printer
        </Button>
      )}

    </div>
  )
}
