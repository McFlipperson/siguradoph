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
import {
  confirmPayment,
  type CheckoutVisitData,
} from './actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = {
  visitData: CheckoutVisitData
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

export default function CheckoutClient({ visitData }: Props) {
  const router = useRouter()

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
  const loyaltyDiscountAmount = visitData.loyaltyInfo?.totalDiscount ?? 0
  const grossAfterLoyalty = Math.max(0, Math.round((gross - loyaltyDiscountAmount) * 100) / 100)

  const scPwdIdValid = applyScPwd && scPwdIdInput.trim().length >= 3
  const scPwdDiscountAmount = scPwdIdValid ? Math.round(gross * 0.20 * 100) / 100 : 0

  const discountedGross = Math.max(0, Math.round((grossAfterLoyalty - scPwdDiscountAmount) * 100) / 100)

  const cardPrice = visitData.clinic.loyaltyCardPrice
  const purchaseNewCard = visitData.loyaltyInfo?.purchaseNewCard ?? false
  const waiveCardFee = visitData.loyaltyInfo?.waiveCardFee ?? false
  const loyaltyCardTotal = purchaseNewCard && !waiveCardFee ? cardPrice : 0

  const combinedGross = Math.round((discountedGross + loyaltyCardTotal) * 100) / 100

  // ── Receipt discount label ───────────────────────────────────────────────
  function buildReceiptDiscountLabel(): string {
    const parts = (visitData.loyaltyInfo?.discountLines ?? []).map((l) => l.label)
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
            patientAddress: visitData.patientAddress || undefined,
            serviceDescription: visitData.treatment,
            procedureItems: visitData.procedures
              .filter(p => p.amount != null && p.amount > 0)
              .map(p => ({ name: p.name, amount: p.amount! })),
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
        patientAddress: visitData.patientAddress || undefined,
        serviceDescription: visitData.treatment,
        procedureItems: visitData.procedures
          .filter(p => p.amount != null && p.amount > 0)
          .map(p => ({ name: p.name, amount: p.amount! })),
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

      {/* ── 2. SC/PWD Discount ───────────────────────────────── */}
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

      {/* ── 3. Breakdown ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">

          {/* Itemized procedure lines */}
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

          {/* Pre-applied loyalty discounts (set at visit-recording time) */}
          {(visitData.loyaltyInfo?.discountLines ?? []).map((line, i) => (
            line.discountAmount > 0 ? (
              <div key={i} className="flex justify-between text-red-600">
                <span>{line.label}</span>
                <span>-₱{fmt(line.discountAmount)}</span>
              </div>
            ) : null
          ))}

          {/* SC/PWD */}
          {scPwdIdValid && (
            <div className="flex justify-between text-red-600">
              <span>{scPwdType === 'SC' ? 'SC 20% (RA 9994)' : 'PWD 20% (RA 10754)'}</span>
              <span>-₱{fmt(scPwdDiscountAmount)}</span>
            </div>
          )}

          {/* Loyalty card purchase (decided at visit time) */}
          {purchaseNewCard && (
            <div className="flex justify-between text-muted-foreground">
              <span>Loyalty card</span>
              {waiveCardFee
                ? <span className="text-emerald-600 font-medium">Waived</span>
                : <span>₱{fmt(cardPrice)}</span>
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

      {/* ── 4. Notes ─────────────────────────────────────────── */}
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

      {/* ── 5. Payment Method ─────────────────────────────────── */}
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

      {/* ── 6. Confirm ───────────────────────────────────────── */}
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
