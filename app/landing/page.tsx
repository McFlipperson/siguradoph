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
  'Monthly reports delivered to your bookkeeper/Accountant — nothing for you to prepare',
  'Employee records & attendance tracking',
  'Service Incentive Leave (SIL) tracking',
  'Patient privacy tools — consent records & audit logs',
  'Incident logging & breach reporting',
  'Bookkeeper portal — read-only access to your clinic financials',
  'Quarterly revenue summary — gross sales, expenses, net payable',
  'Invoice & expense CSV export in accountant-ready format',
  'DAT file export for government submission',
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
          Mobile: text → image stacked
          sm+: text left, dashboard screenshot right (floats up)
      ══════════════════════════════════════════════════════════ */}
      <section
        className="overflow-hidden"
        style={{ background: '#F5F8FF' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-0">

          {/* Text side */}
          <div className="flex-1 px-5 pt-12 pb-10 sm:pb-0">
            <h1
              className="font-black leading-tight mb-5"
              style={{ fontSize: 'clamp(28px, 7vw, 54px)', color: '#0B1627', letterSpacing: '-0.025em' }}
            >
              Dental clinic software
              <br />built for the Philippines.
            </h1>
            <p className="text-base leading-relaxed mb-8" style={{ color: '#5C6A85', maxWidth: 400 }}>
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
          </div>

          {/* Dashboard screenshot — right side, floats up from bottom */}
          <div className="flex justify-center sm:justify-end sm:flex-shrink-0 sm:self-end px-5 sm:px-8 pt-6 sm:pt-0">
            <div
              style={{
                width: 200,
                borderRadius: '20px 20px 0 0',
                overflow: 'hidden',
                boxShadow: '0 -6px 32px rgba(26,63,208,0.18), 0 0 0 1.5px rgba(26,63,208,0.12)',
                background: '#ffffff',
              }}
            >
              <Image
                src="/images/Hero-Dashboard.png"
                alt="Sigurado app dashboard"
                width={200}
                height={430}
                className="object-top object-cover block"
                priority
              />
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — EGO + TRUST
          Full image shown (no crop), text overlaid at bottom
          on the dark/neutral area — not over the doctor
      ══════════════════════════════════════════════════════════ */}
      <section className="relative">
        {/* Full image at natural ratio — no crop, no cut head */}
        <Image
          src="/images/section2.png"
          alt="Filipino dental clinic"
          width={1448}
          height={1086}
          className="w-full h-auto block"
        />

        {/* Gradient overlay — dark from the bottom third only,
            so the doctor's face (top area) stays clear */}
        <div
          className="absolute inset-0 flex flex-col justify-end px-5 pb-8 sm:pb-12"
          style={{
            background: 'linear-gradient(to top, rgba(11,22,39,0.95) 0%, rgba(11,22,39,0.75) 30%, rgba(11,22,39,0.1) 55%, transparent 70%)',
          }}
        >
          <p
            className="font-bold leading-snug mb-4"
            style={{
              fontSize: 'clamp(17px, 4vw, 28px)',
              color: '#ffffff',
              maxWidth: 460,
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}
          >
            Your patients judge your clinic before they sit in the chair.
            Sigurado makes sure what they see is professional.
          </p>
          <p
            className="font-black"
            style={{
              fontSize: 'clamp(16px, 3.5vw, 22px)',
              color: '#F5C018',
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}
          >
            Built by a dentist, for dentists.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — HOW IT WORKS
          Heading → 3 steps → Messenger callout → lifestyle image
      ══════════════════════════════════════════════════════════ */}
      <section>
        <div className="px-5 py-14" style={{ background: '#ffffff' }}>
          <h2
            className="font-black leading-tight mb-10"
            style={{ fontSize: 'clamp(24px, 6vw, 40px)', color: '#0B1627', letterSpacing: '-0.02em' }}
          >
            Register and you&apos;re ready to go.
          </h2>

          <div className="flex flex-col gap-6 mb-8">
            {[
              { n: '1', title: 'Create your clinic account — takes less than 5 minutes.' },
              { n: '2', title: 'Add your patients, services, and staff. We guide you through every step.' },
              { n: '3', title: 'Start seeing patients. Sigurado handles the records, receipts, and reports.' },
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

          {/* Messenger callout — prominent, confidence-building */}
          <a
            href="https://m.me/sigurado"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 rounded-2xl"
            style={{ background: '#1A3FD0', textDecoration: 'none' }}
          >
            <div
              className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-xl"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              💬
            </div>
            <div>
              <p className="font-black text-base leading-tight mb-0.5" style={{ color: '#ffffff' }}>
                Questions? We&apos;re on Messenger.
              </p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                9am–4pm — real support, real people. You&apos;re not alone.
              </p>
            </div>
            <span className="ml-auto text-xl" style={{ color: 'rgba(255,255,255,0.5)' }}>→</span>
          </a>
        </div>

        {/* Lifestyle image at the bottom of this section */}
        <div className="relative w-full" style={{ height: 280 }}>
          <Image
            src="/images/section3.png"
            alt="Using Sigurado on a smartphone"
            fill
            className="object-cover object-center"
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 4 — PRICING
          Hover: cards scale up slightly on hover
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

        <div className="px-5 overflow-x-auto pb-6">
          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>

            {/* FREE */}
            <div
              className="flex flex-col rounded-2xl overflow-hidden transition-transform duration-200 hover:scale-[1.03] cursor-pointer"
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
                <Link href="/register" className="block text-center font-bold text-sm py-3.5 rounded-xl" style={{ background: '#E8EEFB', color: '#1A3FD0' }}>
                  Start for free
                </Link>
              </div>
            </div>

            {/* BASIC */}
            <div
              className="flex flex-col rounded-2xl overflow-hidden transition-transform duration-200 hover:scale-[1.03] cursor-pointer"
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
                <Link href="/register" className="block text-center font-bold text-sm py-3.5 rounded-xl" style={{ background: '#0B1627', color: '#ffffff' }}>
                  Get Basic
                </Link>
              </div>
            </div>

            {/* PRO */}
            <div
              className="flex flex-col rounded-2xl overflow-hidden transition-transform duration-200 hover:scale-[1.03] cursor-pointer"
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
                <Link href="/register" className="block text-center font-black text-sm py-3.5 rounded-xl" style={{ background: '#F5C018', color: '#0B1627' }}>
                  Get Pro
                </Link>
              </div>
            </div>

          </div>
        </div>

        <p className="px-5 mt-2 text-xs" style={{ color: '#9AAABB' }}>
          Prices are in Philippine Pesos (₱). Upgrade, downgrade, or cancel any time.
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 5 — PRIVACY CALLOUT
          Full-width image, no text overlay
      ══════════════════════════════════════════════════════════ */}
      <section>
        <Image
          src="/images/section5.png"
          alt="Patient privacy — Sigurado keeps your records protected"
          width={1672}
          height={941}
          className="w-full h-auto block"
        />
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
      <footer className="px-5 py-8 flex flex-col gap-3" style={{ background: '#060E1F' }}>
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
