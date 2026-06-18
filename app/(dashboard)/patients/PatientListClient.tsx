'use client'

import { useCallback, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { getPatients, type PatientSummary } from './actions'

function computeAge(dob: Date): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isToday(date: Date): boolean {
  const d = new Date(date)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

function PatientCard({ patient }: { patient: PatientSummary }) {
  const age = computeAge(patient.dateOfBirth)
  return (
    <Link href={`/patients/${patient.id}`} className="block">
      <div className="rounded-2xl bg-white border border-border shadow-sm p-4 flex items-center justify-between gap-3 active:bg-muted/40 transition-colors">
        <div className="min-w-0 flex-1">
          <p className="text-xl font-bold text-foreground leading-tight truncate">
            {patient.firstName}{patient.middleName ? ` ${patient.middleName}` : ''} {patient.lastName}
          </p>
          <p className="text-base text-muted-foreground mt-0.5">{patient.phone}</p>
          <p className="text-base text-muted-foreground">
            Age {age} · {patient.lastVisitDate ? `Last visit ${formatDate(patient.lastVisitDate)}` : 'No visits yet'}
          </p>
        </div>
        {patient.hasActiveLoyaltyCard && (
          <span className="shrink-0 text-sm font-bold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            💳 Card
          </span>
        )}
      </div>
    </Link>
  )
}

type Tab = 'all' | 'today'

export default function PatientListClient({
  initialPatients,
  initialHasMore,
}: {
  initialPatients: PatientSummary[]
  initialHasMore: boolean
}) {
  const [patients, setPatients] = useState<PatientSummary[]>(initialPatients)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(0)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [isPending, startTransition] = useTransition()
  const [searchResults, setSearchResults] = useState<PatientSummary[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSearchResults(null); return }
    setIsSearching(true)
    try {
      const res = await fetch(`/api/patients/search?q=${encodeURIComponent(q.trim())}`)
      if (res.ok) setSearchResults(await res.json())
    } finally {
      setIsSearching(false)
    }
  }, [])

  function handleQueryChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) { setSearchResults(null); return }
    debounceRef.current = setTimeout(() => runSearch(value), 300)
  }

  function loadMore() {
    const nextPage = page + 1
    startTransition(async () => {
      const result = await getPatients(nextPage)
      setPatients((prev) => [...prev, ...result.patients])
      setHasMore(result.hasMore)
      setPage(nextPage)
    })
  }

  const filtered = useMemo(() => {
    if (searchResults !== null) return searchResults
    let list = patients
    if (tab === 'today') list = list.filter((p) => isToday(p.enrolledAt))
    return list
  }, [patients, searchResults, tab])

  return (
    <div className="flex flex-col gap-4 pb-24">

      {/* Search */}
      <input
        type="search"
        autoFocus
        placeholder="Search by name or phone…"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        className="w-full min-h-[56px] rounded-2xl border-2 border-input bg-background px-5 text-lg outline-none focus:ring-2 focus:ring-ring"
      />

      {/* Tabs */}
      <div className="flex gap-3">
        {(['all', 'today'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 min-h-[56px] rounded-2xl text-lg font-bold transition-colors ${
              tab === t
                ? t === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-emerald-500 text-white shadow-md'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {t === 'all' ? 'All Patients' : 'Today'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <p className="text-center text-xl text-muted-foreground py-10">
            {isSearching ? 'Searching…' : query ? 'No patients found.' : 'No patients yet.'}
          </p>
        ) : (
          filtered.map((p) => <PatientCard key={p.id} patient={p} />)
        )}
      </div>

      {/* Load more */}
      {hasMore && searchResults === null && tab === 'all' && (
        <button
          onClick={loadMore}
          disabled={isPending}
          className="w-full min-h-[56px] rounded-2xl bg-muted text-muted-foreground text-lg font-bold disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Loading…' : 'Load more patients'}
        </button>
      )}

    </div>
  )
}
