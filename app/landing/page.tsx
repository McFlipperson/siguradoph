import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sigurado — Dental Clinic Management Built for the Philippines',
  description:
    'Run your dental clinic from your phone. Receipts, patient records, government tax requirements, and appointment reminders — handled automatically.',
}

// ─── inline style tokens ────────────────────────────────────────────────────
const NAVY = '#0B1A33'
const BLUE = '#2756C5'
const GOLD = '#F5C018'
const PAPER = '#F8F7F4'
const WHITE = '#FFFFFF'
const LIGHT_BLUE = '#EBF1FF'

export default function LandingPage() {
  return (
    <div
      className="min-h-screen antialiased"
      style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)', color: NAVY }}
    >
      {/* ═══════════════════════════════════════════════════════════
          NAV — minimal, sticky
      ═══════════════════════════════════════════════════════════ */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-5 py-3"
        style={{ background: NAVY }}
      >
        <Image src="/logo.png" alt="Sigurado" width={110} height={34} className="object-contain" />
        <Link
          href="/login"
          className="text-sm font-medium px-4 py-2 rounded-lg"
          style={{ color: WHITE, border: `1px solid rgba(255,255,255,0.25)` }}
        >
          Sign in
        </Link>
      </nav>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — HERO
          Dark navy. Big left-aligned statement. Gold CTA.
      ═══════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden px-5 pt-14 pb-16"
        style={{ background: NAVY }}
      >
        {/* giant faint SIGURADO watermark */}
        <div
          aria-hidden
          className="absolute right-0 top-0 select-none pointer-events-none leading-none font-black"
          style={{
            fontSize: 'clamp(120px, 40vw, 280px)',
            color: 'rgba(255,255,255,0.03)',
            letterSpacing: '-0.04em',
            transform: 'translateX(15%)',
          }}
        >
          SIG
        </div>

        <div className="relative max-w-2xl">
          {/* eyebrow */}
          <p
            className="text-xs font-semibold tracking-[0.18em] uppercase mb-5"
            style={{ color: GOLD }}
          >
            For Philippine Dental Clinics
          </p>

          {/* headline */}
          <h1
            className="font-black leading-[1.05] mb-6"
            style={{
              fontSize: 'clamp(38px, 10vw, 72px)',
              color: WHITE,
              letterSpacing: '-0.02em',
            }}
          >
            Your clinic&apos;s
            <br />
            paperwork,
            <br />
            <span style={{ color: GOLD }}>handled.</span>
          </h1>

          {/* sub */}
          <p
            className="text-base leading-relaxed mb-10 max-w-md"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            Sigurado generates official receipts, tracks patient records,
            and keeps you compliant with Philippine tax and privacy laws —
            automatically, from any phone.
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-3 max-w-xs">
            <Link
              href="/register"
              className="block text-center font-bold text-base py-4 rounded-xl"
              style={{ background: GOLD, color: NAVY }}
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="block text-center font-medium text-base py-4 rounded-xl"
              style={{
                color: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              Sign in to your clinic →
            </Link>
          </div>

          {/* reassurance */}
          <p className="mt-5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            No credit card required. Free plan includes 1 clinic, unlimited patients.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 — TRUST / COMPLIANCE STRIP
          White. Three compliance pillars, text-forward.
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ background: WHITE }}>
        <div
          className="border-b"
          style={{ borderColor: '#E5E9F2' }}
        >
          <div className="px-5 py-4">
            <p
              className="text-[10px] font-semibold tracking-[0.2em] uppercase"
              style={{ color: '#8898B3' }}
            >
              Built to comply with Philippine law
            </p>
          </div>
        </div>

        <div className="px-5 py-8 grid grid-cols-1 gap-0">
          {[
            {
              law: 'RR 11-2025',
              title: 'Official receipts the Tax Authority accepts',
              body: 'Every visit generates a properly numbered, VAT-exempt official receipt ready for Bureau of Internal Revenue (BIR) e-invoicing.',
            },
            {
              law: 'RA 10173',
              title: 'Patient data treated as the law requires',
              body: 'Patient records are classified as Sensitive Personal Information. Access is logged. Consent is recorded. Every action is audited.',
            },
            {
              law: 'RA 9994 / 10754',
              title: 'Senior Citizen and Person with Disability discounts applied correctly',
              body: '20% discounts are computed automatically at checkout, with the required ID number captured and stored for compliance.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="py-7 flex gap-5"
              style={{ borderBottom: i < 2 ? '1px solid #E5E9F2' : undefined }}
            >
              <div
                className="shrink-0 text-xs font-black tracking-tight pt-0.5"
                style={{
                  fontFamily: 'var(--font-geist-mono, monospace)',
                  color: BLUE,
                  minWidth: 70,
                }}
              >
                {item.law}
              </div>
              <div>
                <p className="font-bold text-sm mb-1" style={{ color: NAVY }}>
                  {item.title}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#556080' }}>
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3 — PAIN POINTS
          Dark. Candid. No marketing-speak.
      ═══════════════════════════════════════════════════════════ */}
      <section className="px-5 py-14" style={{ background: NAVY }}>
        <p
          className="text-xs font-semibold tracking-[0.18em] uppercase mb-3"
          style={{ color: GOLD }}
        >
          Sound familiar?
        </p>
        <h2
          className="font-black mb-10 leading-tight"
          style={{ fontSize: 'clamp(28px, 7vw, 48px)', color: WHITE, letterSpacing: '-0.02em' }}
        >
          You didn&apos;t go to dental school
          <br />to fill out forms.
        </h2>

        <ul className="flex flex-col gap-4">
          {[
            'Handwriting OR numbers on every receipt, then computing the total manually.',
            'Forgetting which patients are six months overdue for their cleaning.',
            'Digging through paper folders when a patient asks about last year\'s treatment.',
            'Closing up the clinic and realising you still have payroll to process.',
            'Not knowing if you\'re doing the BIR paperwork right — or at all.',
          ].map((pain, i) => (
            <li
              key={i}
              className="flex gap-4 text-sm leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.72)' }}
            >
              <span
                className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(245,192,24,0.15)', color: GOLD }}
              >
                ✕
              </span>
              {pain}
            </li>
          ))}
        </ul>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4 — HOW IT WORKS
          Paper/off-white. Three numbered steps, no icons.
      ═══════════════════════════════════════════════════════════ */}
      <section className="px-5 py-14" style={{ background: PAPER }}>
        <p
          className="text-xs font-semibold tracking-[0.18em] uppercase mb-2"
          style={{ color: BLUE }}
        >
          How it works
        </p>
        <h2
          className="font-black mb-10 leading-tight"
          style={{ fontSize: 'clamp(26px, 6vw, 42px)', color: NAVY, letterSpacing: '-0.02em' }}
        >
          Three steps.
          <br />That&apos;s actually it.
        </h2>

        <div className="flex flex-col gap-0">
          {[
            {
              n: '01',
              title: 'Register your clinic',
              body: 'Enter your clinic details and start your free plan. No contracts, no credit card. Setup takes under five minutes.',
            },
            {
              n: '02',
              title: 'Add patients and record visits from your phone',
              body: 'Your secretary taps through the visit form on any phone or tablet. Diagnosis, treatment, and price — done. The system handles the rest.',
            },
            {
              n: '03',
              title: 'Official receipts appear automatically',
              body: 'Every visit generates a properly numbered, tax-compliant receipt. Send it by email, print it on-site, or keep it on record. All without touching a spreadsheet.',
            },
          ].map((step, i) => (
            <div
              key={i}
              className="py-8 flex gap-5"
              style={{ borderBottom: i < 2 ? '1px solid #DDE2EC' : undefined }}
            >
              <div
                className="shrink-0 font-black leading-none"
                style={{
                  fontSize: 'clamp(40px, 10vw, 64px)',
                  color: '#DDE2EC',
                  fontFamily: 'var(--font-geist-mono, monospace)',
                  letterSpacing: '-0.04em',
                  minWidth: 64,
                }}
              >
                {step.n}
              </div>
              <div className="pt-1">
                <p className="font-bold text-base mb-1.5" style={{ color: NAVY }}>
                  {step.title}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#556080' }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5 — PRICING
          Receipt-style. White. Three tiers clearly stated.
      ═══════════════════════════════════════════════════════════ */}
      <section className="px-5 py-14" style={{ background: WHITE }}>
        <p
          className="text-xs font-semibold tracking-[0.18em] uppercase mb-2"
          style={{ color: BLUE }}
        >
          Pricing
        </p>
        <h2
          className="font-black mb-10 leading-tight"
          style={{ fontSize: 'clamp(26px, 6vw, 42px)', color: NAVY, letterSpacing: '-0.02em' }}
        >
          No tiers hidden behind
          <br />&ldquo;contact us.&rdquo;
        </h2>

        <div className="flex flex-col gap-4">
          {/* FREE */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1.5px solid #E5E9F2' }}
          >
            <div className="px-5 py-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-black text-xl" style={{ color: NAVY }}>Free</p>
                  <p
                    className="text-xs font-medium tracking-wide mt-0.5"
                    style={{ color: '#8898B3' }}
                  >
                    Forever
                  </p>
                </div>
                <span
                  className="text-2xl font-black"
                  style={{ fontFamily: 'var(--font-geist-mono, monospace)', color: NAVY }}
                >
                  ₱0
                </span>
              </div>
              <div
                className="border-t border-dashed pt-4 flex flex-col gap-2"
                style={{ borderColor: '#E5E9F2' }}
              >
                {[
                  '1 clinic location',
                  'Unlimited patients',
                  'Unlimited visits',
                  'Official receipt generation',
                  'Patient records and medical history',
                  'Appointment scheduling',
                ].map((f) => (
                  <p key={f} className="text-sm flex gap-2" style={{ color: '#556080' }}>
                    <span style={{ color: BLUE }}>✓</span> {f}
                  </p>
                ))}
              </div>
            </div>
            <div className="px-5 pb-5">
              <Link
                href="/register"
                className="block text-center font-bold text-sm py-3.5 rounded-xl"
                style={{ background: LIGHT_BLUE, color: BLUE }}
              >
                Start free
              </Link>
            </div>
          </div>

          {/* BASIC */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: `2px solid ${BLUE}` }}
          >
            <div className="px-4 py-2 text-center text-xs font-bold tracking-widest uppercase" style={{ background: BLUE, color: WHITE }}>
              Most popular
            </div>
            <div className="px-5 py-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-black text-xl" style={{ color: NAVY }}>Basic</p>
                  <p
                    className="text-xs font-medium tracking-wide mt-0.5"
                    style={{ color: '#8898B3' }}
                  >
                    per month, billed monthly
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className="text-2xl font-black"
                    style={{ fontFamily: 'var(--font-geist-mono, monospace)', color: NAVY }}
                  >
                    ₱999
                  </span>
                </div>
              </div>
              <div
                className="border-t border-dashed pt-4 flex flex-col gap-2"
                style={{ borderColor: '#E5E9F2' }}
              >
                {[
                  'Everything in Free',
                  'Payroll tracking for staff',
                  'Expense recording',
                  'Loyalty card management',
                  'Patient reminders via Messenger',
                  'Quarterly financial summaries',
                  'Audit logs for data privacy compliance',
                  'SC / PWD discount tracking',
                ].map((f) => (
                  <p key={f} className="text-sm flex gap-2" style={{ color: '#556080' }}>
                    <span style={{ color: BLUE }}>✓</span> {f}
                  </p>
                ))}
              </div>
            </div>
            <div className="px-5 pb-5">
              <Link
                href="/register"
                className="block text-center font-bold text-sm py-3.5 rounded-xl"
                style={{ background: BLUE, color: WHITE }}
              >
                Get started — ₱999 / mo
              </Link>
            </div>
          </div>

          {/* PRO */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1.5px solid #E5E9F2' }}
          >
            <div className="px-5 py-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-black text-xl" style={{ color: NAVY }}>Pro</p>
                  <p
                    className="text-xs font-medium tracking-wide mt-0.5"
                    style={{ color: '#8898B3' }}
                  >
                    per month, billed monthly
                  </p>
                </div>
                <span
                  className="text-2xl font-black"
                  style={{ fontFamily: 'var(--font-geist-mono, monospace)', color: NAVY }}
                >
                  ₱1,500
                </span>
              </div>
              <div
                className="border-t border-dashed pt-4 flex flex-col gap-2"
                style={{ borderColor: '#E5E9F2' }}
              >
                {[
                  'Everything in Basic',
                  'With Bookkeeping Support — a real accountant reviews your records each quarter',
                  'BIR e-invoicing transmittal (when required)',
                  'Priority support',
                ].map((f) => (
                  <p key={f} className="text-sm flex gap-2 items-start" style={{ color: '#556080' }}>
                    <span className="shrink-0 mt-0.5" style={{ color: BLUE }}>✓</span> {f}
                  </p>
                ))}
              </div>
            </div>
            <div className="px-5 pb-5">
              <Link
                href="/register"
                className="block text-center font-bold text-sm py-3.5 rounded-xl"
                style={{ background: PAPER, color: NAVY, border: '1.5px solid #E5E9F2' }}
              >
                Get started — ₱1,500 / mo
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-center" style={{ color: '#8898B3' }}>
          All plans are month-to-month. Cancel any time. Prices are in Philippine Pesos.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 6 — PRIVACY CALLOUT
          Brand blue. RA 10173 front and center.
      ═══════════════════════════════════════════════════════════ */}
      <section className="px-5 py-14" style={{ background: BLUE }}>
        <div
          aria-hidden
          className="text-[120px] font-black leading-none mb-6 opacity-10 tracking-tight"
          style={{ fontFamily: 'var(--font-geist-mono, monospace)', color: WHITE }}
        >
          RA{' '}10173
        </div>

        <h2
          className="font-black mb-4 leading-tight"
          style={{ fontSize: 'clamp(24px, 6vw, 40px)', color: WHITE, letterSpacing: '-0.02em' }}
        >
          Your patients trust you
          <br />with their health records.
          <br />We treat that seriously.
        </h2>

        <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.75)' }}>
          Philippine law (Republic Act 10173 — the Data Privacy Act) classifies dental records
          as Sensitive Personal Information. Sigurado enforces this with access logging,
          consent records, and secure multi-clinic isolation. No clinic ever sees another clinic&apos;s data.
        </p>

        <div className="flex flex-col gap-3">
          {[
            'Every access to a patient record is logged with the user and timestamp',
            'Consent is recorded at enrollment',
            'Patients are never shared between clinic accounts',
          ].map((point, i) => (
            <div
              key={i}
              className="flex gap-3 text-sm"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              <span className="shrink-0 font-bold" style={{ color: GOLD }}>—</span>
              {point}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 7 — FINAL CTA
          Dark navy. One clean action.
      ═══════════════════════════════════════════════════════════ */}
      <section className="px-5 py-16 flex flex-col items-center text-center" style={{ background: NAVY }}>
        <Image
          src="/logo.png"
          alt="Sigurado"
          width={100}
          height={31}
          className="object-contain mb-8 opacity-90"
        />

        <h2
          className="font-black mb-4 leading-tight"
          style={{
            fontSize: 'clamp(28px, 8vw, 52px)',
            color: WHITE,
            letterSpacing: '-0.02em',
            maxWidth: 480,
          }}
        >
          Your clinic is ready
          <br />when you are.
        </h2>

        <p className="text-sm mb-10 max-w-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Start on the free plan today. No credit card, no contracts, no setup fee.
          Upgrade any time.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/register"
            className="block text-center font-bold text-base py-4 rounded-xl"
            style={{ background: GOLD, color: NAVY }}
          >
            Register your clinic — it&apos;s free
          </Link>
          <Link
            href="/login"
            className="block text-center font-medium text-sm py-3.5 rounded-xl"
            style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            Already registered? Sign in →
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════ */}
      <footer
        className="px-5 py-6 flex flex-col gap-1"
        style={{ background: '#060E1F', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          © {new Date().getFullYear()} Sigurado. Built for Philippine dental clinics.
        </p>
        <div className="flex gap-4 mt-1">
          <Link href="/login" className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Sign in
          </Link>
          <Link href="/register" className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Register
          </Link>
        </div>
      </footer>
    </div>
  )
}
