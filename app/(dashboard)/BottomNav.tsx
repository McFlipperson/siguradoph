'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Home,
  Wallet,
  FileText,
  Users,
  BarChart2,
  Settings,
  LogOut,
  X,
  ChevronRight,
  CreditCard,
  Bell,
  Shield,
  Zap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { planAllows, type Plan, type Feature } from '@/lib/entitlements'

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

type MenuItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  feature?: Feature   // if set, item only shows when the plan includes it
}

type MenuSection = {
  title: string
  items: MenuItem[]
}

// ─── Config ───────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { label: 'Home',     href: '/',         icon: Home     },
  { label: 'Patients', href: '/patients', icon: Users    },
  { label: 'Expenses', href: '/expenses', icon: Wallet   },
  { label: 'Settings', href: '/settings', icon: Settings },
]

const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'Daily',
    items: [
      { label: 'Invoices / Receipts',    href: '/invoices',  icon: FileText,  color: 'bg-blue-500'   },
    ],
  },
  {
    title: 'Clinic',
    items: [
      { label: 'Reminders',     href: '/reminders', icon: Bell,        color: 'bg-sky-500',    feature: 'reminders' },
      { label: 'Employees / Payroll', href: '/employees', icon: Users,       color: 'bg-violet-500', feature: 'employees' },
      { label: 'Loyalty Cards', href: '/loyalty',   icon: CreditCard,  color: 'bg-rose-500',   feature: 'loyalty'   },
      { label: 'Reports / Downloads', href: '/reports',   icon: BarChart2,   color: 'bg-emerald-500', feature: 'reports'  },
    ],
  },
  /* TAX_MODULE — Finance section hidden; re-enable in lib/features.ts */
  {
    title: 'Account',
    items: [
      { label: 'Compliance',   href: '/compliance', icon: Shield,    color: 'bg-emerald-600', feature: 'compliance' },
      { label: 'Billing',     href: '/billing',   icon: Zap,       color: 'bg-amber-500'  },
      { label: 'Settings',    href: '/settings',  icon: Settings,  color: 'bg-slate-500'  },
    ],
  },
]

// Routes a SECRETARY cannot access — hidden from nav and guarded at page level
const SECRETARY_BLOCKED: Set<string> = new Set([
  '/employees',
  '/reports',
  '/compliance',
  '/settings',
])

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BottomNav({ plan, role }: { plan: Plan; role: string }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isSecretary = role === 'SECRETARY'

  // Filter by plan entitlements AND role permissions
  const visibleSections = MENU_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        (!item.feature || planAllows(plan, item.feature)) &&
        !(isSecretary && SECRETARY_BLOCKED.has(item.href))
      ),
    }))
    .filter((section) => section.items.length > 0)

  function navigate(href: string) {
    setOpen(false)
    router.push(href)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* ── Bottom bar ─────────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border/60 shadow-[0_-1px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-screen-sm mx-auto flex items-stretch h-16">

          {NAV_ITEMS.map((item) => {
            const Icon   = item.icon
            const active = isActive(pathname, item.href)
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative"
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-primary" />
                )}
                <Icon className={`w-[22px] h-[22px] transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-[11px] font-medium tracking-tight transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </button>
            )
          })}

          {/* Menu trigger */}
          <button
            onClick={() => setOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 relative"
          >
            {open && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-primary" />
            )}
            {/* Hamburger lines */}
            <div className="flex flex-col gap-[4px] items-center">
              <span className={`block w-[18px] h-[1.5px] rounded-full transition-colors ${open ? 'bg-primary' : 'bg-muted-foreground'}`} />
              <span className={`block w-[14px] h-[1.5px] rounded-full transition-colors ${open ? 'bg-primary' : 'bg-muted-foreground'}`} />
              <span className={`block w-[18px] h-[1.5px] rounded-full transition-colors ${open ? 'bg-primary' : 'bg-muted-foreground'}`} />
            </div>
            <span className={`text-[11px] font-medium tracking-tight transition-colors ${open ? 'text-primary' : 'text-muted-foreground'}`}>
              Menu
            </span>
          </button>

        </div>
      </nav>

      {/* ── Menu sheet ─────────────────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-screen-sm mx-auto bg-background rounded-t-3xl overflow-hidden shadow-2xl">

          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-9 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-2">
            <span className="text-base font-bold">Menu</span>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:bg-muted/70 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="px-4 pb-2 overflow-y-auto max-h-[72vh] space-y-4">

            {visibleSections.map((section) => (
              <div key={section.title}>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-1.5">
                  {section.title}
                </p>
                <div className="bg-muted/40 rounded-2xl overflow-hidden divide-y divide-border/40">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.href}
                        onClick={() => navigate(item.href)}
                        className="w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-muted/70 transition-colors"
                      >
                        <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center shrink-0 shadow-sm`}>
                          <Icon className="w-[18px] h-[18px] text-white" />
                        </div>
                        <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Sign out */}
            <div className="bg-red-50 rounded-2xl overflow-hidden">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-red-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center shrink-0 shadow-sm">
                  <LogOut className="w-[18px] h-[18px] text-white" />
                </div>
                <span className="flex-1 text-left text-sm font-medium text-red-600">Sign out</span>
              </button>
            </div>

            {/* iOS home indicator clearance */}
            <div className="h-6" />
          </div>

        </div>
      </div>
    </>
  )
}
