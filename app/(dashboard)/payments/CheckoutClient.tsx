'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, Printer, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  confirmPayment,
  searchPatientLoyaltyCard,
  type CheckoutVisitData,
  type CheckoutLoyaltyCard,
  type FamilyCardResult,
  type LoyaltyBenefitApplication,
  type CardTemplateService,
} from './actions'
import { SERVICE_CARD_FIELDS } from '@/lib/loyaltyConfig'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = {
  visitData: CheckoutVisitData
  loyaltyCard: CheckoutLoyaltyCard | null
  cardTemplate: CardTemplateService[]
}

type PrinterInfo = { type: 'bluetooth' | 'serial'; name: string } | null

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(n)
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CheckoutClient({ visitData, loyaltyCard, cardTemplate }: Props) {
  const router = useRouter()
  const LOYALTY_CARD_PRICE = 500

  const hasPendingRenewal = visitData.pendingLoyaltyCardPurchase && !loyaltyCard

  // ── SC/PWD ──────────────────────────────────────────────────────────────
  const profileScId = visitData.scIdNumber ?? ''
  const profilePwdId = visitData.pwdIdNumber ?? ''
  const defaultScPwdType: 'SC' | 'PWD' = visitData.isSeniorCitizen ? 'SC' : 'PWD'
  const [applyScPwd, setApplyScPwd] = useState(false)
  const [scPwdType, setScPwdType] = useState<'SC' | 'PWD'>(defaultScPwdType)
  const [scPwdIdInput, setScPwdIdInput] = useState(
    defaultScPwdType === 'SC' ? profileScId : profilePwdId
  )

  function handleScPwdTypeChange(t: 'SC' | 'PWD') {
    setScPwdType(t)
    setScPwdIdInput(t === 'SC' ? profileScId : profilePwdId)
  }

  // ── Loyalty card purchase ────────────────────────────────────────────────
  const [purchaseCard, setPurchaseCard] = useState(hasPendingRenewal)
  const [waiveCardFee, setWaiveCardFee] = useState(false)

  function handlePurchaseCardToggle(val: boolean) {
    setPurchaseCard(val)
    if (!val) setWaiveCardFee(false)
  }

  // Whether to apply the card's benefits (discount) to this transaction
  const [applyCardBenefits, setApplyCardBenefits] = useState(true)

  // ── Family card ──────────────────────────────────────────────────────────
  const [familyCardOpen, setFamilyCardOpen] = useState(false)
  const [familyQuery, setFamilyQuery] = useState('')
  const [familySearching, setFamilySearching] = useState(false)
  const [familyResults, setFamilyResults] = useState<FamilyCardResult[]>([])
  const [familyCard, setFamilyCard] = useState<FamilyCardResult | null>(null)
  const familyDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (familyDebounce.current) clearTimeout(familyDebounce.current)
    if (familyQuery.trim().length < 2) { setFamilyResults([]); return }
    familyDebounce.current = setTimeout(async () => {
      setFamilySearching(true)
      try {
        setFamilyResults(await searchPatientLoyaltyCard(familyQuery, visitData.patientId))
      } finally {
        setFamilySearching(false)
      }
    }, 350)
    return () => { if (familyDebounce.current) clearTimeout(familyDebounce.current) }
  }, [familyQuery, visitData.patientId])

  function selectFamilyCard(r: FamilyCardResult) {
    setFamilyCard(r)
    setFamilyResults([])
    setFamilyQuery('')
    setFamilyCardOpen(false)
    setPurchaseCard(false)
  }

  // The card whose benefits are applied — family card overrides own card.
  // New card purchase in the same transaction doesn't auto-apply benefits
  // (patient uses benefits starting from the next visit).
  const effectiveCard: CheckoutLoyaltyCard | null = familyCard?.card ?? loyaltyCard ?? null

  // ── Auto-apply benefits ──────────────────────────────────────────────────
  // For each procedure in the visit, find the best available benefit on the
  // effective card and apply it automatically. No manual chip selection needed.
  const autoAppliedBenefits = useMemo<LoyaltyBenefitApplication[]>(() => {
    if (!effectiveCard || !applyCardBenefits) return []

    const procCount = visitData.procedures.length

    return visitData.procedures.flatMap((proc) => {
      // Use stored per-procedure amount; fall back to equal split of gross
      const amt = proc.amount ?? visitData.grossAmount / procCount
      const category = proc.category

      // Free check-up
      if (category === 'CHECKUP') {
        return cardTemplate.some((t) => t.isFree)
          ? [{ benefitKey: 'CHECKUP', category: 'CHECKUP', discountPct: 100, serviceAmount: amt }]
          : []
      }

      const fields = SERVICE_CARD_FIELDS[category]
      if (!fields) return []
      const svc = cardTemplate.find((t) => t.serviceKey === category)
      if (!svc) return []

      // Tier 1
      const t1 = (effectiveCard as unknown as Record<string, number>)[fields.t1Field] ?? 0
      if (t1 > 0) {
        return [{ benefitKey: fields.t1Key, category, discountPct: svc.tier1Discount, serviceAmount: amt }]
      }
      // Tier 2
      if (svc.hasTier2 && fields.t2Field && fields.t2Key) {
        const t2 = (effectiveCard as unknown as Record<string, number>)[fields.t2Field] ?? 0
        if (t2 > 0) {
          return [{ benefitKey: fields.t2Key, category, discountPct: svc.tier2Discount, serviceAmount: amt }]
        }
      }
      return []
    })
  }, [effectiveCard, applyCardBenefits, cardTemplate, visitData.procedures, visitData.grossAmount])

  // ── Payment / UI state ───────────────────────────────────────────────────
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'GCASH' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [result, setResult] = useState<{
    invoiceId: string; orNumber: string; totalAmount: number; newLoyaltyCardId?: string
  } | null>(null)

  // ── Printer ──────────────────────────────────────────────────────────────
  const [printer, setPrinter] = useState<PrinterInfo>(null)
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null)
  const [serialPort, setSerialPort] = useState<SerialPort | null>(null)

  useEffect(() => {
    const type = localStorage.getItem('printer_type') as 'bluetooth' | 'serial' | null
    const name = localStorage.getItem('printer_name')
    if (type && name) setPrinter({ type, name })
  }, [])

  const handleReconnectBluetooth = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) return
    try {
      const device = await (navigator as Navigator & { bluetooth: { requestDevice: (o: object) => Promise<BluetoothDevice> } })
        .bluetooth.requestDevice({ acceptAllDevices: true })
      setBluetoothDevice(device)
      toast.success(`Connected to ${device.name ?? 'printer'}`)
    } catch { toast.error('Could not connect to Bluetooth printer') }
  }, [])

  const handleReconnectSerial = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('serial' in navigator)) return
    try {
      const port = await (navigator as Navigator & { serial: { requestPort: () => Promise<SerialPort> } }).serial.requestPort()
      setSerialPort(port)
      toast.success('Connected to serial printer')
    } catch { toast.error('Could not connect to serial printer') }
  }, [])

  async function doPrint(bytes: Uint8Array) {
    const { printViaBluetooth, printViaSerial } = await import('@/lib/thermal')
    if (printer?.type === 'bluetooth') {
      if (!bluetoothDevice) throw new Error('Bluetooth device not connected.')
      await printViaBluetooth(bluetoothDevice, bytes)
    } else if (printer?.type === 'serial') {
      if (!serialPort) throw new Error('Serial port not connected.')
      await printViaSerial(serialPort, bytes)
    }
  }

  // ── Price calculations — dental is VAT-exempt ────────────────────────────
  const gross = visitData.grossAmount

  const loyaltyDiscountAmount = useMemo(() =>
    autoAppliedBenefits.reduce((sum, b) => {
      const disc = b.discountPct >= 100
        ? b.serviceAmount
        : Math.round(b.serviceAmount * (b.discountPct / 100) * 100) / 100
      return sum + disc
    }, 0),
    [autoAppliedBenefits]
  )

  const grossAfterLoyalty = Math.max(0, Math.round((gross - loyaltyDiscountAmount) * 100) / 100)

  const scPwdIdValid = applyScPwd && scPwdIdInput.trim().length >= 3
  const scPwdDiscountAmount = scPwdIdValid ? Math.round(gross * 0.20 * 100) / 100 : 0

  const discountedGross = Math.max(0, Math.round((grossAfterLoyalty - scPwdDiscountAmount) * 100) / 100)
  const loyaltyCardTotal = purchaseCard && !waiveCardFee ? LOYALTY_CARD_PRICE : 0
  const combinedGross = discountedGross + loyaltyCardTotal

  // ── Receipt label ────────────────────────────────────────────────────────
  function buildReceiptDiscountLabel(): string {
    const parts = autoAppliedBenefits.map((b) => {
      const svc = cardTemplate.find((t) => t.serviceKey === b.category)
      const lbl = svc?.label ?? b.category
      return b.discountPct >= 100 ? `Free ${lbl}` : `${b.discountPct}% off ${lbl}`
    })
    if (scPwdIdValid) parts.push(scPwdType === 'SC' ? 'SC 20% RA 9994' : 'PWD 20% RA 10754')
    return parts.join(' + ')
  }

  // ── Confirm ──────────────────────────────────────────────────────────────
  async function handleConfirm() {
    if (!paymentMethod) return
    setLoading(true)
    setError(null)
    try {
      const res = await confirmPayment({
        visitId: visitData.id,
        paymentMethod,
        loyaltyCardId: familyCard?.card.id ?? loyaltyCard?.id ?? null,
        loyaltyBenefits: autoAppliedBenefits,
        purchaseNewLoyaltyCard: purchaseCard,
        waiveCardFee: purchaseCard ? waiveCardFee : undefined,
        applyScPwdDiscount: scPwdIdValid,
        scPwdType: scPwdIdValid ? scPwdType : null,
        scPwdIdNumber: scPwdIdValid ? scPwdIdInput.trim() : null,
        notes: notes.trim() || undefined,
      })
      setResult(res)
      setConfirmed(true)
      if (printer) {
        try {
          const { buildReceiptBytes } = await import('@/lib/thermal')
          const addr = `${visitData.clinic.street}, ${visitData.clinic.city}, ${visitData.clinic.province} ${visitData.clinic.zip}`
          const bytes = await buildReceiptBytes({
            clinicName: visitData.clinic.name,
            clinicAddress: addr,
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
            discountLabel: buildReceiptDiscountLabel() || undefined,
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
      const addr = `${visitData.clinic.street}, ${visitData.clinic.city}, ${visitData.clinic.province} ${visitData.clinic.zip}`
      const bytes = await buildReceiptBytes({
        clinicName: visitData.clinic.name,
        clinicAddress: addr,
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
        discountLabel: buildReceiptDiscountLabel() || undefined,
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

  // ── Confirmed screen ─────────────────────────────────────────────────────
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
            <Button variant="outline" className="flex-1 min-h-[56px] gap-2" onClick={handleReprint}>
              <Printer className="w-4 h-4" />
              Reprint Receipt
            </Button>
          )}
          <Button className="flex-1 min-h-[56px]" onClick={() => router.push('/patients')}>
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

  // ── Checkout form ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">{error}</div>
      )}

      {/* ── 1. Visit Summary ─────────────────────────────────── */}
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

      {/* ── 2. Loyalty Card ──────────────────────────────────── */}
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

          {/* Active family card banner */}
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
                onClick={() => setFamilyCard(null)}
                className="text-xs text-blue-500 underline shrink-0 mt-0.5"
              >
                Remove
              </button>
            </div>
          )}

          {/* Own active card */}
          {!familyCard && loyaltyCard && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm">
              <p className="font-semibold text-green-900">Card #{loyaltyCard.cardNumber}</p>
              <p className="text-green-700 text-xs mt-0.5">Expires {fmtDate(loyaltyCard.expiryDate)}</p>
            </div>
          )}

          {/* Apply discount toggle — shown when a card is active (own or family) */}
          {effectiveCard && (
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="applyBenefits" className="flex-1 cursor-pointer text-sm">
                Apply card discount
              </Label>
              <Switch
                id="applyBenefits"
                checked={applyCardBenefits}
                onCheckedChange={setApplyCardBenefits}
                className="shrink-0"
              />
            </div>
          )}

          {/* No card — buy option */}
          {!loyaltyCard && !familyCard && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">This patient does not have a loyalty card.</p>
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
                <div className="flex items-center justify-between gap-3 pl-1 pt-2 border-t">
                  <div className="flex-1">
                    <Label htmlFor="waiveCardFee" className="cursor-pointer text-sm text-muted-foreground">
                      Waive card fee
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Card issued free — ₱0 added to total
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

          {/* Family card search */}
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
                {familySearching && <p className="text-xs text-muted-foreground px-1">Searching…</p>}
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
                  </button>
                ))}
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      {/* ── 3. SC/PWD Discount ───────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Gov&apos;t Discount</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="applyScPwd" className="flex-1 cursor-pointer text-sm">
              Apply 20% SC/PWD discount
            </Label>
            <Switch id="applyScPwd" checked={applyScPwd} onCheckedChange={setApplyScPwd} className="shrink-0" />
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
                {scPwdType === 'SC' ? 'RA 9994 — Senior Citizen 20% discount' : 'RA 10754 — PWD 20% discount'}
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

      {/* ── 4. Breakdown ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">

          {/* Itemized procedure lines (multi-proc with stored amounts) or single line */}
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

          {/* Auto-applied loyalty discounts */}
          {autoAppliedBenefits.map((b, i) => {
            const disc = b.discountPct >= 100
              ? b.serviceAmount
              : Math.round(b.serviceAmount * (b.discountPct / 100) * 100) / 100
            if (disc <= 0) return null
            const svc = cardTemplate.find((t) => t.serviceKey === b.category)
            const label = b.discountPct >= 100
              ? `Free ${svc?.label ?? b.category}`
              : `${b.discountPct}% off ${svc?.label ?? b.category}`
            return (
              <div key={i} className="flex justify-between text-red-600">
                <span>{label}</span>
                <span>-₱{fmt(disc)}</span>
              </div>
            )
          })}

          {/* SC/PWD */}
          {scPwdIdValid && (
            <div className="flex justify-between text-red-600">
              <span>{scPwdType === 'SC' ? 'SC 20% (RA 9994)' : 'PWD 20% (RA 10754)'}</span>
              <span>-₱{fmt(scPwdDiscountAmount)}</span>
            </div>
          )}

          {/* Loyalty card purchase */}
          {purchaseCard && (
            <div className="flex justify-between text-muted-foreground">
              <span>Loyalty card</span>
              {waiveCardFee
                ? <span className="text-emerald-600 font-medium">Waived</span>
                : <span>₱{fmt(LOYALTY_CARD_PRICE)}</span>
              }
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

      {/* ── 5. Notes ─────────────────────────────────────────── */}
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

      {/* ── 6. Payment Method ─────────────────────────────────── */}
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

      {/* ── 7. Confirm ───────────────────────────────────────── */}
      <Button
        className="w-full min-h-[56px] text-base font-semibold"
        disabled={!paymentMethod || loading}
        onClick={handleConfirm}
      >
        {loading ? 'Processing…' : `Confirm Payment — ₱${fmt(combinedGross)}`}
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
            <span className="text-muted-foreground">No printer — Set up in Settings → Receipt Printer</span>
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
