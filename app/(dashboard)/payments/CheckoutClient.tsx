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

type BenefitOption = {
  key: string
  category: string
  pct: number
  label: string
  remaining: string
  isCheckup: boolean
}

/** Returns all redeemable loyalty benefits for a given card. */
function getAvailableBenefits(card: CheckoutLoyaltyCard | null): BenefitOption[] {
  if (!card) return []
  const b: BenefitOption[] = []

  b.push({ key: 'CHECKUP', category: 'CHECKUP', pct: 100, label: 'Free Check-up', remaining: '', isCheckup: true })

  if (card.cleaningUses50 > 0)
    b.push({ key: 'CLEANING_50', category: 'CLEANING', pct: 50, label: '50% off Cleaning', remaining: `${card.cleaningUses50} left`, isCheckup: false })
  if (card.cleaningUses25 > 0)
    b.push({ key: 'CLEANING_25', category: 'CLEANING', pct: 25, label: '25% off Cleaning', remaining: `${card.cleaningUses25} left`, isCheckup: false })
  if (card.fillingUses50 > 0)
    b.push({ key: 'FILLING_50', category: 'FILLING', pct: 50, label: '50% off Filling', remaining: `${card.fillingUses50} left`, isCheckup: false })
  if (card.fillingUses25 > 0)
    b.push({ key: 'FILLING_25', category: 'FILLING', pct: 25, label: '25% off Filling', remaining: `${card.fillingUses25} left`, isCheckup: false })
  if (card.rctUses > 0)
    b.push({ key: 'RCT', category: 'RCT', pct: 10, label: '10% off RCT', remaining: `${card.rctUses} left`, isCheckup: false })
  if (card.dentureUses > 0)
    b.push({ key: 'DENTURES', category: 'DENTURES', pct: 15, label: '15% off Dentures', remaining: `${card.dentureUses} left`, isCheckup: false })
  if (card.bracesUses > 0)
    b.push({ key: 'BRACES', category: 'BRACES', pct: 10, label: '10% off Braces', remaining: `${card.bracesUses} left`, isCheckup: false })
  if (card.extractionUses > 0)
    b.push({ key: 'EXTRACTION', category: 'EXTRACTION', pct: 20, label: '20% off Extraction', remaining: `${card.extractionUses} left`, isCheckup: false })
  if (card.wisdomToothUses > 0)
    b.push({ key: 'WISDOM_TOOTH', category: 'WISDOM_TOOTH', pct: 10, label: '10% off Wisdom Tooth', remaining: `${card.wisdomToothUses} left`, isCheckup: false })

  return b
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CheckoutClient({ visitData, loyaltyCard }: Props) {
  const router = useRouter()
  const LOYALTY_CARD_PRICE = 500

  // Benefit picker
  const availableBenefits = getAvailableBenefits(loyaltyCard)
  const [selectedBenefitKey, setSelectedBenefitKey] = useState<string | null>(null)
  const selectedBenefit = availableBenefits.find((b) => b.key === selectedBenefitKey) ?? null

  // Pending loyalty card renewal: auto-enable purchase if no current card
  const hasPendingRenewal = visitData.pendingLoyaltyCardPurchase && !loyaltyCard

  // SC/PWD state — always available at checkout; profile flags pre-fill but are not required
  const profileScId = visitData.scIdNumber ?? ''
  const profilePwdId = visitData.pwdIdNumber ?? ''
  const defaultScPwdType: 'SC' | 'PWD' = visitData.isSeniorCitizen ? 'SC' : visitData.isPwd ? 'PWD' : 'SC'
  const [applyScPwd, setApplyScPwd] = useState(false)
  const [scPwdType, setScPwdType] = useState<'SC' | 'PWD'>(defaultScPwdType)
  const [scPwdIdInput, setScPwdIdInput] = useState<string>(
    defaultScPwdType === 'SC' ? profileScId : profilePwdId
  )

  // When type switches, pre-fill from profile if available
  function handleScPwdTypeChange(t: 'SC' | 'PWD') {
    setScPwdType(t)
    setScPwdIdInput(t === 'SC' ? profileScId : profilePwdId)
  }

  // Form state
  const [purchaseCard, setPurchaseCard] = useState(hasPendingRenewal)
  const [notes, setNotes] = useState('')
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

  // Price calculations — dental is VAT-exempt
  const gross = visitData.grossAmount
  const isCheckup = selectedBenefit?.isCheckup ?? false
  const availablePct = selectedBenefit?.pct ?? 0

  // Loyalty discount (off original gross)
  const loyaltyDiscountAmount = selectedBenefit
    ? isCheckup
      ? gross
      : Math.round(gross * (availablePct / 100) * 100) / 100
    : 0
  const grossAfterLoyalty = Math.max(0, Math.round((gross - loyaltyDiscountAmount) * 100) / 100)

  // SC/PWD discount (20% off original gross, if applied with valid ID)
  const scPwdIdValid = applyScPwd && scPwdIdInput.trim().length >= 3
  const scPwdDiscountAmount = scPwdIdValid
    ? Math.round(gross * 0.20 * 100) / 100
    : 0

  // Treatment total after all discounts
  const discountedGross = Math.max(0, Math.round((grossAfterLoyalty - scPwdDiscountAmount) * 100) / 100)

  const loyaltyCardTotal = purchaseCard ? LOYALTY_CARD_PRICE : 0
  const combinedGross = discountedGross + loyaltyCardTotal

  // VAT-exempt: all amounts are gross amounts

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
        applyLoyaltyDiscount: !!selectedBenefit,
        discountPct: availablePct,
        discountCategory: selectedBenefit?.category,
        loyaltyCardId: loyaltyCard?.id ?? null,
        purchaseNewLoyaltyCard: purchaseCard,
        applyScPwdDiscount: scPwdIdValid,
        scPwdType: scPwdIdValid ? scPwdType : null,
        scPwdIdNumber: scPwdIdValid ? scPwdIdInput.trim() : null,
        notes: notes.trim() || undefined,
      })

      setResult(res)
      setConfirmed(true)

      // Print receipt
      if (printer) {
        try {
          const { buildReceiptBytes } = await import('@/lib/thermal')
          const clinicAddress = `${visitData.clinic.street}, ${visitData.clinic.city}, ${visitData.clinic.province} ${visitData.clinic.zip}`
          const receiptDiscountLabels: string[] = []
          if (selectedBenefit) receiptDiscountLabels.push(selectedBenefit.label)
          if (scPwdIdValid) receiptDiscountLabels.push(scPwdType === 'SC' ? 'SC 20% RA 9994' : 'PWD 20% RA 10754')
          const bytes = await buildReceiptBytes({
            clinicName: visitData.clinic.name,
            clinicAddress,
            clinicTin: visitData.clinic.tin,
            orNumber: res.orNumber,
            transactionDate: new Date(),
            patientName: visitData.patientName,
            serviceDescription: visitData.treatment,
            toothNumber: visitData.toothNumber,
            netAmount: res.totalAmount, // VAT-exempt
            vatAmount: 0,
            grossAmount: res.totalAmount,
            discountAmount: loyaltyDiscountAmount + scPwdDiscountAmount,
            discountLabel: receiptDiscountLabels.length > 0 ? receiptDiscountLabels.join(' + ') : undefined,
            scPwdType: scPwdIdValid ? scPwdType : undefined,
            scPwdIdNumber: scPwdIdValid ? scPwdIdInput.trim() : undefined,
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
        netAmount: result.totalAmount, // VAT-exempt
        vatAmount: 0,
        grossAmount: result.totalAmount,
        discountAmount: loyaltyDiscountAmount + scPwdDiscountAmount,
        discountLabel: [
          ...(selectedBenefit ? [selectedBenefit.label] : []),
          ...(scPwdIdValid ? [scPwdType === 'SC' ? 'SC 20% RA 9994' : 'PWD 20% RA 10754'] : []),
        ].join(' + ') || undefined,
        scPwdType: scPwdIdValid ? scPwdType : undefined,
        scPwdIdNumber: scPwdIdValid ? scPwdIdInput.trim() : undefined,
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

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Apply a benefit (tap to select, tap again to deselect)</p>
                <div className="grid grid-cols-2 gap-2">
                  {availableBenefits.map((benefit) => {
                    const selected = selectedBenefitKey === benefit.key
                    return (
                      <button
                        key={benefit.key}
                        type="button"
                        onClick={() => setSelectedBenefitKey(selected ? null : benefit.key)}
                        className={[
                          'rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-colors',
                          selected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-foreground',
                        ].join(' ')}
                      >
                        <p className="font-semibold leading-tight">{benefit.label}</p>
                        {benefit.remaining && (
                          <p className="text-xs text-muted-foreground mt-0.5">{benefit.remaining}</p>
                        )}
                      </button>
                    )
                  })}
                  {availableBenefits.length === 0 && (
                    <p className="col-span-2 text-sm text-muted-foreground">No benefits available on this card.</p>
                  )}
                </div>
              </div>
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

      {/* ── SC/PWD Discount ──────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gov&apos;t Discount</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="applyScPwd" className="flex-1 cursor-pointer text-sm">
              Apply 20% SC/PWD discount
            </Label>
            <Switch
              id="applyScPwd"
              checked={applyScPwd}
              onCheckedChange={setApplyScPwd}
              className="shrink-0"
            />
          </div>

          {applyScPwd && (
            <div className="space-y-3 pt-1">
              {/* Type selector — always show both options */}
              <div className="grid grid-cols-2 gap-2">
                {(['SC', 'PWD'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleScPwdTypeChange(t)}
                    className={[
                      'rounded-xl border-2 py-2 text-sm font-semibold transition-colors min-h-[44px]',
                      scPwdType === t
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-foreground',
                    ].join(' ')}
                  >
                    {t === 'SC' ? 'Senior Citizen' : 'PWD'}
                  </button>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                {scPwdType === 'SC'
                  ? 'RA 9994 — Senior Citizen 20% discount (VAT-exempt)'
                  : 'RA 10754 — PWD 20% discount (VAT-exempt)'}
              </p>

              {/* ID number */}
              <div className="space-y-1">
                <Label htmlFor="scPwdId" className="text-xs text-muted-foreground">
                  {scPwdType === 'SC' ? 'Senior Citizen ID No.' : 'PWD ID No.'}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="scPwdId"
                  value={scPwdIdInput}
                  onChange={(e) => setScPwdIdInput(e.target.value)}
                  placeholder="Enter ID number to apply discount"
                  className="min-h-[48px] text-sm"
                />
                {applyScPwd && scPwdIdInput.trim().length > 0 && scPwdIdInput.trim().length < 3 && (
                  <p className="text-xs text-destructive">ID number too short</p>
                )}
              </div>

              {scPwdIdValid && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800">
                  20% discount applied — ₱{fmt(scPwdDiscountAmount)} off
                </div>
              )}
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
            <span>Service</span>
            <span>₱{fmt(gross)}</span>
          </div>
          {selectedBenefit && loyaltyDiscountAmount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>{selectedBenefit.label}</span>
              <span>-₱{fmt(loyaltyDiscountAmount)}</span>
            </div>
          )}
          {scPwdIdValid && (
            <div className="flex justify-between text-red-600">
              <span>{scPwdType === 'SC' ? 'SC 20% (RA 9994)' : 'PWD 20% (RA 10754)'}</span>
              <span>-₱{fmt(scPwdDiscountAmount)}</span>
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
          <div className="flex justify-between text-xs text-emerald-600 mt-1">
            <span>VAT-Exempt (NIRC §109)</span>
            <span>₱0.00</span>
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

      {/* ── Section 4: Payment Method ────────────────────────── */}
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
