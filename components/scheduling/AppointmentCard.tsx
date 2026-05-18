'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

type AppointmentData = {
  id: string
  patientId: string
  patientName: string
  scheduledAt: string
  type: string
  status: string
  notes?: string | null
}

type Props = {
  appointment: AppointmentData
  showLateWarning?: boolean
  onAction: (id: string, action: 'checkin' | 'walkin' | 'cancel' | 'visit') => void
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  WALK_IN: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  CONFIRMED: 'Checked In',
  WALK_IN: 'Walk-In',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const TYPE_LABELS: Record<string, string> = {
  CHECK_UP: 'Check-up',
  CLEANING: 'Cleaning',
  FILLING: 'Filling',
  EXTRACTION: 'Extraction',
  RCT: 'RCT',
  BRACES: 'Braces',
  CONSULTATION: 'Consultation',
  OTHER: 'Other',
}

const TZ = 'Asia/Manila'

export default function AppointmentCard({ appointment, showLateWarning, onAction }: Props) {
  const [expanded, setExpanded] = useState(false)

  const scheduledManila = toZonedTime(new Date(appointment.scheduledAt), TZ)
  const timeStr = format(scheduledManila, 'h:mm a')

  const isActive = appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED'

  return (
    <div>
      <Card
        className="cursor-pointer active:opacity-80 transition-opacity"
        onClick={() => setExpanded((v) => !v)}
      >
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm truncate">{appointment.patientName}</span>
                {showLateWarning && (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-muted-foreground">{timeStr}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {TYPE_LABELS[appointment.type] ?? appointment.type}
                </span>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[appointment.status] ?? 'bg-gray-100 text-gray-700'}`}>
              {STATUS_LABELS[appointment.status] ?? appointment.status}
            </span>
          </div>
          {appointment.notes && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{appointment.notes}</p>
          )}
        </CardContent>
      </Card>

      {expanded && isActive && (
        <div className="mt-1 rounded-xl border bg-background shadow-md p-3 flex flex-col gap-2">
          <Button
            size="sm"
            className="w-full min-h-[44px]"
            onClick={(e) => { e.stopPropagation(); setExpanded(false); onAction(appointment.id, 'checkin') }}
          >
            Check In
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full min-h-[44px]"
            onClick={(e) => { e.stopPropagation(); setExpanded(false); onAction(appointment.id, 'walkin') }}
          >
            Mark as Walk-In
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full min-h-[44px]"
            onClick={(e) => { e.stopPropagation(); setExpanded(false); onAction(appointment.id, 'visit') }}
          >
            Start Visit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="w-full min-h-[44px]"
            onClick={(e) => { e.stopPropagation(); setExpanded(false); onAction(appointment.id, 'cancel') }}
          >
            Cancel Appointment
          </Button>
        </div>
      )}
    </div>
  )
}
