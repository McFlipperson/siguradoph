'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { setPendingLoyaltyCard, updateClinicLoyaltySettings, updateLoyaltyCard } from './actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UsageHistory = {
  id: string
  serviceType: string
  discountPct: number
  discountAmount: number
  invoiceId: string
  usedAt: string
}

type CardUses = {
  cleaningUses50: number
  cleaningUses25: number
  fillingUses50: number
  fillingUses25: number
  rctUses: number
  dentureUses: number
  bracesUses: number
  wisdomToothUses: number
  extractionUses: number
}

type LoyaltyCard = {
  id: string
  patientId: string
  patientName: string
  cardNumber: string
  purchaseDate: string
  expiryDate: string
  isActive: boolean
  status: 'ACTIVE' | 'EXPIRED' | 'EXHAUSTED'
  usageSummary: string[]
  usageHistory: UsageHistory[]
  uses: CardUses
}

type ClinicSettings = {
  loyaltyCardEnabled: boolean
  loyaltyCardPrice: number
  loyaltyValidityMonths: number
}

type Props = {
  cards: LoyaltyCard[]
  settings: ClinicSettings
}

type FilterChip = 'ALL' | 'ACTIVE' | 'EXPIRED' | 'EXHAUSTED'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(n)
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-red-100 text-red-800',
  EXHAUSTED: 'bg-amber-100 text-amber-800',
}

const USE_FIELDS: { key: keyof CardUses; label: string }[] = [
  { key: 'cleaningUses50',  label: 'Cleaning 50%'    },
  { key: 'cleaningUses25',  label: 'Cleaning 25%'    },
  { key: 'fillingUses50',   label: 'Filling 50%'     },
  { key: 'fillingUses25',   label: 'Filling 25%'     },
  { key: 'rctUses',         label: 'RCT'             },
  { key: 'dentureUses',     label: 'Dentures'        },
  { key: 'bracesUses',      label: 'Braces'          },
  { key: 'wisdomToothUses', label: 'Wisdom Tooth'    },
  { key: 'extractionUses',  label: 'Extraction'      },
]

// ---------------------------------------------------------------------------
// Settings section
// ---------------------------------------------------------------------------

function SettingsSection({ settings }: { settings: ClinicSettings }) {
  const [editing, setEditing] = useState(false)
  const [enabled, setEnabled] = useState(settings.loyaltyCardEnabled)
  const [price, setPrice] = useState(String(settings.loyaltyCardPrice))
  const [months, setMonths] = useState(String(settings.loyaltyValidityMonths))
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const priceNum = parseFloat(price)
    const monthsNum = parseInt(months)
    if (!priceNum || priceNum <= 0 || !monthsNum || monthsNum <= 0) return
    setSaving(true)
    try {
      await updateClinicLoyaltySettings({
        loyaltyCardEnabled: enabled,
        loyaltyCardPrice: priceNum,
        loyaltyValidityMonths: monthsNum,
      })
      toast.success('Settings saved')
      setEditing(false)
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setEnabled(settings.loyaltyCardEnabled)
    setPrice(String(settings.loyaltyCardPrice))
    setMonths(String(settings.loyaltyValidityMonths))
    setEditing(false)
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Card Settings</p>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-primary underline underline-offset-2"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="loyaltyEnabled" className="text-sm flex-1">Loyalty cards enabled</Label>
              <Switch id="loyaltyEnabled" checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Card price (₱)</Label>
              <Input
                type="number"
                inputMode="decimal"
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="min-h-[48px]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Card validity (months)</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                className="min-h-[48px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="min-h-[48px]" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button className="min-h-[48px]" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${settings.loyaltyCardEnabled ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                {settings.loyaltyCardEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Card price</span>
              <span className="font-medium">₱{fmt(settings.loyaltyCardPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Card validity</span>
              <span className="font-medium">{settings.loyaltyValidityMonths} months</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Card edit form (inline)
// ---------------------------------------------------------------------------

function CardEditForm({ card, onDone }: { card: LoyaltyCard; onDone: () => void }) {
  const [uses, setUses] = useState<CardUses>({ ...card.uses })
  const [expiry, setExpiry] = useState(card.expiryDate.split('T')[0])
  const [saving, setSaving] = useState(false)

  function setUse(key: keyof CardUses, val: string) {
    const n = parseInt(val) || 0
    setUses((prev) => ({ ...prev, [key]: Math.max(0, n) }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateLoyaltyCard(card.id, { ...uses, expiryDate: expiry })
      toast.success('Card updated')
      onDone()
    } catch {
      toast.error('Failed to update card')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 pt-3 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Edit Card</p>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Expiry date</Label>
        <Input
          type="date"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          className="min-h-[48px]"
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Remaining uses</p>
        {USE_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-sm flex-1">{label}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUse(key, String(uses[key] - 1))}
                className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-lg font-bold text-muted-foreground active:bg-muted"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-semibold tabular-nums">{uses[key]}</span>
              <button
                type="button"
                onClick={() => setUse(key, String(uses[key] + 1))}
                className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-lg font-bold text-muted-foreground active:bg-muted"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="min-h-[48px]" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button className="min-h-[48px]" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Card'}
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Card expanded detail component
// ---------------------------------------------------------------------------

function CardDetail({
  card,
  onRenew,
}: {
  card: LoyaltyCard
  onRenew: () => void
}) {
  const router = useRouter()
  const isExpired = new Date(card.expiryDate) <= new Date()
  const [editMode, setEditMode] = useState(false)

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      {/* Patient link */}
      <button
        onClick={() => router.push('/patients/' + card.patientId)}
        className="text-primary font-semibold text-sm underline underline-offset-2"
      >
        {card.patientName}
      </button>

      {/* Card info */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Card #</span>
          <span className="font-medium">{card.cardNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Purchased</span>
          <span>{fmtDate(card.purchaseDate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Expires</span>
          <span className={isExpired ? 'text-red-600 font-medium' : ''}>{fmtDate(card.expiryDate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[card.status]}`}>
            {card.status}
          </span>
        </div>
      </div>

      {editMode ? (
        <CardEditForm card={card} onDone={() => setEditMode(false)} />
      ) : (
        <>
          {/* Uses table */}
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Service Uses</p>
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="text-xs text-primary underline underline-offset-2"
              >
                Edit card
              </button>
            </div>
            <div className="flex text-xs font-semibold text-muted-foreground">
              <span className="flex-1">Service</span>
              <span className="w-16 text-center">Remaining</span>
            </div>
            {USE_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex text-sm py-1 border-b border-border/50 last:border-0">
                <span className="flex-1 text-xs">{label}</span>
                <span className={`w-16 text-center text-xs font-medium ${card.uses[key] === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {card.uses[key]}
                </span>
              </div>
            ))}
            <div className="flex text-sm py-1">
              <span className="flex-1 text-xs">Check-up</span>
              <span className="w-16 text-center text-xs font-medium">∞</span>
            </div>
          </div>

          {/* Usage history */}
          {card.usageHistory.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Usage History</p>
              {[...card.usageHistory]
                .sort((a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime())
                .map((u) => (
                  <div key={u.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{fmtDate(u.usedAt)}</span>
                    <span>·</span>
                    <span>{u.serviceType}</span>
                    <span>·</span>
                    <span>{u.discountPct}%</span>
                    <span>·</span>
                    <button
                      onClick={() => router.push('/invoices/' + u.invoiceId)}
                      className="text-primary underline underline-offset-1"
                    >
                      OR
                    </button>
                  </div>
                ))}
            </div>
          )}

          {/* Renew button */}
          {(card.status === 'EXPIRED' || card.status === 'EXHAUSTED') && (
            <Button
              className="w-full min-h-[48px] mt-2"
              variant="outline"
              onClick={onRenew}
            >
              Renew Card — ₱500
            </Button>
          )}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LoyaltyClient({ cards, settings }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterChip>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [renewingCard, setRenewingCard] = useState<LoyaltyCard | null>(null)
  const [confirmingRenew, setConfirmingRenew] = useState(false)

  const stats = useMemo(() => ({
    active:    cards.filter((c) => c.status === 'ACTIVE').length,
    expired:   cards.filter((c) => c.status === 'EXPIRED').length,
    exhausted: cards.filter((c) => c.status === 'EXHAUSTED').length,
  }), [cards])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return cards.filter((card) => {
      if (q && !card.patientName.toLowerCase().includes(q) && !card.cardNumber.toLowerCase().includes(q)) return false
      if (filter !== 'ALL' && card.status !== filter) return false
      return true
    })
  }, [cards, search, filter])

  async function handleRenewConfirm() {
    if (!renewingCard) return
    setConfirmingRenew(true)
    try {
      await setPendingLoyaltyCard(renewingCard.patientId)
      toast.success('Renewal pending — will be invoiced at next checkout.')
      setRenewingCard(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to set renewal')
    } finally {
      setConfirmingRenew(false)
    }
  }

  const CHIPS: { key: FilterChip; label: string }[] = [
    { key: 'ALL',       label: 'All'       },
    { key: 'ACTIVE',    label: 'Active'    },
    { key: 'EXPIRED',   label: 'Expired'   },
    { key: 'EXHAUSTED', label: 'Exhausted' },
  ]

  return (
    <div className="space-y-4">

      {/* ── Clinic settings ── */}
      <SettingsSection settings={settings} />

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.expired}</p>
            <p className="text-xs text-muted-foreground">Expired</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.exhausted}</p>
            <p className="text-xs text-muted-foreground">Exhausted</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Search ── */}
      <Input
        placeholder="Search by patient or card #…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="min-h-[48px]"
      />

      {/* ── Filter chips ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {CHIPS.map((chip) => (
          <button
            key={chip.key}
            onClick={() => setFilter(chip.key)}
            className={[
              'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors',
              filter === chip.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border',
            ].join(' ')}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ── Card list ── */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No loyalty cards found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((card) => {
            const isExpanded = expandedId === card.id
            const isExpired = new Date(card.expiryDate) <= new Date()

            return (
              <Card key={card.id}>
                <CardContent className="p-4">
                  <button
                    className="w-full text-left"
                    onClick={() => setExpandedId(isExpanded ? null : card.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-base truncate">{card.patientName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{card.cardNumber}</p>
                        {card.usageSummary.length > 0 ? (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {card.usageSummary.slice(0, 3).join(' · ')}
                            {card.usageSummary.length > 3 ? ' …' : ''}
                          </p>
                        ) : (
                          <p className="text-xs text-amber-700 mt-1">All uses exhausted</p>
                        )}
                        <p className={`text-xs mt-1 ${isExpired ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                          {isExpired ? `Expired ${fmtDate(card.expiryDate)}` : `Valid until ${fmtDate(card.expiryDate)}`}
                        </p>
                      </div>
                      <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${STATUS_BADGE[card.status]}`}>
                        {card.status}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <CardDetail
                      card={card}
                      onRenew={() => setRenewingCard(card)}
                    />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Renew confirmation sheet ── */}
      {renewingCard && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setRenewingCard(null)}
          />
          <div className="relative w-full bg-background rounded-t-2xl p-6 space-y-4 max-w-screen-sm mx-auto">
            <p className="font-semibold text-base">
              Issue a new loyalty card for {renewingCard.patientName}?
            </p>
            <p className="text-sm text-muted-foreground">
              ₱500 will be added to their next invoice.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="min-h-[48px]"
                onClick={() => setRenewingCard(null)}
                disabled={confirmingRenew}
              >
                Cancel
              </Button>
              <Button
                className="min-h-[48px]"
                onClick={handleRenewConfirm}
                disabled={confirmingRenew}
              >
                {confirmingRenew ? 'Saving…' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
