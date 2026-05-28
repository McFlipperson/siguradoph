'use client'

import { useState, useTransition, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { saveVisit } from '../actions'
import { searchPatientLoyaltyCard, type FamilyCardResult } from '../../payments/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { SERVICE_CARD_FIELDS, type LoyaltyBenefitApplication } from '@/lib/loyaltyConfig'
import type { VisitSetup, VisitLoyaltyCard } from '../actions'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

const REMINDER_OPTIONS = [
  { label: '4 weeks', value: 4 },
  { label: '5 weeks', value: 5 },
  { label: '6 weeks', value: 6 },
]

const inputClass =
  'w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring'
const textareaClass =
  'w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-none'

type ProcedureEntry = {
  uid: string
  serviceId: string | null
  serviceName: string
  category: string   // resolved from service catalog
  diagnosis: string
  toothNumber: string
}

let _uidCounter = 0
function makeUid() { return `proc-${++_uidCounter}-${Date.now()}` }

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function NewVisitForm({ setup, appointmentId }: { setup: VisitSetup; appointmentId?: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<'checkout' | 'save' | null>(null)

  function nowPHT(): string {
    const pht = new Date(Date.now() + 8 * 60 * 60 * 1000)
    return pht.toISOString().slice(0, 16)
  }
  const todayPHT = nowPHT()
  const minDate = new Date(setup.clinic.enrollmentDate).toISOString().split('T')[0]

  // ── Visit fields ─────────────────────────────────────────────────────────
  const [visitDate, setVisitDate] = useState(todayPHT)
  const [procedures, setProcedures] = useState<ProcedureEntry[]>([])
  const [price, setPrice] = useState('')
  const [procPrices, setProcPrices] = useState<Record<string, string>>({})
  const [isBracesReminder, setIsBracesReminder] = useState(false)
  const [reminderWeeks, setReminderWeeks] = useState(4)
  const [notes, setNotes] = useState('')

  function addProcedure(serviceId: string, serviceName: string, category: string) {
    setProcedures((prev) => [...prev, { uid: makeUid(), serviceId, serviceName, category, diagnosis: '', toothNumber: '' }])
  }
  function addOther() {
    setProcedures((prev) => [...prev, { uid: makeUid(), serviceId: null, serviceName: '', category: 'OTHER', diagnosis: '', toothNumber: '' }])
  }
  function removeProcedure(uid: string) {
    setProcedures((prev) => prev.filter((p) => p.uid !== uid))
  }
  function updateProcedure(uid: string, field: 'serviceName' | 'diagnosis' | 'toothNumber', value: string) {
    setProcedures((prev) => prev.map((p) => (p.uid === uid ? { ...p, [field]: value } : p)))
  }

  const addedIds = procedures.map((p) => p.serviceId)
  const isMultiProc = procedures.length > 1

  const isBracesCategory = procedures.some((p) => p.category === 'BRACES')
  const isCleaningCategory = procedures.some((p) => p.category === 'CLEANING')

  const multiGross = isMultiProc
    ? procedures.reduce((sum, p) => sum + (parseFloat(procPrices[p.uid] ?? '') || 0), 0)
    : 0
  const gross = isMultiProc ? multiGross : (parseFloat(price) || 0)
  const allProcsHavePrice = isMultiProc
    ? procedures.every((p) => (parseFloat(procPrices[p.uid] ?? '') || 0) > 0)
    : gross > 0

  // ── Loyalty card ─────────────────────────────────────────────────────────
  const hasPendingRenewal = setup.patient.pendingLoyaltyCardPurchase && !setup.loyaltyCard
  const [purchaseCard, setPurchaseCard] = useState(hasPendingRenewal)
  const [waiveCardFee, setWaiveCardFee] = useState(false)
  const [applyCardBenefits, setApplyCardBenefits] = useState(true)

  const [familyCard, setFamilyCard] = useState<FamilyCardResult | null>(null)
  const [familyCardOpen, setFamilyCardOpen] = useState(false)
  const [familyQuery, setFamilyQuery] = useState('')
  const [familySearching, setFamilySearching] = useState(false)
  const [familyResults, setFamilyResults] = useState<FamilyCardResult[]>([])
  const familyDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (familyDebounce.current) clearTimeout(familyDebounce.current)
    if (familyQuery.trim().length < 2) { setFamilyResults([]); return }
    familyDebounce.current = setTimeout(async () => {
      setFamilySearching(true)
      try { setFamilyResults(await searchPatientLoyaltyCard(familyQuery, setup.patient.id)) }
      finally { setFamilySearching(false) }
    }, 350)
    return () => { if (familyDebounce.current) clearTimeout(familyDebounce.current) }
  }, [familyQuery, setup.patient.id])

  function selectFamilyCard(r: FamilyCardResult) {
    setFamilyCard(r)
    setFamilyResults([])
    setFamilyQuery('')
    setFamilyCardOpen(false)
    setPurchaseCard(false)
  }

  function handlePurchaseCardToggle(val: boolean) {
    setPurchaseCard(val)
    if (!val) setWaiveCardFee(false)
  }

  // Resolve which card to use for benefits — family card > own card > virtual new card.
  // When purchasing a new card, we build a virtual card with full uses from the template
  // so benefits apply to this visit immediately. The real card is created at payment time.
  const effectiveCard = useMemo<VisitLoyaltyCard | null>(() => {
    if (familyCard?.card) return familyCard.card
    if (setup.loyaltyCard) return setup.loyaltyCard
    if (!purchaseCard) return null
    // Build virtual card from template
    const uses: Record<string, number> = {}
    for (const svc of setup.cardTemplate) {
      if (svc.isFree) continue
      const fields = SERVICE_CARD_FIELDS[svc.serviceKey]
      if (!fields) continue
      uses[fields.t1Field] = svc.tier1Uses
      if (fields.t2Field && svc.hasTier2) uses[fields.t2Field] = svc.tier2Uses
    }
    return {
      id: 'new',
      cardNumber: 'NEW',
      expiryDate: new Date(),
      cleaningUses50: uses.cleaningUses50 ?? 0,
      cleaningUses25: uses.cleaningUses25 ?? 0,
      fillingUses50: uses.fillingUses50 ?? 0,
      fillingUses25: uses.fillingUses25 ?? 0,
      rctUses: uses.rctUses ?? 0,
      dentureUses: uses.dentureUses ?? 0,
      bracesUses: uses.bracesUses ?? 0,
      wisdomToothUses: uses.wisdomToothUses ?? 0,
      extractionUses: uses.extractionUses ?? 0,
    }
  }, [familyCard, setup.loyaltyCard, purchaseCard, setup.cardTemplate])

  // Auto-apply benefits from the effective card based on procedure categories + prices
  const autoAppliedBenefits = useMemo<LoyaltyBenefitApplication[]>(() => {
    if (!effectiveCard || !applyCardBenefits || procedures.length === 0) return []

    return procedures.flatMap((proc) => {
      const amt = isMultiProc
        ? (parseFloat(procPrices[proc.uid] ?? '') || 0)
        : gross
      if (amt <= 0) return []

      const category = proc.category
      if (category === 'CHECKUP') {
        return setup.cardTemplate.some((t) => t.isFree)
          ? [{ benefitKey: 'CHECKUP', category: 'CHECKUP', discountPct: 100, serviceAmount: amt }]
          : []
      }

      const fields = SERVICE_CARD_FIELDS[category]
      if (!fields) return []
      const svc = setup.cardTemplate.find((t) => t.serviceKey === category)
      if (!svc) return []

      const t1 = (effectiveCard as unknown as Record<string, number>)[fields.t1Field] ?? 0
      if (t1 > 0) {
        return [{ benefitKey: fields.t1Key, category, discountPct: svc.tier1Discount, serviceAmount: amt }]
      }
      if (svc.hasTier2 && fields.t2Field && fields.t2Key) {
        const t2 = (effectiveCard as unknown as Record<string, number>)[fields.t2Field] ?? 0
        if (t2 > 0) {
          return [{ benefitKey: fields.t2Key, category, discountPct: svc.tier2Discount, serviceAmount: amt }]
        }
      }
      return []
    })
  }, [effectiveCard, applyCardBenefits, procedures, procPrices, gross, isMultiProc, setup.cardTemplate])

  const loyaltyDiscountAmount = useMemo(() =>
    autoAppliedBenefits.reduce((sum, b) => {
      return sum + (b.discountPct >= 100 ? b.serviceAmount : Math.round(b.serviceAmount * (b.discountPct / 100) * 100) / 100)
    }, 0),
    [autoAppliedBenefits]
  )

  const loyaltyCardFee = purchaseCard && !waiveCardFee ? setup.clinic.loyaltyCardPrice : 0
  const netTotal = Math.max(0, Math.round((gross - loyaltyDiscountAmount) * 100) / 100) + loyaltyCardFee

  // ── Validation ────────────────────────────────────────────────────────────
  const canSubmit =
    visitDate &&
    procedures.length > 0 &&
    procedures.every((p) => p.serviceName.trim() && p.diagnosis.trim()) &&
    allProcsHavePrice &&
    notes.trim().length >= 1 &&
    !isPending

  // ── Submit ────────────────────────────────────────────────────────────────
  function submit(action: 'checkout' | 'save') {
    if (!canSubmit) return
    setPendingAction(action)

    const treatment = procedures.map((p) => p.serviceName).join(', ')
    const diagnosis =
      procedures.length === 1
        ? procedures[0].diagnosis
        : procedures.map((p) => `${p.serviceName}: ${p.diagnosis}`).join('; ')
    const toothNumber = procedures.map((p) => p.toothNumber.trim()).filter(Boolean).join(', ') || undefined

    const bracesEntry = procedures.find((p) => p.category === 'BRACES')

    const procedureAmounts = isMultiProc
      ? procedures.map((p) => ({ name: p.serviceName, amount: parseFloat(procPrices[p.uid] ?? '') || 0 }))
      : undefined

    startTransition(async () => {
      const visitId = await saveVisit({
        patientId: setup.patient.id,
        visitDate,
        diagnosis,
        toothNumber,
        treatment,
        notes,
        grossAmount: gross,
        procedureAmounts,
        isBracesReminder: isBracesCategory && isBracesReminder && !!bracesEntry,
        reminderWeeks: isBracesCategory && isBracesReminder ? reminderWeeks : undefined,
        isCleaningService: isCleaningCategory,
        appointmentId,
        // Loyalty
        // 'new' is the virtual card id — real card created at payment; confirmPayment uses newLoyaltyCardId
        appliedLoyaltyCardId: effectiveCard && applyCardBenefits && effectiveCard.id !== 'new' ? effectiveCard.id : undefined,
        purchaseNewLoyaltyCard: purchaseCard,
        waiveCardFee: purchaseCard ? waiveCardFee : undefined,
        loyaltyBenefits: autoAppliedBenefits.length > 0 ? autoAppliedBenefits : undefined,
      })
      if (action === 'checkout') {
        router.push(`/payments?visitId=${visitId}`)
      } else {
        router.push(`/patients/${setup.patient.id}`)
      }
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Patient header */}
      <div className="text-sm text-muted-foreground">
        Patient:{' '}
        <span className="font-semibold text-foreground">
          {setup.patient.firstName} {setup.patient.lastName}
        </span>
      </div>

      {/* Visit date */}
      <Card>
        <CardHeader><CardTitle>Visit Details</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            <Label>Visit Date &amp; Time<span className="text-destructive ml-0.5">*</span></Label>
            <input
              type="datetime-local"
              className={inputClass}
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              max={todayPHT}
              min={minDate}
            />
          </div>
        </CardContent>
      </Card>

      {/* Procedure picker */}
      <Card>
        <CardHeader>
          <CardTitle>Procedures<span className="text-destructive ml-0.5">*</span></CardTitle>
        </CardHeader>
        <CardContent>
          {setup.serviceCatalog.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services configured yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {setup.serviceCatalog.map((svc) => {
                const count = addedIds.filter((id) => id === svc.id).length
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => addProcedure(svc.id, svc.name, svc.category)}
                    className={`relative min-h-[48px] rounded-lg border-2 px-3 py-2 text-sm font-medium text-left transition-colors ${
                      count > 0
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-foreground hover:bg-muted'
                    }`}
                  >
                    {svc.name}
                    {count > 1 && (
                      <span className="absolute top-1 right-1.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                        ×{count}
                      </span>
                    )}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={addOther}
                className="min-h-[48px] rounded-lg border-2 border-dashed border-muted-foreground/40 bg-background px-3 py-2 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 text-left transition-colors"
              >
                + Other
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* One card per procedure */}
      {procedures.map((proc, i) => (
        <Card key={proc.uid} className="border-primary/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {proc.serviceId ? (
                  <CardTitle className="text-base">{proc.serviceName}</CardTitle>
                ) : (
                  <input
                    className="flex-1 min-h-[40px] rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Procedure name…"
                    value={proc.serviceName}
                    onChange={(e) => updateProcedure(proc.uid, 'serviceName', e.target.value)}
                    autoFocus
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => removeProcedure(proc.uid)}
                className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors text-lg"
                aria-label="Remove"
              >
                ×
              </button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            <div className="flex flex-col gap-1.5">
              <Label>Diagnosis<span className="text-destructive ml-0.5">*</span></Label>
              <input
                className={inputClass}
                value={proc.diagnosis}
                onChange={(e) => updateProcedure(proc.uid, 'diagnosis', e.target.value)}
                placeholder="e.g. Dental caries, tooth decay"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Tooth Number <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <input
                className={inputClass}
                value={proc.toothNumber}
                onChange={(e) => updateProcedure(proc.uid, 'toothNumber', e.target.value)}
                placeholder="e.g. 16, 36"
              />
            </div>
            {isMultiProc && (
              <div className="flex flex-col gap-1.5">
                <Label>Price<span className="text-destructive ml-0.5">*</span></Label>
                <input
                  type="number"
                  inputMode="decimal"
                  className={inputClass}
                  value={procPrices[proc.uid] ?? ''}
                  onChange={(e) => setProcPrices((prev) => ({ ...prev, [proc.uid]: e.target.value }))}
                  placeholder="0.00"
                  min={0}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Single-proc price */}
      {!isMultiProc && procedures.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Price<span className="text-destructive ml-0.5">*</span></CardTitle></CardHeader>
          <CardContent>
            <input
              type="number"
              inputMode="decimal"
              className={inputClass}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              min={0}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Loyalty Card ─────────────────────────────────────────────────── */}
      {procedures.length > 0 && gross > 0 && (
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

            {/* Family card banner */}
            {familyCard && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 flex items-start justify-between gap-2">
                <div className="text-sm">
                  <p className="font-semibold text-blue-900">Using {familyCard.holderName}&apos;s card</p>
                  <p className="text-blue-700 text-xs mt-0.5">
                    #{familyCard.card.cardNumber} · expires {fmtDate(familyCard.card.expiryDate)}
                  </p>
                </div>
                <button type="button" onClick={() => setFamilyCard(null)} className="text-xs text-blue-500 underline shrink-0 mt-0.5">
                  Remove
                </button>
              </div>
            )}

            {/* Own active card */}
            {!familyCard && setup.loyaltyCard && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm">
                <p className="font-semibold text-green-900">Card #{setup.loyaltyCard.cardNumber}</p>
                <p className="text-green-700 text-xs mt-0.5">Expires {fmtDate(setup.loyaltyCard.expiryDate)}</p>
              </div>
            )}

            {/* Apply discount toggle — when a card is active */}
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
            {!setup.loyaltyCard && !familyCard && (
              <div className="space-y-3">
                {!hasPendingRenewal && (
                  <p className="text-sm text-muted-foreground">This patient does not have a loyalty card.</p>
                )}
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="purchaseCard" className="flex-1 cursor-pointer">
                    Purchase loyalty card — ₱{formatMoney(setup.clinic.loyaltyCardPrice)}
                  </Label>
                  <Switch
                    id="purchaseCard"
                    checked={purchaseCard}
                    onCheckedChange={handlePurchaseCardToggle}
                    className="shrink-0"
                  />
                </div>
                {purchaseCard && (
                  <>
                    {/* New card banner — shows benefits apply now */}
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-900">
                      New card benefits apply to this visit automatically.
                    </div>
                    <div className="flex items-center justify-between gap-3 pl-1 pt-2 border-t">
                      <div className="flex-1">
                        <Label htmlFor="waiveCardFee" className="cursor-pointer text-sm text-muted-foreground">
                          Waive card fee
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">Card issued free — ₱0 added to total</p>
                      </div>
                      <Switch
                        id="waiveCardFee"
                        checked={waiveCardFee}
                        onCheckedChange={setWaiveCardFee}
                        className="shrink-0"
                      />
                    </div>
                  </>
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
      )}

      {/* ── Price summary ─────────────────────────────────────────────────── */}
      {gross > 0 && (
        <Card>
          <CardContent className="py-3 flex flex-col gap-1 text-sm">
            {/* Itemized procedures (multi) or single line */}
            {isMultiProc ? (
              procedures.map((p) => {
                const amt = parseFloat(procPrices[p.uid] ?? '') || 0
                return amt > 0 ? (
                  <div key={p.uid} className="flex justify-between text-muted-foreground">
                    <span>{p.serviceName}</span>
                    <span>₱{formatMoney(amt)}</span>
                  </div>
                ) : null
              })
            ) : (
              <div className="flex justify-between text-muted-foreground">
                <span>Service</span>
                <span>₱{formatMoney(gross)}</span>
              </div>
            )}

            {/* Applied loyalty discounts */}
            {autoAppliedBenefits.map((b, i) => {
              const disc = b.discountPct >= 100
                ? b.serviceAmount
                : Math.round(b.serviceAmount * (b.discountPct / 100) * 100) / 100
              if (disc <= 0) return null
              const svc = setup.cardTemplate.find((t) => t.serviceKey === b.category)
              const label = b.discountPct >= 100
                ? `Free ${svc?.label ?? b.category}`
                : `${b.discountPct}% off ${svc?.label ?? b.category}`
              return (
                <div key={i} className="flex justify-between text-red-600">
                  <span>{label}</span>
                  <span>-₱{formatMoney(disc)}</span>
                </div>
              )
            })}

            {/* Card purchase fee */}
            {purchaseCard && (
              <div className="flex justify-between text-muted-foreground">
                <span>Loyalty card</span>
                {waiveCardFee
                  ? <span className="text-emerald-600 font-medium">Waived</span>
                  : <span>₱{formatMoney(setup.clinic.loyaltyCardPrice)}</span>
                }
              </div>
            )}

            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>₱{formatMoney(netTotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-600">
              <span>VAT-Exempt (NIRC §109)</span>
              <span>₱0.00</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Braces reminder toggle */}
      {isBracesCategory && (
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isBracesReminder}
                onClick={() => setIsBracesReminder((v) => !v)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${isBracesReminder ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`pointer-events-none inline-block h-6 w-6 translate-y-0.5 rounded-full bg-white shadow transition-transform ${isBracesReminder ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm font-medium">This is a braces alignment visit</span>
            </div>
            {isBracesReminder && (
              <div className="flex flex-col gap-1.5">
                <Label>Reminder interval</Label>
                <select className={inputClass} value={reminderWeeks} onChange={(e) => setReminderWeeks(Number(e.target.value))}>
                  {REMINDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cleaning recall notice */}
      {isCleaningCategory && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              📅 A 6-month recall reminder will be scheduled automatically for this patient via Messenger.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader><CardTitle>Notes<span className="text-destructive ml-0.5">*</span></CardTitle></CardHeader>
        <CardContent>
          <textarea
            className={textareaClass}
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Treatment notes, observations, next steps, patient concerns…"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button onClick={() => submit('checkout')} disabled={!canSubmit} className="w-full min-h-[56px] text-base">
          {pendingAction === 'checkout' && isPending ? 'Saving…' : 'Save and Proceed to Checkout'}
        </Button>
        <Button variant="outline" onClick={() => submit('save')} disabled={!canSubmit} className="w-full min-h-[56px] text-base">
          {pendingAction === 'save' && isPending ? 'Saving…' : 'Save Only'}
        </Button>
      </div>
    </div>
  )
}
