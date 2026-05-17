'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

type Patient = { id: string; firstName: string; lastName: string; phone: string }

const APPT_TYPES = [
  { value: 'CHECK_UP', label: 'Check-up' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'FILLING', label: 'Filling' },
  { value: 'EXTRACTION', label: 'Extraction' },
  { value: 'RCT', label: 'RCT' },
  { value: 'BRACES', label: 'Braces' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'OTHER', label: 'Other' },
]

type Props = {
  open: boolean
  onClose: () => void
  initialDatetime?: string // ISO string of pre-filled slot
  onConfirm: (data: { patientId: string; scheduledAt: string; type: string; notes?: string }) => Promise<void>
}

export default function AddAppointmentSheet({ open, onClose, initialDatetime, onConfirm }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Patient[]>([])
  const [selected, setSelected] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [type, setType] = useState('CHECK_UP')
  const [notes, setNotes] = useState('')
  const toLocalInput = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  const [datetime, setDatetime] = useState(() => toLocalInput(initialDatetime))
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    setSelected(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 2) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/patients/search?q=${encodeURIComponent(val)}`)
        setResults(await res.json())
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  async function handleConfirm() {
    if (!selected || !datetime) return
    setSubmitting(true)
    try {
      await onConfirm({
        patientId: selected.id,
        scheduledAt: new Date(datetime).toISOString(),
        type,
        notes: notes.trim() || undefined,
      })
      setQuery(''); setSelected(null); setResults([])
      setType('CHECK_UP'); setNotes(''); setDatetime('')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background rounded-t-2xl px-4 pt-4 pb-8 max-h-[90vh] overflow-y-auto flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Add Appointment</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient search */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Patient</label>
          <input
            className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search by name or phone…"
            value={query}
            onChange={handleQueryChange}
          />
          {loading && <p className="text-xs text-muted-foreground mt-1">Searching…</p>}
          {!selected && results.length > 0 && (
            <div className="flex flex-col gap-1 mt-2">
              {results.map((p) => (
                <button
                  key={p.id}
                  className="w-full text-left rounded-lg border px-4 py-2.5 min-h-[48px] hover:bg-muted"
                  onClick={() => { setSelected(p); setResults([]) }}
                >
                  <span className="font-medium text-sm">{p.firstName} {p.lastName}</span>
                  <span className="text-xs text-muted-foreground ml-2">{p.phone}</span>
                </button>
              ))}
            </div>
          )}
          {selected && (
            <div className="mt-2 rounded-lg bg-muted px-4 py-2.5 text-sm flex items-center justify-between">
              <span className="font-medium">{selected.firstName} {selected.lastName}</span>
              <button className="text-xs text-muted-foreground" onClick={() => { setSelected(null); setQuery('') }}>Change</button>
            </div>
          )}
        </div>

        {/* Date/time */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date &amp; Time</label>
          <input
            type="datetime-local"
            className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
          />
        </div>

        {/* Type */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Appointment Type</label>
          <div className="grid grid-cols-2 gap-2">
            {APPT_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={[
                  'rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px]',
                  type === t.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notes (optional)</label>
          <textarea
            className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. patient requested morning slot"
          />
        </div>

        <Button
          className="w-full min-h-[52px] text-base"
          disabled={!selected || !datetime || submitting}
          onClick={handleConfirm}
        >
          {submitting ? 'Scheduling…' : 'Schedule Appointment'}
        </Button>
      </div>
    </div>
  )
}
