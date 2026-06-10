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
  enrolledAt: string  // actually visitDate — kept same field name for compat
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
  logoUrl: string | null
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

  const chartData = MONTH_NAMES.map((name, i) => ({
    name,
    value: data.monthlyRevenue[i] ?? 0,
    isCurrent: i === data.currentMonth,
  }))

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1">
        <Image
          src={data.logoUrl ?? '/logo.png'}
          alt={data.clinicName}
          width={390}
          height={108}
          className="h-28 w-auto object-contain"
          unoptimized={!!data.logoUrl}
        />
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{format(today, 'EEEE')}</p>
          <p className="text-sm font-bold text-foreground">{format(today, 'MMMM d')}</p>
        </div>
      </div>

      {/* ── Stats Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Patients Seen — deep blue */}
        <div className="rounded-2xl p-5 relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}>
          <Users className="absolute top-4 right-4 w-5 h-5 text-blue-200" />
          <p className="text-blue-100 text-xs font-medium mb-2">Patients Seen</p>
          <p className="text-4xl font-extrabold tracking-tight">{data.stats.patientsSeen}</p>
          <p className="text-blue-200 text-xs mt-1">today</p>
        </div>
        {/* Revenue — sky blue */}
        <div className="rounded-2xl p-5 relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)' }}>
          <Banknote className="absolute top-4 right-4 w-5 h-5 text-sky-200" />
          <p className="text-sky-100 text-xs font-medium mb-2">Today&apos;s Revenue</p>
          <p className="text-4xl font-extrabold tracking-tight">₱{fmt(data.stats.todayRevenue)}</p>
          <p className="text-sky-200 text-xs mt-1">collected</p>
        </div>
        {/* Pending — amber */}
        <div className="rounded-2xl p-5 relative overflow-hidden bg-amber-50 border border-amber-100">
          <Clock className="absolute top-4 right-4 w-5 h-5 text-amber-400" />
          <p className="text-amber-600 text-xs font-medium mb-2">Pending</p>
          <p className="text-4xl font-extrabold tracking-tight text-amber-700">{data.stats.pending}</p>
          <p className="text-amber-400 text-xs mt-1">awaiting</p>
        </div>
        {/* Appointments — emerald */}
        <div className="rounded-2xl p-5 relative overflow-hidden bg-emerald-50 border border-emerald-100">
          <CalendarDays className="absolute top-4 right-4 w-5 h-5 text-emerald-400" />
          <p className="text-emerald-600 text-xs font-medium mb-2">Appointments</p>
          <p className="text-4xl font-extrabold tracking-tight text-emerald-700">{data.stats.appointments}</p>
          <p className="text-emerald-400 text-xs mt-1">scheduled</p>
        </div>
      </div>

      {/* ── Quick Actions ───────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => router.push('/visits/new')}
          className="min-h-[64px] rounded-2xl text-white font-bold text-sm active:opacity-80 transition-opacity flex flex-col items-center justify-center gap-1 shadow-sm shadow-sky-200"
          style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)' }}
        >
          <span className="text-xl leading-none">＋</span>
          <span>Patient</span>
        </button>
        <button
          onClick={() => router.push('/scheduling')}
          className="min-h-[64px] rounded-2xl border-2 border-blue-600 text-blue-700 font-bold text-sm active:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-1"
        >
          <CalendarDays className="w-5 h-5" />
          <span>Schedule</span>
        </button>
      </div>

      {/* ── Backup & Export ────────────────────────────────── */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 space-y-3">
        <div>
          <h2 className="text-sm font-bold text-blue-900">Backup & Export</h2>
          <p className="text-xs text-blue-600 mt-0.5">
            Download your data as a spreadsheet anytime.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { href: '/api/patients/export', label: 'Patients', icon: <path d="M13 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7z" />, icon2: <path d="M13 2v5h5M8 13h4M10 11v4" /> },
            { href: '/api/invoices/export', label: 'Invoices', icon: <rect x="2" y="3" width="16" height="14" rx="2" />, icon2: <path d="M6 7h8M6 10h8M6 13h5" /> },
            { href: '/api/expenses/export', label: 'Expenses', icon: <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" />, icon2: <path d="M10 6v4l3 3" /> },
          ].map(({ href, label, icon, icon2 }) => (
            <a
              key={label}
              href={href}
              download
              className="flex flex-col items-center justify-center gap-1.5 min-h-[72px] rounded-xl bg-white border border-blue-100 text-xs font-semibold text-blue-700 active:bg-blue-50 transition-colors px-2 text-center shadow-sm"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                {icon}{icon2}
              </svg>
              {label}
            </a>
          ))}
        </div>
        <p className="text-xs text-blue-400">CSV · opens in Excel, Google Sheets, Numbers</p>
      </div>

      {/* ── Today's Patients ────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-base font-bold">Today&apos;s Patients</h2>

        {data.appointments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Appointments</p>
            {data.appointments.map((appt) => (
              <Card
                key={appt.id}
                className="cursor-pointer active:bg-muted transition-colors shadow-sm"
                onClick={() => router.push('/patients/' + appt.patientId)}
              >
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{appt.patientName}</p>
                    <p className="text-xs text-muted-foreground">{fmtTime(appt.scheduledAt)} · {appt.type}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${statusBadge(appt.status)}`}>
                    {appt.status.replace('_', ' ')}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {data.walkIns.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Seen Today</p>
            {data.walkIns.map((p) => (
              <Card
                key={p.id}
                className="cursor-pointer active:bg-muted transition-colors shadow-sm"
                onClick={() => router.push('/patients/' + p.id)}
              >
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Visit at {fmtTime(p.enrolledAt)}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${statusBadge('COMPLETED')}`}>
                    Seen
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {data.appointments.length === 0 && data.walkIns.length === 0 && (
          <div className="rounded-2xl bg-muted/40 border border-border px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No patients today yet.</p>
          </div>
        )}
      </div>

      {/* ── Revenue Chart ───────────────────────────────────── */}
      <div className="space-y-2">
        <h2 className="text-base font-bold">Revenue This Year</h2>
        <div className="rounded-2xl bg-white border border-border p-4 shadow-sm">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, (dataMax: number) => dataMax === 0 ? 1 : dataMax]}
                tickFormatter={(v: number) =>
                  v === 0 ? '₱0' : v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`
                }
              />
              <Tooltip
                formatter={(v) => [`₱${new Intl.NumberFormat('en-PH').format(Number(v))}`, 'Revenue']}
                contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #dbeafe' }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.isCurrent ? '#2563eb' : '#bfdbfe'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Recent Invoices ─────────────────────────────────── */}
      <div className="space-y-2">
        <h2 className="text-base font-bold">Recent Receipts</h2>
        {data.recentInvoices.length === 0 ? (
          <div className="rounded-2xl bg-muted/40 border border-border px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No receipts yet.</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-border shadow-sm overflow-hidden">
            {data.recentInvoices.map((inv, i) => (
              <div
                key={inv.id}
                className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-muted/50 transition-colors ${i > 0 ? 'border-t border-border' : ''}`}
                onClick={() => router.push('/invoices/' + inv.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">OR #{inv.orNumber}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${inv.paymentMethod === 'GCASH' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {inv.paymentMethod}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{inv.patientName} · {new Date(inv.transactionDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</p>
                </div>
                <span className="font-extrabold text-base shrink-0 text-blue-700">₱{fmt(inv.grossAmount)}</span>
              </div>
            ))}
            <div className="border-t border-border px-4 py-3">
              <button onClick={() => router.push('/invoices')} className="text-sm text-blue-600 font-semibold">
                View all receipts →
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="h-4" />
    </div>
  )
}
