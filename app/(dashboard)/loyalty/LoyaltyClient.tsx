'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { setPendingLoyaltyCard } from './actions'

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
  uses: {
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
}

type Props = {
  cards: LoyaltyCard[]
}

type FilterChip = 'ALL' | 'ACTIVE' | 'EXPIRED' | 'EXHAUSTED'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-red-100 text-red-800',
  EXHAUSTED: 'bg-amber-100 text-amber-800',
}

// Service rows for the uses table
type ServiceRow = {
  label: string
  initial: number
  remaining: number
  isInfinite?: boolean
}

function getServiceRows(uses: LoyaltyCard['uses']): ServiceRow[] {
  return [
    { label: 'Cleaning 50%', initial: 2, remaining: uses.cleaningUses50 },
    { label: 'Cleaning 25%', initial: 2, remaining: uses.cleaningUses25 },
    { label: 'Tooth Filling 50%', initial: 2, remaining: uses.fillingUses50 },
    { label: 'Tooth Filling 25%', initial: 2, remaining: uses.fillingUses25 },
    { label: 'RCT', initial: 2, remaining: uses.rctUses },
    { label: 'Dentures', initial: 2, remaining: uses.dentureUses },
    { label: 'Braces', initial: 2, remaining: uses.bracesUses },
    { label: 'Wisdom Tooth', initial: 2, remaining: uses.wisdomToothUses },
    { label: 'Extraction', initial: 8, remaining: uses.extractionUses },
    { label: 'Check-up', initial: 0, remaining: 0, isInfinite: true },
  ]
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
  const rows = getServiceRows(card.uses)
  const isExpired = new Date(card.expiryDate) <= new Date()

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

      {/* Uses table (flex rows, no HTML table) */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Service Uses</p>
        {/* Header row */}
        <div className="flex text-xs font-semibold text-muted-foreground">
          <span className="flex-1">Service</span>
          <span className="w-12 text-center">Total</span>
          <span className="w-12 text-center">Used</span>
          <span className="w-16 text-center">Left</span>
        </div>
        {rows.map((row) => {
          const used = row.isInfinite ? null : row.initial - row.remaining
          return (
            <div key={row.label} className="flex text-sm py-1 border-b border-border/50 last:border-0">
              <span className="flex-1 text-xs">{row.label}</span>
              <span className="w-12 text-center text-xs text-muted-foreground">
                {row.isInfinite ? '∞' : row.initial}
              </span>
              <span className="w-12 text-center text-xs text-muted-foreground">
                {row.isInfinite ? '—' : used}
              </span>
              <span className="w-16 text-center text-xs font-medium">
                {row.isInfinite ? '∞' : row.remaining}
              </span>
            </div>
          )
        })}
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

      {/* Renew button for EXPIRED or EXHAUSTED */}
      {(card.status === 'EXPIRED' || card.status === 'EXHAUSTED') && (
        <Button
          className="w-full min-h-[48px] mt-2"
          variant="outline"
          onClick={onRenew}
        >
          Renew Card — ₱500
        </Button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LoyaltyClient({ cards }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterChip>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [renewingCard, setRenewingCard] = useState<LoyaltyCard | null>(null)
  const [confirmingRenew, setConfirmingRenew] = useState(false)

  // Stats
  const stats = useMemo(() => {
    const active = cards.filter((c) => c.status === 'ACTIVE').length
    const expired = cards.filter((c) => c.status === 'EXPIRED').length
    const exhausted = cards.filter((c) => c.status === 'EXHAUSTED').length
    return { active, expired, exhausted }
  }, [cards])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return cards.filter((card) => {
      if (q) {
        const matches =
          card.patientName.toLowerCase().includes(q) ||
          card.cardNumber.toLowerCase().includes(q)
        if (!matches) return false
      }
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
    { key: 'ALL', label: 'All' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'EXPIRED', label: 'Expired' },
    { key: 'EXHAUSTED', label: 'Exhausted' },
  ]

  return (
    <div className="space-y-4">
      {/* Stats row */}
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

      {/* Search */}
      <Input
        placeholder="Search by patient or card #…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="min-h-[48px]"
      />

      {/* Filter chips */}
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

      {/* Card list */}
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
                  {/* Summary row (always visible) */}
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

                  {/* Expanded detail */}
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

      {/* Renew confirmation */}
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
