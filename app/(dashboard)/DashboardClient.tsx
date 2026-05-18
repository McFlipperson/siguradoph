'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { Users, Banknote, Clock, CalendarDays } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Appointment = {
  id: string
  patientId: string
  patientName: string
  scheduledAt: string
  type: string
  status: string
}

type WalkIn = {
  id: string
  name: string
  enrolledAt: string
  hasVisit: boolean
}

type RecentInvoice = {
  id: string
  orNumber: string
  patientName: string
  grossAmount: number
  paymentMethod: string
  transactionDate: string
}

type DashboardData = {
  clinicName: string
  stats: {
    patientsSeen: number
    todayRevenue: number
    pending: number
    appointments: number
  }
  appointments: Appointment[]
  walkIns: WalkIn[]
  recentInvoices: RecentInvoice[]
  monthlyRevenue: number[]
  currentMonth: number
}

type Props = {
  data: DashboardData
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function statusBadge(status: string) {
  const map: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    WALK_IN: 'bg-amber-100 text-amber-800',
    COMPLETED: 'bg-gray-100 text-gray-600',
    CANCELLED: 'bg-red-100 text-red-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardClient({ data }: Props) {
  const router = useRouter()
  const today = new Date()
  const todayLabel = format(today, 'EEEE, MMMM d')

  const chartData = MONTH_NAMES.map((name, i) => ({
    name,
    value: data.monthlyRevenue[i] ?? 0,
    isCurrent: i === data.currentMonth,
  }))

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Image src="/logo.png" alt="SiguradoPH" width={120} height={32} className="h-8 w-auto object-contain" />
        <span className="text-sm text-muted-foreground font-medium">{todayLabel}</span>
      </div>

      {/* ── Stats Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Patients Seen */}
        <Card>
          <CardContent className="p-4 relative">
            <Users className="absolute top-4 right-4 w-5 h-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-1">Patients Seen</p>
            <p className="text-3xl font-bold">{data.stats.patientsSeen}</p>
          </CardContent>
        </Card>
        {/* Revenue */}
        <Card>
          <CardContent className="p-4 relative">
            <Banknote className="absolute top-4 right-4 w-5 h-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-1">Today&apos;s Revenue</p>
            <p className="text-3xl font-bold">₱{fmt(data.stats.todayRevenue)}</p>
          </CardContent>
        </Card>
        {/* Pending */}
        <Card>
          <CardContent className="p-4 relative">
            <Clock className="absolute top-4 right-4 w-5 h-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-1">Pending</p>
            <p className="text-3xl font-bold">{data.stats.pending}</p>
          </CardContent>
        </Card>
        {/* Appointments */}
        <Card>
          <CardContent className="p-4 relative">
            <CalendarDays className="absolute top-4 right-4 w-5 h-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-1">Appointments</p>
            <p className="text-3xl font-bold">{data.stats.appointments}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Actions ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => router.push('/patients/new')}
          className="min-h-[56px] rounded-xl border border-border bg-background font-medium text-sm active:bg-muted transition-colors px-2"
        >
          + New Patient
        </button>
        <button
          onClick={() => router.push('/visits/new')}
          className="min-h-[56px] rounded-xl border border-border bg-background font-medium text-sm active:bg-muted transition-colors px-2"
        >
          + New Visit
        </button>
        <button
          onClick={() => router.push('/scheduling')}
          className="min-h-[56px] rounded-xl border border-border bg-background font-medium text-sm active:bg-muted transition-colors px-2"
        >
          Schedule
        </button>
      </div>

      {/* ── Today's Patients ────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-base font-bold">Today&apos;s Patients</h2>

        {/* Appointments sub-section */}
        {data.appointments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Appointments</p>
            {data.appointments.map((appt) => (
              <Card
                key={appt.id}
                className="cursor-pointer active:bg-muted transition-colors"
                onClick={() => router.push('/patients/' + appt.patientId)}
              >
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{appt.patientName}</p>
                    <p className="text-xs text-muted-foreground">{fmtTime(appt.scheduledAt)} · {appt.type}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${statusBadge(appt.status)}`}>
                    {appt.status.replace('_', ' ')}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Walk-ins sub-section */}
        {data.walkIns.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Walk-ins</p>
            {data.walkIns.map((p) => (
              <Card
                key={p.id}
                className="cursor-pointer active:bg-muted transition-colors"
                onClick={() => router.push('/patients/' + p.id)}
              >
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Enrolled {fmtTime(p.enrolledAt)}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${p.hasVisit ? statusBadge('COMPLETED') : statusBadge('WALK_IN')}`}>
                    {p.hasVisit ? 'Seen' : 'Waiting'}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {data.appointments.length === 0 && data.walkIns.length === 0 && (
          <p className="text-sm text-muted-foreground">No patients today yet.</p>
        )}
      </div>

      {/* ── Revenue Chart ───────────────────────────────────── */}
      <div className="space-y-2">
        <h2 className="text-base font-bold">Revenue This Year</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) =>
                v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`
              }
            />
            <Tooltip
              formatter={(v) => [`₱${new Intl.NumberFormat('en-PH').format(Number(v))}`, 'Revenue']}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.isCurrent ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Recent Invoices ─────────────────────────────────── */}
      <div className="space-y-2">
        <h2 className="text-base font-bold">Recent Receipts</h2>
        {data.recentInvoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No receipts yet.</p>
        ) : (
          <>
            {data.recentInvoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 py-3 border-b border-border cursor-pointer active:bg-muted rounded-lg px-1 transition-colors"
                onClick={() => router.push('/invoices/' + inv.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">OR #{inv.orNumber}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${inv.paymentMethod === 'GCASH' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                      {inv.paymentMethod}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{inv.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(inv.transactionDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span className="font-bold text-base shrink-0">₱{fmt(inv.grossAmount)}</span>
              </div>
            ))}
            <button
              onClick={() => router.push('/invoices')}
              className="text-sm text-primary font-medium mt-1"
            >
              View all receipts →
            </button>
          </>
        )}
      </div>

      {/* Bottom spacer for nav */}
      <div className="h-4" />
    </div>
  )
}
