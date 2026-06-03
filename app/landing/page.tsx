import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sigurado — Dental Clinic Software Built for the Philippines',
  description:
    'If you can use a smartphone, Sigurado is for you. Patient records, receipts, reminders, and patient privacy — no tech background needed.',
}

// ── Brand palette — Philippine flag ────────────────────────────────────────────
// Primary blue:  #0038A8  (backgrounds, nav, headers)
// Primary red:   #CE1126  (all CTA buttons)
// Accent gold:   #FCD116  (badges, scarcity, highlights)

const FREE_FEATURES = [
  'Up to 30 patients',
  'Patient records, medical history & visit notes',
  'OR receipts & invoices',
  'Expense tracking',
  'Messenger support 9am–4pm',
]

const BASIC_FEATURES = [
  'Unlimited patients',
  'Patient records, medical history & visit notes',
  'OR receipts, invoices & thermal printing',
  'Scheduling & appointments',
  'Automated patient reminders via Messenger & email',
  'Loyalty cards & Senior Citizen / PWD discounts',
  'Expense tracking & revenue reports',
  'Data export — patients, invoices, expenses',
  'Messenger support 9am–4pm',
]

const PRO_EXTRAS = [
  'Full privacy & compliance suite — consent records, audit logs',
  'Data-breach reporting — 72-hour NPC clock & annual report (ASIR)',
  'Employee records & attendance tracking',
  'Payroll — SSS, PhilHealth, Pag-IBIG, 13th month & holiday pay',
  'Service Incentive Leave (SIL) tracking',
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
        style={{ background: 'rgba(0,30,100,0.82)', backdropFilter: 'blur(8px)' }}
      >
        <div className="flex items-center">
          <Image
            src="/images/sig-final-ph-logo.png"
            alt="Sigurado"
            width={160}
            height={87}
            className="object-contain"
            priority
          />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/register"
            className="text-sm font-bold px-4 py-2.5 rounded-xl"
            style={{ background: '#CE1126', color: '#ffffff' }}
          >
            Register
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#ffffff', border: '1.5px solid rgba(255,255,255,0.3)' }}
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
      {/* Hero is the image itself — buttons will be wired as overlay regions later */}
      <section className="relative w-full">
        <Image
          src="/images/hero.png"
          alt="Sigurado — dental clinic software built for the Philippines"
          width={1024}
          height={608}
          priority
          className="block w-full h-auto"
        />
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — EGO + TRUST
          Full image shown (no crop), text overlaid at bottom
          on the dark/neutral area — not over the doctor
      ══════════════════════════════════════════════════════════ */}
      <section className="relative">
        {/* Full image at natural ratio — no crop, no cut head */}
        <Image
          src="/images/joey-clinic.jpeg"
          alt="Filipino dental clinic"
          width={1024}
          height={768}
          className="w-full h-auto block"
        />

        {/* Gradient overlay — dark from the bottom third only */}
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
              color: '#FCD116',
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
                  style={{ background: '#0038A8', color: '#ffffff' }}
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
            style={{ background: '#0038A8', textDecoration: 'none' }}
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
          BRAND STRIP — between How It Works and Pricing
      ══════════════════════════════════════════════════════════ */}
      <div
        className="flex items-center justify-center px-5 py-5"
        style={{ background: '#0B1627' }}
      >
        <p className="font-black text-sm tracking-wide" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Sigurado — Dental clinic software built for the Philippines.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 4 — PRICING
      ══════════════════════════════════════════════════════════ */}
      <section className="py-14" style={{ background: '#F5F8FF', borderTop: '1px solid #EEF0F5' }}>
        <div className="px-5 mb-6">
          <h2
            className="font-black leading-tight"
            style={{ fontSize: 'clamp(24px, 6vw, 40px)', color: '#0B1627', letterSpacing: '-0.02em' }}
          >
            Simple, honest pricing.
          </h2>
          <p className="text-sm mt-2" style={{ color: '#5C6A85' }}>Free forever for small clinics. Upgrade when you&apos;re ready.</p>
        </div>

        {/* Scarcity line — CHANGE 4 (above boxes) */}
        <div className="px-5 mb-6">
          <div
            className="rounded-2xl px-5 py-4"
            style={{ background: '#0038A8' }}
          >
            <p className="font-black text-sm leading-snug" style={{ color: '#FCD116' }}>
              🔒 Founding member pricing — locked in for the first 100 clinics. Price will not increase as long as the subscription is active.
            </p>
          </div>
        </div>

        <div className="px-5 overflow-x-auto pb-6">
          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>

            {/* FREE */}
            <div
              className="flex flex-col rounded-2xl overflow-hidden transition-transform duration-200 hover:scale-[1.03] cursor-pointer"
              style={{ width: 260, background: '#ffffff', border: '1.5px solid #E0E8F8', flexShrink: 0 }}
            >
              <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px dashed #E0E8F8' }}>
                <p className="font-black text-xl mb-0.5" style={{ color: '#0B1627' }}>Free</p>
                <p className="text-xs mb-1" style={{ color: '#5C6A85' }}>For clinics just getting started.</p>
                <p className="font-black text-3xl mt-3" style={{ color: '#0B1627', fontFamily: 'var(--font-geist-mono, monospace)' }}>₱0</p>
                <p className="text-xs mt-1" style={{ color: '#9AAABB' }}>No credit card. No time limit. Up to 30 patients.</p>
              </div>
              <div className="px-5 pt-4 pb-5 flex flex-col gap-2.5 flex-1">
                {FREE_FEATURES.map((f) => (
                  <div key={f} className="flex gap-2 text-xs leading-snug" style={{ color: '#3A4A66' }}>
                    <span className="shrink-0 font-bold" style={{ color: '#0038A8' }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <Link href="/register" className="block text-center font-bold text-sm py-3.5 rounded-xl" style={{ background: '#CE1126', color: '#ffffff' }}>
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
                <p className="font-black text-3xl mt-3" style={{ color: '#0B1627', fontFamily: 'var(--font-geist-mono, monospace)' }}>₱499<span className="text-sm font-semibold">/month</span></p>
              </div>
              <div className="px-5 pt-4 pb-5 flex flex-col gap-2.5 flex-1">
                {BASIC_FEATURES.map((f) => (
                  <div key={f} className="flex gap-2 text-xs leading-snug" style={{ color: '#3A4A66' }}>
                    <span className="shrink-0 font-bold" style={{ color: '#0038A8' }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <Link href="/register?plan=basic" className="block text-center font-bold text-sm py-3.5 rounded-xl" style={{ background: '#CE1126', color: '#ffffff' }}>
                  Get Basic
                </Link>
              </div>
            </div>

            {/* PRO */}
            <div
              className="flex flex-col rounded-2xl overflow-hidden transition-transform duration-200 hover:scale-[1.03] cursor-pointer"
              style={{ width: 260, background: '#0038A8', flexShrink: 0 }}
            >
              <div className="px-4 py-1.5 text-center" style={{ background: '#FCD116' }}>
                <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#0B1627' }}>Most Popular</p>
              </div>
              <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px dashed rgba(255,255,255,0.2)' }}>
                <p className="font-black text-xl mb-0.5" style={{ color: '#ffffff' }}>Pro</p>
                <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>For clinics with staff.</p>
                <p className="font-black text-3xl mt-3" style={{ color: '#ffffff', fontFamily: 'var(--font-geist-mono, monospace)' }}>₱999<span className="text-sm font-semibold">/month</span></p>
              </div>
              <div className="px-5 pt-4 pb-5 flex flex-col gap-2.5 flex-1">
                <p className="text-xs font-bold mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Everything in Basic, plus:</p>
                {PRO_EXTRAS.map((f) => (
                  <div key={f} className="flex gap-2 text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    <span className="shrink-0 font-bold" style={{ color: '#FCD116' }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <Link href="/register?plan=pro" className="block text-center font-black text-sm py-3.5 rounded-xl" style={{ background: '#CE1126', color: '#ffffff' }}>
                  Get Pro
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Guarantee line — CHANGE 4 (below boxes) */}
        <p className="px-5 mt-5 text-sm text-center font-medium" style={{ color: '#5C6A85' }}>
          Cancel anytime. One click. No contracts. No questions asked.
        </p>
        <p className="px-5 mt-1 text-xs text-center" style={{ color: '#9AAABB' }}>
          Prices are in Philippine Pesos (₱). Month-to-month. Upgrade, downgrade, or cancel any time.
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 5 — PRIVACY CALLOUT
          Image + text block below — CHANGE 5
      ══════════════════════════════════════════════════════════ */}
      <section>
        <Image
          src="/images/section5.png"
          alt="Patient privacy — Sigurado keeps your records protected"
          width={1536}
          height={1024}
          className="w-full h-auto block"
        />
        <div className="px-5 py-12" style={{ background: '#0B1627' }}>
          <div className="mb-6">
            <Image
              src="/images/sig-final-ph-logo.png"
              alt="Sigurado"
              width={160}
              height={87}
              className="object-contain"
            />
          </div>
          <h2
            className="font-black leading-tight mb-4"
            style={{ fontSize: 'clamp(22px, 5vw, 36px)', color: '#ffffff', letterSpacing: '-0.02em', maxWidth: 500 }}
          >
            Patient records must be kept private by law.
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 500 }}>
            Sigurado handles that for you. Consent records, access logs, and incident reporting — all built in.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: 500 }}>
            Sigurado was built inside a real Philippine dental clinic. We know it works. That&apos;s why the free tier has no time limit — we&apos;re confident enough to let the product speak for itself.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 6 — FINAL CTA
      ══════════════════════════════════════════════════════════ */}
      <section
        className="px-5 py-16 flex flex-col items-center text-center"
        style={{ background: '#0038A8' }}
      >
        <h2
          className="font-black leading-tight mb-3"
          style={{ fontSize: 'clamp(26px, 7vw, 46px)', color: '#ffffff', letterSpacing: '-0.02em', maxWidth: 420 }}
        >
          Ready to run your clinic the modern way?
        </h2>
        {/* Subtext — CHANGE 7 */}
        <p className="text-sm mb-9" style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 380 }}>
          Join the first dental clinics in the Philippines running on Sigurado. Founding member pricing — locked in forever.
        </p>
        <Link
          href="/register"
          className="inline-block font-black text-base px-7 py-4 rounded-2xl"
          style={{ background: '#CE1126', color: '#ffffff' }}
        >
          Start free — no credit card needed
        </Link>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="px-5 py-10 flex flex-col gap-4" style={{ background: '#060E1F' }}>
        <div className="flex items-center">
          <Image
            src="/images/sig-final-ph-logo.png"
            alt="Sigurado"
            width={140}
            height={76}
            className="object-contain"
          />
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          © {new Date().getFullYear()} Sigurado. Built for Philippine dental clinics.
        </p>
        <div className="flex gap-4">
          <a
            href="https://m.me/sigurado"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            Contact us on Messenger
          </a>
          <Link
            href="/privacy"
            className="text-xs underline"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            Privacy Policy
          </Link>
        </div>
      </footer>

    </div>
  )
}
