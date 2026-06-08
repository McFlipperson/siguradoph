'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getPatients, type PatientSummary } from './actions'

function computeAge(dob: Date): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function isToday(date: Date): boolean {
  const d = new Date(date)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function PatientCard({ patient }: { patient: PatientSummary }) {
  const age = computeAge(patient.dateOfBirth)
  return (
    <Link href={`/patients/${patient.id}`} className="block">
      <Card className="active:scale-[0.99] transition-transform">
        <CardContent className="flex flex-col gap-1 py-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-base font-semibold leading-tight">
              {patient.firstName}{patient.middleName ? ` ${patient.middleName}` : ''} {patient.lastName}
            </p>
            {patient.hasActiveLoyaltyCard && (
              <Badge className="shrink-0 bg-emerald-100 text-emerald-800 border-emerald-200">
                Loyalty Card
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{patient.phone}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Age {age}</span>
            <span>
              {patient.lastVisitDate
                ? `Last visit: ${formatDate(patient.lastVisitDate)}`
                : 'No visits yet'}
            </span>
          </div>
        </CardContent>
      </Card>
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
    let list = patients
    if (tab === 'today') {
      list = list.filter((p) => isToday(p.enrolledAt))
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (p) =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.phone.includes(q)
      )
    }
    return list
  }, [patients, query, tab])

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Search */}
      <input
        type="search"
        autoFocus
        placeholder="Search by name or phone…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />

      {/* Tabs */}
      <div className="flex gap-2">
        {(['all', 'today'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 min-h-[48px] rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t === 'all' ? 'All Patients' : 'Today'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            {query ? 'No patients match your search.' : 'No patients yet.'}
          </p>
        ) : (
          filtered.map((p) => <PatientCard key={p.id} patient={p} />)
        )}
      </div>

      {/* Load more — only show on All tab with no search query */}
      {hasMore && !query && tab === 'all' && (
        <button
          onClick={loadMore}
          disabled={isPending}
          className="w-full min-h-[48px] rounded-lg bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Loading…' : 'Load more patients'}
        </button>
      )}

      {/* FAB */}
      <Link
        href="/patients/intake"
        className="fixed bottom-6 right-4 z-50 flex items-center justify-center min-h-[56px] rounded-full bg-primary text-primary-foreground shadow-lg font-semibold text-sm px-6"
      >
        + New Patient
      </Link>
    </div>
  )
}
