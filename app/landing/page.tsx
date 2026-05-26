import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sigurado — Dental Clinic Software Built for the Philippines',
  description:
    'If you can use a smartphone, Sigurado is for you. Patient records, receipts, payroll, and patient privacy — no tech background needed.',
}

const FREE_FEATURES = [
  'Patient records, medical history & visit notes',
  'OR receipts, invoices & thermal printing',
  'Scheduling & appointments',
  'Patient reminders via Messenger & email',
  'Loyalty cards & Senior Citizen / PWD discounts',
  'Expense tracking & revenue reports',
  'Data export — patients, invoices, expenses',
  'Payroll — SSS, PhilHealth, Pag-IBIG, 13th month & holidays',
  'Patient privacy tools — consent records & audit logs',
  'Bookkeeper portal with monthly ready-to-file reports',
  'Messenger support 9am–4pm',
]

const BASIC_FEATURES = [
  'Patient records, medical history & visit notes',
  'OR receipts, invoices & thermal printing',
  'Scheduling & appointments',
  'Patient reminders via Messenger & email',
  'Loyalty cards & Senior Citizen / PWD discounts',
  'Expense tracking & revenue reports',
  'Data export — patients, invoices, expenses',
  'Messenger support 9am–4pm',
]

const PRO_EXTRAS = [
  'Payroll — SSS, PhilHealth, Pag-IBIG, 13th month & holiday pay',
  'Employee records & attendance tracking',
  'Service Incentive Leave (SIL) tracking',
  'Patient privacy tools — consent records & audit logs',
  'Incident logging & breach reporting',
  'Bookkeeper portal — read-only access to your clinic financials',
  'Quarterly revenue summary — gross sales, expenses, net payable',
  'Invoice & expense CSV export in accountant-ready format',
  'DAT file export for government submission',
  'Monthly reports delivered to your bookkeeper — nothing for you to prepare',
  'Messenger support 9am–4pm',
]

export default function LandingPage() {
  return (
    <div
      className="min-h-screen antialiased"
      style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)', background: '#ffffff', color: '#0B1627' }}
    >

      {/* ══════════════════════════════════════════════════════════
          NAV
      ══════════════════════════════════════════════════════════ */}
      <nav
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid #EEF0F5', background: '#ffffff' }}
      >
        <Image src="/logo.png" alt="Sigurado" width={160} height={107} className="object-contain" priority />
        <div className="flex items-center gap-2">
          <Link
            href="/register"
            className="text-sm font-bold px-4 py-2.5 rounded-xl"
            style={{ background: '#1A3FD0', color: '#ffffff' }}
          >
            Register
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold px-4 py-2.5 rounded-xl"
            style={{ background: '#F5F8FF', color: '#1A3FD0', border: '1.5px solid #C7D3F0' }}
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="px-5 pt-12 pb-14" style={{ background: '#F5F8FF' }}>
        <h1
          className="font-black leading-tight mb-5"
          style={{ fontSize: 'clamp(30px, 8vw, 58px)', color: '#0B1627', letterSpacing: '-0.025em', maxWidth: 560 }}
        >
          Dental clinic software
          <br />built for the Philippines.
        </h1>
        <p
          className="text-base leading-relaxed mb-8"
          style={{ color: '#5C6A85', maxWidth: 460 }}
        >
          If you can use a smartphone, Sigurado is for you. Patient records, receipts,
          payroll, and patient privacy — no tech background needed.
        </p>
        <Link
          href="/register"
          className="inline-block font-black text-base px-7 py-4 rounded-2xl"
          style={{ background: '#1A3FD0', color: '#ffffff' }}
        >
          Start your free month — no credit card needed
        </Link>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — EGO + TRUST
      ══════════════════════════════════════════════════════════ */}
      <section
        className="px-5 py-12"
        style={{ background: '#0B1627' }}
      >
        <p
          className="font-bold leading-snug mb-6"
          style={{ fontSize: 'clamp(20px, 5vw, 32px)', color: '#ffffff', maxWidth: 480 }}
        >
          Your patients judge your clinic before they sit in the chair.
          Sigurado makes sure what they see is professional.
        </p>
        <p
          className="font-black"
          style={{ fontSize: 'clamp(18px, 4vw, 26px)', color: '#F5C018' }}
        >
          Built by a dentist, for dentists.
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — HOW IT WORKS
      ══════════════════════════════════════════════════════════ */}
      <section className="px-5 py-14" style={{ background: '#ffffff' }}>
        <h2
          className="font-black leading-tight mb-10"
          style={{ fontSize: 'clamp(24px, 6vw, 40px)', color: '#0B1627', letterSpacing: '-0.02em' }}
        >
          Register and you&apos;re ready to go.
        </h2>

        <div className="flex flex-col gap-6">
          {[
            {
              n: '1',
              title: 'Create your clinic account — takes less than 5 minutes.',
            },
            {
              n: '2',
              title: 'Add your patients, services, and staff. We guide you through every step.',
            },
            {
              n: '3',
              title: 'Start seeing patients. Sigurado handles the records, receipts, and reports.',
            },
          ].map((step) => (
            <div
              key={step.n}
              className="flex gap-4 p-5 rounded-2xl"
              style={{ background: '#F5F8FF', border: '1px solid #E0E8F8' }}
            >
              <div
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-black text-base"
                style={{ background: '#1A3FD0', color: '#ffffff' }}
              >
                {step.n}
              </div>
              <p className="text-sm leading-relaxed font-medium pt-1.5" style={{ color: '#2A3A56' }}>
                {step.title}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm" style={{ color: '#9AAABB' }}>
          Questions? We&apos;re on Messenger, 9am–4pm.
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 4 — PRICING
      ══════════════════════════════════════════════════════════ */}
      <section className="py-14" style={{ background: '#F5F8FF', borderTop: '1px solid #EEF0F5' }}>
        <div className="px-5 mb-8">
          <h2
            className="font-black leading-tight"
            style={{ fontSize: 'clamp(24px, 6vw, 40px)', color: '#0B1627', letterSpacing: '-0.02em' }}
          >
            Simple, honest pricing.
          </h2>
          <p className="text-sm mt-2" style={{ color: '#5C6A85' }}>Month-to-month. Cancel any time.</p>
        </div>

        {/* Horizontal scroll container */}
        <div className="px-5 overflow-x-auto pb-3">
          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>

            {/* ── FREE ── */}
            <div
              className="flex flex-col rounded-2xl overflow-hidden"
              style={{ width: 260, background: '#ffffff', border: '1.5px solid #E0E8F8', flexShrink: 0 }}
            >
              <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px dashed #E0E8F8' }}>
                <p className="font-black text-xl mb-0.5" style={{ color: '#0B1627' }}>Free — 1 Month</p>
                <p className="text-xs mb-1" style={{ color: '#5C6A85' }}>Try everything, no commitment.</p>
                <p className="font-black text-3xl mt-3" style={{ color: '#0B1627', fontFamily: 'var(--font-geist-mono, monospace)' }}>Free</p>
                <p className="text-xs mt-1" style={{ color: '#9AAABB' }}>No credit card needed. Full access for 30 days.</p>
              </div>
              <div className="px-5 pt-4 pb-5 flex flex-col gap-2.5 flex-1">
                {FREE_FEATURES.map((f) => (
                  <div key={f} className="flex gap-2 text-xs leading-snug" style={{ color: '#3A4A66' }}>
                    <span className="shrink-0 font-bold" style={{ color: '#1A3FD0' }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <Link
                  href="/register"
                  className="block text-center font-bold text-sm py-3.5 rounded-xl"
                  style={{ background: '#E8EEFB', color: '#1A3FD0' }}
                >
                  Start for free
                </Link>
              </div>
            </div>

            {/* ── BASIC ── */}
            <div
              className="flex flex-col rounded-2xl overflow-hidden"
              style={{ width: 260, background: '#ffffff', border: '1.5px solid #E0E8F8', flexShrink: 0 }}
            >
              <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px dashed #E0E8F8' }}>
                <p className="font-black text-xl mb-0.5" style={{ color: '#0B1627' }}>Basic</p>
                <p className="text-xs mb-1" style={{ color: '#5C6A85' }}>Everything your clinic needs to run smoothly.</p>
                <p className="font-black text-3xl mt-3" style={{ color: '#0B1627', fontFamily: 'var(--font-geist-mono, monospace)' }}>₱999<span className="text-sm font-semibold">/month</span></p>
              </div>
              <div className="px-5 pt-4 pb-5 flex flex-col gap-2.5 flex-1">
                {BASIC_FEATURES.map((f) => (
                  <div key={f} className="flex gap-2 text-xs leading-snug" style={{ color: '#3A4A66' }}>
                    <span className="shrink-0 font-bold" style={{ color: '#1A3FD0' }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <Link
                  href="/register"
                  className="block text-center font-bold text-sm py-3.5 rounded-xl"
                  style={{ background: '#0B1627', color: '#ffffff' }}
                >
                  Get Basic
                </Link>
              </div>
            </div>

            {/* ── PRO ── */}
            <div
              className="flex flex-col rounded-2xl overflow-hidden"
              style={{ width: 260, background: '#1A3FD0', flexShrink: 0 }}
            >
              <div className="px-4 py-1.5 text-center" style={{ background: '#F5C018' }}>
                <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#0B1627' }}>Most Popular</p>
              </div>
              <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px dashed rgba(255,255,255,0.2)' }}>
                <p className="font-black text-xl mb-0.5" style={{ color: '#ffffff' }}>Pro</p>
                <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>With Bookkeeping Support.</p>
                <p className="font-black text-3xl mt-3" style={{ color: '#ffffff', fontFamily: 'var(--font-geist-mono, monospace)' }}>₱1,500<span className="text-sm font-semibold">/month</span></p>
              </div>
              <div className="px-5 pt-4 pb-5 flex flex-col gap-2.5 flex-1">
                <p className="text-xs font-bold mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Everything in Basic, plus:</p>
                {PRO_EXTRAS.map((f) => (
                  <div key={f} className="flex gap-2 text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    <span className="shrink-0 font-bold" style={{ color: '#F5C018' }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <Link
                  href="/register"
                  className="block text-center font-black text-sm py-3.5 rounded-xl"
                  style={{ background: '#F5C018', color: '#0B1627' }}
                >
                  Get Pro
                </Link>
              </div>
            </div>

          </div>
        </div>

        <p className="px-5 mt-4 text-xs" style={{ color: '#9AAABB' }}>
          Prices are in Philippine Pesos (₱). Upgrade, downgrade, or cancel any time.
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 5 — PRIVACY CALLOUT
      ══════════════════════════════════════════════════════════ */}
      <section className="px-5 py-14" style={{ background: '#ffffff', borderTop: '1px solid #EEF0F5' }}>
        <div className="rounded-2xl p-6" style={{ background: '#0B1627' }}>
          <h2
            className="font-black leading-tight mb-4"
            style={{ fontSize: 'clamp(20px, 5vw, 32px)', color: '#ffffff', letterSpacing: '-0.02em' }}
          >
            Patient records must be kept private by law.
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Sigurado handles that for you. Consent records, access logs, and incident reporting — all built in.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 6 — FINAL CTA
      ══════════════════════════════════════════════════════════ */}
      <section
        className="px-5 py-16 flex flex-col items-center text-center"
        style={{ background: '#1A3FD0' }}
      >
        <h2
          className="font-black leading-tight mb-3"
          style={{ fontSize: 'clamp(26px, 7vw, 46px)', color: '#ffffff', letterSpacing: '-0.02em', maxWidth: 420 }}
        >
          Ready to run your clinic the modern way?
        </h2>
        <p className="text-sm mb-9" style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 340 }}>
          Join dental clinics across the Philippines already using Sigurado.
        </p>
        <Link
          href="/register"
          className="inline-block font-black text-base px-7 py-4 rounded-2xl"
          style={{ background: '#F5C018', color: '#0B1627' }}
        >
          Start your free month — no credit card needed
        </Link>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer
        className="px-5 py-8 flex flex-col gap-3"
        style={{ background: '#060E1F' }}
      >
        <Image src="/logo.png" alt="Sigurado" width={100} height={67} className="object-contain brightness-0 invert opacity-60" />
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          © {new Date().getFullYear()} Sigurado. Built for Philippine dental clinics.
        </p>
        <a
          href="https://m.me/sigurado"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Contact us on Messenger
        </a>
      </footer>

    </div>
  )
}
