'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Home,
  Users,
  Plus,
  Receipt,
  MoreHorizontal,
  Calendar,
  Wallet,
  CreditCard,
  Briefcase,
  BarChart2,
  Shield,
  Calculator,
  Settings,
  Bell,
  X,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Patients', href: '/patients', icon: Users },
  { label: 'Visits', href: '/visits/new', icon: Plus },
  { label: 'Invoices', href: '/invoices', icon: Receipt },
]

const MORE_ITEMS = [
  { label: 'Scheduling', href: '/scheduling', icon: Calendar },
  { label: 'Expenses', href: '/expenses', icon: Wallet },
  { label: 'Loyalty Cards', href: '/loyalty', icon: CreditCard },
  { label: 'Employees', href: '/employees', icon: Briefcase },
  { label: 'Reminders', href: '/reminders', icon: Bell },
  { label: 'Reports', href: '/reports', icon: BarChart2 },
  { label: 'Compliance', href: '/compliance', icon: Shield },
  { label: 'CPA', href: '/cpa', icon: Calculator },
  { label: 'Settings', href: '/settings', icon: Settings },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

export default function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)

  function navigate(href: string) {
    setSheetOpen(false)
    router.push(href)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border">
        <div className="max-w-screen-sm mx-auto flex">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(pathname, item.href)
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={[
                  'flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] transition-colors text-xs font-medium',
                  active ? 'text-primary' : 'text-muted-foreground',
                ].join(' ')}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            )
          })}
          {/* More tab */}
          <button
            onClick={() => setSheetOpen(true)}
            className={[
              'flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] transition-colors text-xs font-medium',
              sheetOpen ? 'text-primary' : 'text-muted-foreground',
            ].join(' ')}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* More sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSheetOpen(false)}
          />

          {/* Sheet */}
          <div className="relative bg-background rounded-t-2xl max-w-screen-sm mx-auto w-full pb-8 pt-4 px-4">
            {/* Handle */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-muted-foreground">More</span>
              <button
                onClick={() => setSheetOpen(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {MORE_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.href}
                    onClick={() => navigate(item.href)}
                    className="flex flex-col items-center justify-center gap-2 min-h-[72px] rounded-xl bg-muted/50 active:bg-muted transition-colors p-2"
                  >
                    <Icon className="w-6 h-6 text-foreground" />
                    <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center justify-center gap-2 min-h-[48px] rounded-xl border border-destructive/30 text-destructive active:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign out</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
