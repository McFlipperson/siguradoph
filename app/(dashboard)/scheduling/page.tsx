'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format, addWeeks, subWeeks, startOfWeek, addDays, addMinutes, isToday } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import AppointmentCard from '@/components/scheduling/AppointmentCard'
import AddWalkInSheet from '@/components/scheduling/AddWalkInSheet'
import AddAppointmentSheet from '@/components/scheduling/AddAppointmentSheet'

const TZ = 'Asia/Manila'

type Appointment = {
  id: string
  patientId: string
  patientName: string
  scheduledAt: string
  type: string
  status: string
  notes?: string | null
}

type WalkIn = {
  id: string
  patientId: string
  patientName: string
  scheduledAt: string
  type: string
  status: string
}

function formatWaitTime(scheduledAt: string): string {
  const diff = Math.floor((Date.now() - new Date(scheduledAt).getTime()) / 60000)
  if (diff < 60) return `${diff}m`
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// Time slots: 8:00 to 18:00 in 30-min increments = 20 slots (indices 0–19)
const TIME_SLOTS = Array.from({ length: 20 }, (_, i) => {
  const totalMinutes = 8 * 60 + i * 30
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return { label: `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`, h, m }
})

export default function SchedulingPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'queue' | 'calendar'>('queue')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [walkIns, setWalkIns] = useState<WalkIn[]>([])
  const [loading, setLoading] = useState(true)
  const [addWalkInOpen, setAddWalkInOpen] = useState(false)
  const [addApptOpen, setAddApptOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>(undefined)
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [now, setNow] = useState(() => new Date())
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [apptRes, walkInRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/appointments/walk-ins'),
      ])
      if (apptRes.ok) setAppointments(await apptRes.json())
      if (walkInRes.ok) setWalkIns(await walkInRes.json())
    } catch {
      // silently ignore network errors during background refresh
    } finally {
      setLoading(false)
    }
  }, [])

  const runLateRuleAndRefetch = useCallback(async () => {
    try {
      await fetch('/api/appointments/late-rule', { method: 'POST' })
    } catch {
      // ignore
    }
    setNow(new Date())
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    runLateRuleAndRefetch()
    pollRef.current = setInterval(runLateRuleAndRefetch, 5 * 60 * 1000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [runLateRuleAndRefetch])

  async function handleAction(id: string, action: 'checkin' | 'walkin' | 'cancel' | 'visit') {
    if (action === 'visit') {
      const appt = appointments.find((a) => a.id === id)
      if (appt) {
        router.push(`/visits/new?patientId=${appt.patientId}&appointmentId=${id}`)
      }
      return
    }
    const statusMap: Record<string, string> = {
      checkin: 'CONFIRMED',
      walkin: 'WALK_IN',
      cancel: 'CANCELLED',
    }
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusMap[action] }),
      })
      if (!res.ok) throw new Error()
      await fetchData()
    } catch {
      toast.error('Failed to update appointment')
    }
  }

  async function handleAddWalkIn(patientId: string) {
    try {
      const res = await fetch('/api/appointments/walk-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId }),
      })
      if (!res.ok) throw new Error()
      setAddWalkInOpen(false)
      await fetchData()
      toast.success('Walk-in added')
    } catch {
      toast.error('Failed to add walk-in')
    }
  }

  async function handleAddAppointment(data: {
    patientId: string
    scheduledAt: string
    type: string
    notes?: string
  }) {
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      setAddApptOpen(false)
      await fetchData()
      toast.success('Appointment scheduled')
    } catch {
      toast.error('Failed to schedule appointment')
    }
  }

  async function handleStartVisitFromWalkIn(id: string, patientId: string) {
    router.push(`/visits/new?patientId=${patientId}&appointmentId=${id}`)
  }

  // Queue tab data
  const activeAppointments = appointments.filter(
    (a) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED'
  )

  function isLate(a: Appointment): boolean {
    return a.status === 'SCHEDULED' && addMinutes(new Date(a.scheduledAt), 30) < now
  }

  // Calendar tab helpers
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekLabel = `${format(weekDays[0], 'MMM d')}–${format(weekDays[6], 'd, yyyy')}`

  function getApptSlot(appt: Appointment): { dayIdx: number; slotIdx: number } | null {
    const manilaDate = toZonedTime(new Date(appt.scheduledAt), TZ)
    const apptDay = format(manilaDate, 'yyyy-MM-dd')
    const dayIdx = weekDays.findIndex((d) => format(d, 'yyyy-MM-dd') === apptDay)
    if (dayIdx === -1) return null
    const h = manilaDate.getHours()
    const m = manilaDate.getMinutes()
    const totalMinutes = h * 60 + m
    const slotMinutes = 8 * 60
    const slotIdx = Math.floor((totalMinutes - slotMinutes) / 30)
    if (slotIdx < 0 || slotIdx >= 20) return null
    return { dayIdx, slotIdx }
  }

  // Build a grid: slotIdx -> dayIdx -> appointments[]
  const calGrid: Appointment[][][] = Array.from({ length: 20 }, () =>
    Array.from({ length: 7 }, () => [])
  )
  for (const appt of appointments) {
    const pos = getApptSlot(appt)
    if (pos) calGrid[pos.slotIdx][pos.dayIdx].push(appt)
  }

  function handleSlotTap(dayIdx: number, slotIdx: number) {
    const day = weekDays[dayIdx]
    const slot = TIME_SLOTS[slotIdx]
    const dt = new Date(day)
    dt.setHours(slot.h, slot.m, 0, 0)
    setSelectedSlot(dt.toISOString())
    setAddApptOpen(true)
  }

  const manilaToday = format(toZonedTime(new Date(), TZ), 'MMM d')

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* Tab bar */}
      <div className="flex gap-1 p-3 pb-0">
        <button
          onClick={() => setTab('queue')}
          className={`flex-1 min-h-[44px] rounded-xl text-sm font-semibold transition-colors ${
            tab === 'queue' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          Queue
        </button>
        <button
          onClick={() => setTab('calendar')}
          className={`flex-1 min-h-[44px] rounded-xl text-sm font-semibold transition-colors ${
            tab === 'calendar' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          Calendar
        </button>
      </div>

      {/* Queue Tab */}
      {tab === 'queue' && (
        <div className="flex flex-col gap-4 p-3 overflow-y-auto pb-24">
          {/* Date header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Today, {manilaToday}</h2>
            <Button
              size="sm"
              className="min-h-[44px] gap-1"
              onClick={() => setAddWalkInOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add Walk-In
            </Button>
          </div>

          {/* Appointments section */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Appointments
            </h3>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : activeAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appointments today.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {activeAppointments.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    showLateWarning={isLate(appt)}
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Walk-In Queue section */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Walk-In Queue
            </h3>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : walkIns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No walk-ins in queue.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {walkIns.map((w) => (
                  <Card key={w.id}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{w.patientName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Wait: {formatWaitTime(w.scheduledAt)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="min-h-[44px] shrink-0"
                          onClick={() => handleStartVisitFromWalkIn(w.id, w.patientId)}
                        >
                          Start Visit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calendar Tab */}
      {tab === 'calendar' && (
        <div className="flex flex-col gap-0 flex-1 overflow-hidden p-3 pb-24">
          {/* Week navigation */}
          <div className="flex items-center justify-between mb-2 gap-2">
            <button
              className="p-2 rounded-lg hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setWeekStart((d) => subWeeks(d, 1))}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-semibold">{weekLabel}</span>
            </div>
            <button
              className="p-2 rounded-lg hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setWeekStart((d) => addWeeks(d, 1))}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              className="text-xs font-medium px-3 py-2 rounded-lg border min-h-[36px]"
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            >
              Today
            </button>
          </div>

          {/* Scrollable grid */}
          <div className="overflow-auto flex-1 -mx-3">
            <div
              className="grid min-w-[600px]"
              style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}
            >
              {/* Header row */}
              <div className="border-b border-r bg-background sticky top-0 z-10" />
              {weekDays.map((day, di) => (
                <div
                  key={di}
                  className={`border-b border-r px-1 py-2 text-center sticky top-0 z-10 ${
                    isToday(day) ? 'bg-primary/10 font-bold' : 'bg-background'
                  }`}
                >
                  <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                  <div className={`text-sm font-semibold ${isToday(day) ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}

              {/* Time rows */}
              {TIME_SLOTS.map((slot, si) => (
                <>
                  {/* Time label */}
                  <div
                    key={`label-${si}`}
                    className="border-b border-r px-1 py-0 flex items-start justify-end pr-2 pt-1"
                    style={{ minHeight: 48 }}
                  >
                    <span className="text-[10px] text-muted-foreground leading-none">{slot.label}</span>
                  </div>
                  {/* Day cells */}
                  {weekDays.map((_, di) => {
                    const cellAppts = calGrid[si][di]
                    return (
                      <div
                        key={`cell-${si}-${di}`}
                        className="border-b border-r relative cursor-pointer hover:bg-muted/40 transition-colors"
                        style={{ minHeight: 48 }}
                        onClick={() => {
                          if (cellAppts.length === 0) handleSlotTap(di, si)
                        }}
                      >
                        {cellAppts.map((appt) => (
                          <div
                            key={appt.id}
                            className={`absolute inset-x-0.5 top-0.5 bottom-0.5 rounded text-[10px] font-medium px-1 py-0.5 truncate leading-tight ${
                              appt.status === 'CONFIRMED'
                                ? 'bg-green-200 text-green-900'
                                : appt.status === 'WALK_IN'
                                ? 'bg-amber-200 text-amber-900'
                                : appt.status === 'COMPLETED'
                                ? 'bg-gray-200 text-gray-700'
                                : 'bg-blue-200 text-blue-900'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              // Appointments in calendar — navigate to visit creation or just show in queue
                            }}
                          >
                            {appt.patientName}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </>
              ))}
            </div>
          </div>

          {/* FAB to add appointment */}
          <button
            className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-20"
            onClick={() => { setSelectedSlot(undefined); setAddApptOpen(true) }}
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Sheets */}
      <AddWalkInSheet
        open={addWalkInOpen}
        onClose={() => setAddWalkInOpen(false)}
        onConfirm={handleAddWalkIn}
      />
      <AddAppointmentSheet
        key={selectedSlot ?? 'new'}
        open={addApptOpen}
        onClose={() => setAddApptOpen(false)}
        initialDatetime={selectedSlot}
        onConfirm={handleAddAppointment}
      />
    </div>
  )
}
