'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, Printer, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { confirmPayment, searchPatientLoyaltyCard, type CheckoutVisitData, type CheckoutLoyaltyCard, type FamilyCardResult, type LoyaltyBenefitApplication, type CardTemplateService } from './actions'
import { SERVICE_CARD_FIELDS } from '@/lib/loyaltyConfig'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = {
  visitData: CheckoutVisitData
  loyaltyCard: CheckoutLoyaltyCard | null
  cardTemplate: CardTemplateService[]
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

/**
 * Builds benefit options from the clinic's card template.
 * Only shows benefits with remaining uses > 0.
 * Pass `forCategory` to filter to a specific procedure category.
 */
function getAvailableBenefits(
  card: CheckoutLoyaltyCard | null,
  template: CardTemplateService[],
  forCategory?: string
): BenefitOption[] {
  if (!card) return []
  const all: BenefitOption[] = []

  for (const svc of template) {
    if (svc.isFree) {
      all.push({ key: 'CHECKUP', category: 'CHECKUP', pct: 100, label: 'Free Check-up', remaining: '', isCheckup: true })
      continue
    }
    const fields = SERVICE_CARD_FIELDS[svc.serviceKey]
    if (!fields) continue
    const t1Remaining = card[fields.t1Field as keyof CheckoutLoyaltyCard] as number
    if (t1Remaining > 0) {
      all.push({
        key: fields.t1Key,
        category: svc.serviceKey,
        pct: svc.tier1Discount,
        label: `${svc.tier1Discount}% off ${svc.label}`,
        remaining: `${t1Remaining} left`,
        isCheckup: false,
      })
    }
    if (svc.hasTier2 && fields.t2Field && fields.t2Key) {
      const t2Remaining = card[fields.t2Field as keyof CheckoutLoyaltyCard] as number
      if (t2Remaining > 0) {
        all.push({
          key: fields.t2Key,
          category: svc.serviceKey,
          pct: svc.tier2Discount,
          label: `${svc.tier2Discount}% off ${svc.label}`,
          remaining: `${t2Remaining} left`,
          isCheckup: false,
        })
      }
    }
  }

  if (forCategory) return all.filter((b) => b.category === forCategory)
  return all
}

/** Looks up the discount % for a benefit key from the clinic's template */
function benefitPctForKey(key: string, template: CardTemplateService[]): number {
  if (key === 'CHECKUP') return 100
  for (const svc of template) {
    const fields = SERVICE_CARD_FIELDS[svc.serviceKey]
    if (!fields) continue
    if (fields.t1Key === key) return svc.tier1Discount
    if (fields.t2Key === key) return svc.tier2Discount
  }
  return 0
}

/** Builds initial uses for a synthetic new card from the template */
function buildSyntheticCard(template: CardTemplateService[]): CheckoutLoyaltyCard {
  const uses: Record<string, number> = {
    cleaningUses50: 0, cleaningUses25: 0,
    fillingUses50: 0,  fillingUses25: 0,
    rctUses: 0, dentureUses: 0, bracesUses: 0,
    wisdomToothUses: 0, extractionUses: 0,
  }
  for (const svc of template) {
    if (svc.isFree) continue
    const fields = SERVICE_CARD_FIELDS[svc.serviceKey]
    if (!fields) continue
    uses[fields.t1Field] = svc.tier1Uses
    if (svc.hasTier2 && fields.t2Field) uses[fields.t2Field] = svc.tier2Uses
  }
  return { id: 'new', cardNumber: 'New Card', expiryDate: new Date(), isActive: true, ...uses } as CheckoutLoyaltyCard
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CheckoutClient({ visitData, loyaltyCard, cardTemplate }: Props) {
  const router = useRouter()
  const LOYALTY_CARD_PRICE = 500

  const hasPendingRenewal = visitData.pendingLoyaltyCardPurchase && !loyaltyCard

  // SC/PWD state
  const profileScId = visitData.scIdNumber ?? ''
  const profilePwdId = visitData.pwdIdNumber ?? ''
  const defaultScPwdType: 'SC' | 'PWD' = visitData.isSeniorCitizen ? 'SC' : visitData.isPwd ? 'PWD' : 'SC'
  const [applyScPwd, setApplyScPwd] = useState(false)
  const [scPwdType, setScPwdType] = useState<'SC' | 'PWD'>(defaultScPwdType)
  const [scPwdIdInput, setScPwdIdInput] = useState<string>(
    defaultScPwdType === 'SC' ? profileScId : profilePwdId
  )

  function handleScPwdTypeChange(t: 'SC' | 'PWD') {
    setScPwdType(t)
    setScPwdIdInput(t === 'SC' ? profileScId : profilePwdId)
  }

  // Per-procedure allocation — one entry per procedure in the visit
  type ProcAlloc = { name: string; category: string; amount: string; benefitKey: string | null }

  const [purchaseCard, setPurchaseCard] = useState(hasPendingRenewal)
  const [waiveCardFee, setWaiveCardFee] = useState(false)
  const [allocations, setAllocations] = useState<ProcAlloc[]>(
    visitData.procedures.map((p) => ({
      name: p.name,
      category: p.category,
      // Pre-fill amount from stored per-procedure breakdown (avoids re-entry at checkout)
      amount: p.amount != null ? String(p.amount) : '',
      benefitKey: null,
    }))
  )

  const isMultiProc = visitData.procedures.length > 1

  function setAlloc(idx: number, patch: Partial<ProcAlloc>) {
    setAllocations((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)))
  }

  // Single-procedure convenience: mirrors old selectedBenefitKey behaviour
  function handleSingleBenefitToggle(key: string) {
    setAllocations((prev) =>
      prev.map((a, i) =>
        i === 0
          ? { ...a, benefitKey: a.benefitKey === key ? null : key, amount: a.amount || String(visitData.grossAmount) }
          : a
      )
    )
  }

  function handlePurchaseCardToggle(val: boolean) {
    setPurchaseCard(val)
    if (!val) {
      setWaiveCardFee(false)
      if (!loyaltyCard) setAllocations((prev) => prev.map((a) => ({ ...a, benefitKey: null })))
    }
  }

  // ── Family card state ──────────────────────────────────────────────────────
  const [familyCardOpen, setFamilyCardOpen] = useState(false)
  const [familyQuery, setFamilyQuery] = useState('')
  const [familySearching, setFamilySearching] = useState(false)
  const [familyResults, setFamilyResults] = useState<FamilyCardResult[]>([])
  const [familyCard, setFamilyCard] = useState<FamilyCardResult | null>(null)
  const familyDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (familyDebounce.current) clearTimeout(familyDebounce.current)
    if (!familyQuery.trim() || familyQuery.trim().length < 2) {
      setFamilyResults([])
      return
    }
    familyDebounce.current = setTimeout(async () => {
      setFamilySearching(true)
      try {
        const results = await searchPatientLoyaltyCard(familyQuery, visitData.patientId)
        setFamilyResults(results)
      } finally {
        setFamilySearching(false)
      }
    }, 350)
    return () => { if (familyDebounce.current) clearTimeout(familyDebounce.current) }
  }, [familyQuery, visitData.patientId])

  function selectFamilyCard(result: FamilyCardResult) {
    setFamilyCard(result)
    setFamilyResults([])
    setFamilyQuery('')
    setFamilyCardOpen(false)
    setAllocations((prev) => prev.map((a) => ({ ...a, benefitKey: null })))
    setPurchaseCard(false)
  }

  function clearFamilyCard() {
    setFamilyCard(null)
    setAllocations((prev) => prev.map((a) => ({ ...a, benefitKey: null })))
  }
  // ──────────────────────────────────────────────────────────────────────────

  // When purchasing a new card with no existing card, synthesise benefits from the clinic template
  const syntheticNewCard: CheckoutLoyaltyCard | null = !loyaltyCard
    ? buildSyntheticCard(cardTemplate)
    : null

  // Family card overrides own card for benefit selection
  const effectiveCard = familyCard?.card ?? loyaltyCard ?? (purchaseCard ? syntheticNewCard : null)

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

  useEffect(() => {
    const type = localStorage.getItem('printer_type') as 'bluetooth' | 'serial' | null
    const name = localStorage.getItem('printer_name')
    if (type && name) setPrinter({ type, name })
  }, [])

  // ── Price calculations — dental is VAT-exempt ────────────────────────────
  const gross = visitData.grossAmount

  // Sum discount amounts across all procedure allocations that have a benefit applied
  const loyaltyDiscountAmount = allocations.reduce((sum, a) => {
    if (!a.benefitKey || !a.amount) return sum
    const amt = parseFloat(a.amount) || 0
    const pct = benefitPctForKey(a.benefitKey, cardTemplate)
    const disc = pct >= 100 ? amt : Math.round(amt * (pct / 100) * 100) / 100
    return sum + disc
  }, 0)
  const grossAfterLoyalty = Math.max(0, Math.round((gross - loyaltyDiscountAmount) * 100) / 100)

  const scPwdIdValid = applyScPwd && scPwdIdInput.trim().length >= 3
  const scPwdDiscountAmount = scPwdIdValid
    ? Math.round(gross * 0.20 * 100) / 100
    : 0

  const discountedGross = Math.max(0, Math.round((grossAfterLoyalty - scPwdDiscountAmount) * 100) / 100)
  const loyaltyCardTotal = purchaseCard && !waiveCardFee ? LOYALTY_CARD_PRICE : 0
  const combinedGross = discountedGross + loyaltyCardTotal

  // Multi-proc allocation validation
  const allocatedTotal = allocations.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0)
  const allocatedRounded = Math.round(allocatedTotal * 100) / 100
  const unallocated = Math.round((gross - allocatedRounded) * 100) / 100
  const allocationValid = !isMultiProc || Math.abs(unallocated) < 0.01

  // ── Printer reconnect ────────────────────────────────────────────────────
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

  async function doPrint(bytes: Uint8Array) {
    const { printViaBluetooth, printViaSerial } = await import('@/lib/thermal')
    if (printer?.type === 'bluetooth') {
      if (!bluetoothDevice) throw new Error('Bluetooth device not connected. Use Reconnect.')
      await printViaBluetooth(bluetoothDevice, bytes)
    } else if (printer?.type === 'serial') {
      if (!serialPort) throw new Error('Serial port not connected. Use Reconnect.')
      await printViaSerial(serialPort, bytes)
    }
  }

  function buildReceiptDiscountLabel(): string {
    const parts: string[] = []
    allocations.filter((a) => a.benefitKey).forEach((a) => {
      const pct = benefitPctForKey(a.benefitKey!, cardTemplate)
      parts.push(`${pct >= 100 ? 'Free' : `${pct}%`} ${a.name}`)
    })
    if (scPwdIdValid) parts.push(scPwdType === 'SC' ? 'SC 20% RA 9994' : 'PWD 20% RA 10754')
    return parts.join(' + ')
  }

  // ── Handle confirm ───────────────────────────────────────────────────────
  async function handleConfirm() {
    if (!paymentMethod) return

    if (isMultiProc && !allocationValid) {
      setError(`Procedure amounts must add up to ₱${fmt(gross)}. Currently ₱${fmt(allocatedRounded)}.`)
      return
    }

    setLoading(true)
    setError(null)

    // Build the array of benefits to apply — one per procedure that has a benefit selected
    const loyaltyBenefits: LoyaltyBenefitApplication[] = allocations
      .filter((a) => a.benefitKey && (parseFloat(a.amount) || 0) > 0)
      .map((a) => ({
        benefitKey: a.benefitKey!,
        category: a.category,
        discountPct: benefitPctForKey(a.benefitKey!, cardTemplate),
        serviceAmount: parseFloat(a.amount) || 0,
      }))

    try {
      const res = await confirmPayment({
        visitId: visitData.id,
        paymentMethod,
        loyaltyCardId: familyCard?.card.id ?? loyaltyCard?.id ?? null,
        loyaltyBenefits,
        purchaseNewLoyaltyCard: purchaseCard,
        waiveCardFee: purchaseCard ? waiveCardFee : undefined,
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
          const discLabel = buildReceiptDiscountLabel()
          const bytes = await buildReceiptBytes({
            clinicName: visitData.clinic.name,
            clinicAddress,
            clinicTin: visitData.clinic.tin,
            orNumber: res.orNumber,
            transactionDate: new Date(),
            patientName: visitData.patientName,
            serviceDescription: visitData.treatment,
            toothNumber: visitData.toothNumber,
            netAmount: res.totalAmount,
            vatAmount: 0,
            grossAmount: res.totalAmount,
            discountAmount: loyaltyDiscountAmount + scPwdDiscountAmount,
            discountLabel: discLabel || undefined,
            scPwdType: scPwdIdValid ? scPwdType : undefined,
            scPwdIdNumber: scPwdIdValid ? scPwdIdInput.trim() : undefined,
            paymentMethod,
            notes: notes.trim() || undefined,
          })
          await doPrint(bytes)
        } catch (printErr) {
          toast.error(printErr instanceof Error ? printErr.message : 'Print failed')
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
      const discLabel = buildReceiptDiscountLabel()
      const bytes = await buildReceiptBytes({
        clinicName: visitData.clinic.name,
        clinicAddress,
        clinicTin: visitData.clinic.tin,
        orNumber: result.orNumber,
        transactionDate: new Date(),
        patientName: visitData.patientName,
        serviceDescription: visitData.treatment,
        toothNumber: visitData.toothNumber,
        netAmount: result.totalAmount,
        vatAmount: 0,
        grossAmount: result.totalAmount,
        discountAmount: loyaltyDiscountAmount + scPwdDiscountAmount,
        discountLabel: discLabel || undefined,
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

          {/* ── Active family card banner ── */}
          {familyCard && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 flex items-start justify-between gap-2">
              <div className="text-sm">
                <p className="font-semibold text-blue-900">Using {familyCard.holderName}&apos;s card</p>
                <p className="text-blue-700 text-xs mt-0.5">
                  #{familyCard.card.cardNumber} · expires {fmtDate(familyCard.card.expiryDate)}
                </p>
              </div>
              <button
                type="button"
                onClick={clearFamilyCard}
                className="text-xs text-blue-500 underline shrink-0 mt-0.5"
              >
                Remove
              </button>
            </div>
          )}

          {effectiveCard ? (
            <>
              {!familyCard && (
                <div className="text-sm text-muted-foreground">
                  {effectiveCard.id === 'new'
                    ? 'New card — select benefits to use immediately'
                    : `Card #${effectiveCard.cardNumber} · expires ${fmtDate(effectiveCard.expiryDate)}`}
                </div>
              )}

              {isMultiProc ? (
                /* ── MULTI-PROCEDURE: per-procedure rows ─────────────────── */
                <div className="flex flex-col gap-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Enter the amount for each procedure, then tap a benefit to apply.
                  </p>

                  {allocations.map((alloc, idx) => {
                    const procBenefits = getAvailableBenefits(effectiveCard, cardTemplate, alloc.category)
                    const amtNum = parseFloat(alloc.amount) || 0
                    return (
                      <div key={idx} className="rounded-xl border border-border p-3 flex flex-col gap-2.5">
                        <p className="text-sm font-semibold">{alloc.name}</p>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-muted-foreground">Amount (₱)</label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                            value={alloc.amount}
                            onChange={(e) => setAlloc(idx, { amount: e.target.value })}
                            className="min-h-[48px]"
                          />
                        </div>

                        {procBenefits.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {procBenefits.map((benefit) => {
                              const selected = alloc.benefitKey === benefit.key
                              const disabled = amtNum <= 0
                              return (
                                <button
                                  key={benefit.key}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => setAlloc(idx, { benefitKey: selected ? null : benefit.key })}
                                  className={[
                                    'rounded-xl border-2 px-3 py-2 text-left text-sm transition-colors',
                                    selected
                                      ? 'border-primary bg-primary/10 text-primary'
                                      : 'border-border bg-background text-foreground',
                                    disabled ? 'opacity-40 cursor-not-allowed' : '',
                                  ].join(' ')}
                                >
                                  <p className="font-semibold leading-tight">{benefit.label}</p>
                                  {benefit.remaining && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{benefit.remaining}</p>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No card benefits for this procedure.</p>
                        )}
                      </div>
                    )
                  })}

                  {/* Allocation total vs expected */}
                  <div className={[
                    'flex justify-between text-sm px-1 font-medium',
                    allocationValid ? 'text-emerald-700' : 'text-amber-700',
                  ].join(' ')}>
                    <span>Total allocated</span>
                    <span>₱{fmt(allocatedRounded)} / ₱{fmt(gross)}</span>
                  </div>
                  {!allocationValid && allocatedRounded > 0 && (
                    <p className="text-xs text-amber-700 px-1">
                      {unallocated > 0
                        ? `₱${fmt(unallocated)} still unallocated`
                        : `Over by ₱${fmt(Math.abs(unallocated))}`}
                    </p>
                  )}
                </div>
              ) : (
                /* ── SINGLE PROCEDURE: benefit grid ──────────────────────── */
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Apply a benefit (tap to select, tap again to deselect)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {getAvailableBenefits(effectiveCard, cardTemplate, allocations[0]?.category).map((benefit) => {
                      const selected = allocations[0]?.benefitKey === benefit.key
                      return (
                        <button
                          key={benefit.key}
                          type="button"
                          onClick={() => handleSingleBenefitToggle(benefit.key)}
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
                    {getAvailableBenefits(effectiveCard, cardTemplate, allocations[0]?.category).length === 0 && (
                      <p className="col-span-2 text-sm text-muted-foreground">No benefits available for this procedure.</p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This patient does not have a loyalty card.
              </p>
              {!familyCard && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="purchaseCard" className="flex-1 cursor-pointer">
                      Purchase loyalty card — ₱{fmt(LOYALTY_CARD_PRICE)}
                    </Label>
                    <Switch
                      id="purchaseCard"
                      checked={purchaseCard}
                      onCheckedChange={handlePurchaseCardToggle}
                      className="shrink-0"
                    />
                  </div>
                  {purchaseCard && (
                    <div className="flex items-center justify-between gap-3 pl-1 pt-0.5 border-t">
                      <div className="flex-1">
                        <Label htmlFor="waiveCardFee" className="cursor-pointer text-sm text-muted-foreground">
                          Waive card fee
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Card is issued free of charge — ₱0 added to total
                        </p>
                      </div>
                      <Switch
                        id="waiveCardFee"
                        checked={waiveCardFee}
                        onCheckedChange={setWaiveCardFee}
                        className="shrink-0"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Family card search ── */}
          <div className="pt-1 border-t">
            {!familyCard && (
              <button
                type="button"
                onClick={() => { setFamilyCardOpen((v) => !v); setFamilyQuery(''); setFamilyResults([]) }}
                className="text-sm text-primary underline underline-offset-2"
              >
                {familyCardOpen ? 'Cancel' : "Use a family member's card"}
              </button>
            )}

            {familyCardOpen && !familyCard && (
              <div className="mt-3 space-y-2">
                <Input
                  autoFocus
                  placeholder="Search by name or phone…"
                  value={familyQuery}
                  onChange={(e) => setFamilyQuery(e.target.value)}
                  className="min-h-[48px]"
                />
                {familySearching && (
                  <p className="text-xs text-muted-foreground px-1">Searching…</p>
                )}
                {!familySearching && familyQuery.trim().length >= 2 && familyResults.length === 0 && (
                  <p className="text-xs text-muted-foreground px-1">No patients with an active loyalty card found.</p>
                )}
                {familyResults.map((r) => (
                  <button
                    key={r.patientId}
                    type="button"
                    onClick={() => selectFamilyCard(r)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-left hover:bg-muted transition-colors"
                  >
                    <p className="font-semibold text-sm">{r.holderName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Card #{r.card.cardNumber} · expires {fmtDate(r.card.expiryDate)}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                      {r.card.cleaningUses50 > 0 && <span className="text-xs text-primary">{r.card.cleaningUses50}× cleaning 50%</span>}
                      {r.card.cleaningUses25 > 0 && <span className="text-xs text-primary">{r.card.cleaningUses25}× cleaning 25%</span>}
                      {r.card.fillingUses50 > 0 && <span className="text-xs text-primary">{r.card.fillingUses50}× filling 50%</span>}
                      {r.card.fillingUses25 > 0 && <span className="text-xs text-primary">{r.card.fillingUses25}× filling 25%</span>}
                      {r.card.extractionUses > 0 && <span className="text-xs text-primary">{r.card.extractionUses}× extraction</span>}
                      {r.card.rctUses > 0 && <span className="text-xs text-primary">{r.card.rctUses}× RCT</span>}
                      {r.card.bracesUses > 0 && <span className="text-xs text-primary">{r.card.bracesUses}× braces</span>}
                      {r.card.dentureUses > 0 && <span className="text-xs text-primary">{r.card.dentureUses}× dentures</span>}
                      {r.card.wisdomToothUses > 0 && <span className="text-xs text-primary">{r.card.wisdomToothUses}× wisdom tooth</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
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
          {/* Show itemized per-procedure amounts when stored, otherwise single service line */}
          {visitData.procedures.length > 1 && visitData.procedures.some((p) => p.amount != null) ? (
            visitData.procedures.map((p, i) => (
              <div key={i} className="flex justify-between text-muted-foreground">
                <span>{p.name}</span>
                <span>₱{fmt(p.amount ?? 0)}</span>
              </div>
            ))
          ) : (
            <div className="flex justify-between text-muted-foreground">
              <span>Service</span>
              <span>₱{fmt(gross)}</span>
            </div>
          )}
          {allocations.filter((a) => a.benefitKey).map((a, idx) => {
            const pct = benefitPctForKey(a.benefitKey!, cardTemplate)
            const amt = parseFloat(a.amount) || 0
            const disc = pct >= 100 ? amt : Math.round(amt * (pct / 100) * 100) / 100
            return disc > 0 ? (
              <div key={idx} className="flex justify-between text-red-600">
                <span>{pct >= 100 ? 'Free' : `${pct}%`} off {a.name}</span>
                <span>-₱{fmt(disc)}</span>
              </div>
            ) : null
          })}
          {scPwdIdValid && (
            <div className="flex justify-between text-red-600">
              <span>{scPwdType === 'SC' ? 'SC 20% (RA 9994)' : 'PWD 20% (RA 10754)'}</span>
              <span>-₱{fmt(scPwdDiscountAmount)}</span>
            </div>
          )}
          {purchaseCard && (
            <div className="flex justify-between text-muted-foreground">
              <span>Loyalty card</span>
              {waiveCardFee ? (
                <span className="text-emerald-600 font-medium">Waived</span>
              ) : (
                <span>₱{fmt(LOYALTY_CARD_PRICE)}</span>
              )}
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

      {/* ── Section 5: Confirm ───────────────────────────────── */}
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
