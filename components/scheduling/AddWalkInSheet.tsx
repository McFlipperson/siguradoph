'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

type Patient = { id: string; firstName: string; lastName: string; phone: string }

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: (patientId: string) => Promise<void>
}

export default function AddWalkInSheet({ open, onClose, onConfirm }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Patient[]>([])
  const [selected, setSelected] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
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
    if (!selected) return
    setSubmitting(true)
    try {
      await onConfirm(selected.id)
      setQuery('')
      setSelected(null)
      setResults([])
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background rounded-t-2xl px-4 pt-4 pb-8 max-h-[80vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Add Walk-In</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mb-3"
          placeholder="Search patient by name or phone…"
          value={query}
          onChange={handleQueryChange}
          autoFocus
        />

        {loading && <p className="text-sm text-muted-foreground px-1 mb-2">Searching…</p>}

        {!selected && results.length > 0 && (
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-4">
            {results.map((p) => (
              <button
                key={p.id}
                className="w-full text-left rounded-xl border px-4 py-3 min-h-[52px] hover:bg-muted transition-colors"
                onClick={() => { setSelected(p); setResults([]) }}
              >
                <div className="font-medium text-sm">{p.firstName} {p.lastName}</div>
                <div className="text-xs text-muted-foreground">{p.phone}</div>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div className="rounded-xl bg-muted px-4 py-3 mb-4 text-sm">
            <span className="font-medium">{selected.firstName} {selected.lastName}</span>
            <span className="text-muted-foreground ml-2">{selected.phone}</span>
          </div>
        )}

        <Button
          className="w-full min-h-[52px] text-base"
          disabled={!selected || submitting}
          onClick={handleConfirm}
        >
          {submitting ? 'Adding…' : 'Add to Queue'}
        </Button>
      </div>
    </div>
  )
}
