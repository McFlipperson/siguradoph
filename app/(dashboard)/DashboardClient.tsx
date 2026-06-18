'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

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

function fmt(n: number): string {
  return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  CONFIRMED: 'Confirmed',
  WALK_IN: 'Walk-in',
  COMPLETED: 'Done',
  CANCELLED: 'Cancelled',
}

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800 border border-blue-200',
  CONFIRMED: 'bg-green-100 text-green-800 border border-green-200',
  WALK_IN: 'bg-amber-100 text-amber-800 border border-amber-200',
  COMPLETED: 'bg-gray-100 text-gray-700 border border-gray-200',
  CANCELLED: 'bg-red-100 text-red-700 border border-red-200',
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter()
  const today = new Date()

  const chartData = MONTH_NAMES.map((name, i) => ({
    name,
    value: data.monthlyRevenue[i] ?? 0,
    isCurrent: i === data.currentMonth,
  }))

  const allPatients = [
    ...data.appointments.map(a => ({ id: a.patientId, name: a.patientName, time: fmtTime(a.scheduledAt), status: a.status })),
    ...data.walkIns.map(w => ({ id: w.id, name: w.name, time: fmtTime(w.enrolledAt), status: 'COMPLETED' })),
  ]

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-1">
        <Image
          src={data.logoUrl ?? '/logo.png'}
          alt={data.clinicName}
          width={390}
          height={108}
          className="h-20 w-auto object-contain"
          unoptimized={!!data.logoUrl}
        />
        <div className="text-right">
          <p className="text-base font-medium text-muted-foreground">{format(today, 'EEEE')}</p>
          <p className="text-xl font-bold text-foreground">{format(today, 'MMMM d')}</p>
        </div>
      </div>

      {/* ── Stat Tiles ── */}
      <div className="grid grid-cols-2 gap-3">

        {/* Patients Seen */}
        <div className="rounded-3xl p-5 flex flex-col gap-2 bg-blue-600 text-white shadow-md">
          <p className="text-lg font-bold">Patients Seen</p>
          <p className="text-6xl font-black leading-none">{data.stats.patientsSeen}</p>
          <p className="text-base font-semibold opacity-80">today</p>
        </div>

        {/* Revenue */}
        <div className="rounded-3xl p-5 flex flex-col gap-2 bg-emerald-500 text-white shadow-md">
          <p className="text-lg font-bold">Revenue</p>
          <p className="text-4xl font-black leading-none break-all">₱{fmt(data.stats.todayRevenue)}</p>
          <p className="text-base font-semibold opacity-80">today</p>
        </div>

        {/* Pending */}
        <div className="rounded-3xl p-5 flex flex-col gap-2 bg-amber-400 text-white shadow-md">
          <p className="text-lg font-bold">Waiting</p>
          <p className="text-6xl font-black leading-none">{data.stats.pending}</p>
          <p className="text-base font-semibold opacity-80">patients</p>
        </div>

        {/* Appointments */}
        <div className="rounded-3xl p-5 flex flex-col gap-2 bg-violet-500 text-white shadow-md">
          <p className="text-lg font-bold">Scheduled</p>
          <p className="text-6xl font-black leading-none">{data.stats.appointments}</p>
          <p className="text-base font-semibold opacity-80">today</p>
        </div>

      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push('/visits/new')}
          className="min-h-[72px] rounded-2xl bg-blue-600 text-white font-bold text-lg active:opacity-80 transition-opacity flex items-center justify-center gap-2 shadow-md"
        >
          <span className="text-2xl leading-none">＋</span>
          New Visit
        </button>
        <button
          onClick={() => router.push('/patients/intake')}
          className="min-h-[72px] rounded-2xl bg-white border-2 border-blue-600 text-blue-700 font-bold text-lg active:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-2xl leading-none">👤</span>
          New Patient
        </button>
      </div>

      {/* ── Today's Patients ── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-black text-foreground">Today&apos;s Patients</h2>

        {allPatients.length === 0 ? (
          <div className="rounded-2xl bg-muted/40 border border-border px-6 py-10 text-center">
            <p className="text-xl text-muted-foreground">No patients today yet.</p>
          </div>
        ) : (
          allPatients.map((p) => (
            <button
              key={p.id + p.time}
              onClick={() => router.push('/patients/' + p.id)}
              className="w-full rounded-2xl bg-white border border-border shadow-sm p-4 flex items-center justify-between gap-3 active:bg-muted/40 transition-colors text-left"
            >
              <div className="min-w-0">
                <p className="text-xl font-bold text-foreground truncate">{p.name}</p>
                <p className="text-base text-muted-foreground mt-0.5">{p.time}</p>
              </div>
              <span className={`shrink-0 text-sm font-bold px-3 py-1.5 rounded-full ${STATUS_COLOR[p.status] ?? 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                {STATUS_LABEL[p.status] ?? p.status}
              </span>
            </button>
          ))
        )}
      </div>

      {/* ── Revenue Chart ── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-black text-foreground">Revenue This Year</h2>
        <div className="rounded-2xl bg-white border border-border p-4 shadow-sm">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                domain={[0, (dataMax: number) => dataMax === 0 ? 1 : dataMax]}
                tickFormatter={(v: number) =>
                  v === 0 ? '₱0' : v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`
                }
              />
              <Tooltip
                formatter={(v) => [`₱${new Intl.NumberFormat('en-PH').format(Number(v))}`, 'Revenue']}
                contentStyle={{ fontSize: 14, borderRadius: 12, border: '1px solid #dbeafe' }}
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

      {/* ── Recent Receipts ── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-black text-foreground">Recent Receipts</h2>
        {data.recentInvoices.length === 0 ? (
          <div className="rounded-2xl bg-muted/40 border border-border px-6 py-10 text-center">
            <p className="text-xl text-muted-foreground">No receipts yet.</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-border shadow-sm overflow-hidden">
            {data.recentInvoices.map((inv, i) => (
              <button
                key={inv.id}
                onClick={() => router.push('/invoices/' + inv.id)}
                className={`w-full flex items-center gap-3 px-4 py-4 active:bg-muted/50 transition-colors text-left ${i > 0 ? 'border-t border-border' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-foreground truncate">{inv.patientName}</p>
                  <p className="text-base text-muted-foreground">OR #{inv.orNumber} · {inv.paymentMethod} · {new Date(inv.transactionDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</p>
                </div>
                <span className="font-black text-xl shrink-0 text-blue-700">₱{fmt(inv.grossAmount)}</span>
              </button>
            ))}
            <div className="border-t border-border px-4 py-4">
              <button onClick={() => router.push('/invoices')} className="text-lg text-blue-600 font-bold">
                View all receipts →
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
