import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sigurado — Dental Clinic Management Built for the Philippines',
  description:
    'Run your dental clinic from your phone. Receipts, patient records, government tax requirements, and appointment reminders — handled automatically.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen antialiased" style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)', background: '#ffffff', color: '#0B1627' }}>

      {/* ════════════════════════════════════════════════════════
          NAV
      ════════════════════════════════════════════════════════ */}
      <nav className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #EEF0F5' }}>
        <Image src="/logo.png" alt="Sigurado" width={160} height={107} className="object-contain" priority />
        <Link
          href="/login"
          className="text-sm font-semibold px-5 py-2.5 rounded-xl"
          style={{ background: '#1A3FD0', color: '#ffffff' }}
        >
          Sign in
        </Link>
      </nav>

      {/* ════════════════════════════════════════════════════════
          HERO — white, clean, logo front and centre
      ════════════════════════════════════════════════════════ */}
      <section
        className="px-5 pt-12 pb-16 flex flex-col items-center text-center"
        style={{ background: '#F5F8FF' }}
      >
        {/* Big logo */}
        <Image
          src="/logo.png"
          alt="Sigurado"
          width={320}
          height={213}
          className="object-contain mb-8"
          priority
        />

        {/* Badge */}
        <span
          className="text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-5"
          style={{ background: '#E8EEFB', color: '#1A3FD0' }}
        >
          Built for Philippine Dental Clinics
        </span>

        {/* Headline */}
        <h1
          className="font-black leading-tight mb-5"
          style={{ fontSize: 'clamp(32px, 9vw, 64px)', color: '#0B1627', letterSpacing: '-0.025em', maxWidth: 560 }}
        >
          Your clinic&apos;s paperwork,{' '}
          <span style={{ color: '#1A3FD0' }}>handled.</span>
        </h1>

        <p className="text-base leading-relaxed mb-8 max-w-sm" style={{ color: '#5C6A85' }}>
          Sigurado generates official receipts, tracks patient records, and keeps you
          compliant with Philippine tax and privacy laws — automatically, from any phone.
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/register"
            className="block text-center font-bold text-base py-4 rounded-2xl"
            style={{ background: '#1A3FD0', color: '#ffffff' }}
          >
            Start for free
          </Link>
          <Link
            href="/login"
            className="block text-center font-semibold text-sm py-3.5 rounded-2xl"
            style={{ background: '#ffffff', color: '#1A3FD0', border: '1.5px solid #C7D3F0' }}
          >
            Sign in to your clinic →
          </Link>
        </div>
        <p className="mt-4 text-xs" style={{ color: '#9AAABB' }}>
          Free plan available. No credit card required.
        </p>
      </section>

      {/* ════════════════════════════════════════════════════════
          COMPLIANCE STRIP — three pills
      ════════════════════════════════════════════════════════ */}
      <section className="px-5 py-8" style={{ background: '#ffffff', borderTop: '1px solid #EEF0F5', borderBottom: '1px solid #EEF0F5' }}>
        <p className="text-xs font-semibold tracking-widest uppercase text-center mb-5" style={{ color: '#9AAABB' }}>
          Compliant with Philippine law
        </p>
        <div className="flex flex-col gap-3">
          {[
            { tag: 'RR 11-2025', label: 'Bureau of Internal Revenue e-invoicing' },
            { tag: 'RA 10173', label: 'Data Privacy Act — patient records protected' },
            { tag: 'RA 9994 / 10754', label: 'Senior Citizen & PWD discounts applied automatically' },
          ].map((item) => (
            <div
              key={item.tag}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: '#F5F8FF', border: '1px solid #E0E8F8' }}
            >
              <span
                className="shrink-0 text-xs font-black tracking-tight px-2 py-1 rounded-lg"
                style={{ background: '#1A3FD0', color: '#ffffff', fontFamily: 'var(--font-geist-mono, monospace)' }}
              >
                {item.tag}
              </span>
              <span className="text-sm font-medium" style={{ color: '#2A3A56' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          PAIN POINTS
      ════════════════════════════════════════════════════════ */}
      <section className="px-5 py-14" style={{ background: '#0B1627' }}>
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#F5C018' }}>
          Sound familiar?
        </p>
        <h2
          className="font-black leading-tight mb-9"
          style={{ fontSize: 'clamp(26px, 7vw, 44px)', color: '#ffffff', letterSpacing: '-0.02em' }}
        >
          You didn&apos;t go to dental
          <br />school to fill out forms.
        </h2>
        <div className="flex flex-col gap-4">
          {[
            'Hand-writing OR numbers on every receipt and computing the total yourself.',
            'Forgetting which patients are six months overdue for their cleaning.',
            'Digging through paper folders when a patient asks about last year\'s treatment.',
            'Not being sure if the BIR paperwork is done right — or at all.',
            'Processing payroll at the end of the day when you should be going home.',
          ].map((pain) => (
            <div
              key={pain}
              className="flex gap-3 px-4 py-4 rounded-xl text-sm leading-relaxed"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span className="shrink-0 font-bold mt-0.5" style={{ color: '#F5C018' }}>—</span>
              {pain}
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════ */}
      <section className="px-5 py-14" style={{ background: '#ffffff' }}>
        <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#1A3FD0' }}>
          How it works
        </p>
        <h2
          className="font-black leading-tight mb-10"
          style={{ fontSize: 'clamp(26px, 6vw, 40px)', color: '#0B1627', letterSpacing: '-0.02em' }}
        >
          Up and running
          <br />in three steps.
        </h2>
        <div className="flex flex-col gap-6">
          {[
            {
              n: '1',
              title: 'Register your clinic',
              body: 'Enter your clinic name, TIN, and address. Start on the free plan immediately — no credit card, no waiting.',
            },
            {
              n: '2',
              title: 'Record visits from your phone',
              body: 'Your secretary taps through a quick visit form. Diagnosis, treatment, price — done in under a minute from any phone or tablet.',
            },
            {
              n: '3',
              title: 'Official receipts appear automatically',
              body: 'Every visit generates a properly numbered, BIR-compliant official receipt. Email it, print it, or keep it on record. No spreadsheets.',
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
              <div>
                <p className="font-bold text-sm mb-1.5" style={{ color: '#0B1627' }}>{step.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#5C6A85' }}>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          PRICING — 3 columns side by side, horizontal scroll
      ════════════════════════════════════════════════════════ */}
      <section className="py-14" style={{ background: '#F5F8FF', borderTop: '1px solid #EEF0F5' }}>
        <div className="px-5 mb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#1A3FD0' }}>Pricing</p>
          <h2
            className="font-black leading-tight"
            style={{ fontSize: 'clamp(26px, 6vw, 40px)', color: '#0B1627', letterSpacing: '-0.02em' }}
          >
            Simple, honest pricing.
          </h2>
          <p className="text-sm mt-2" style={{ color: '#5C6A85' }}>Month-to-month. Cancel any time.</p>
        </div>

        {/* Side-by-side cards — scroll on small phones */}
        <div className="px-5 overflow-x-auto pb-2">
          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>

            {/* FREE */}
            <div
              className="flex flex-col rounded-2xl overflow-hidden"
              style={{ width: 240, background: '#ffffff', border: '1.5px solid #E0E8F8', flexShrink: 0 }}
            >
              <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px dashed #E0E8F8' }}>
                <p className="font-black text-lg mb-0.5" style={{ color: '#0B1627' }}>Free</p>
                <p className="text-xs mb-3" style={{ color: '#9AAABB' }}>Forever</p>
                <p className="font-black text-3xl" style={{ color: '#0B1627', fontFamily: 'var(--font-geist-mono, monospace)' }}>₱0</p>
              </div>
              <div className="px-5 pt-4 pb-5 flex flex-col gap-2.5 flex-1">
                {[
                  '1 clinic location',
                  'Unlimited patients',
                  'Unlimited visits',
                  'Official receipt generation',
                  'Patient records',
                  'Appointment scheduling',
                ].map((f) => (
                  <div key={f} className="flex gap-2 text-xs leading-snug" style={{ color: '#3A4A66' }}>
                    <span className="shrink-0 font-bold" style={{ color: '#1A3FD0' }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <Link
                  href="/register"
                  className="block text-center font-bold text-sm py-3 rounded-xl"
                  style={{ background: '#E8EEFB', color: '#1A3FD0' }}
                >
                  Get started free
                </Link>
              </div>
            </div>

            {/* BASIC */}
            <div
              className="flex flex-col rounded-2xl overflow-hidden"
              style={{ width: 240, background: '#1A3FD0', flexShrink: 0 }}
            >
              <div className="px-4 py-1.5 text-center" style={{ background: '#F5C018' }}>
                <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#0B1627' }}>Most Popular</p>
              </div>
              <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px dashed rgba(255,255,255,0.2)' }}>
                <p className="font-black text-lg mb-0.5" style={{ color: '#ffffff' }}>Basic</p>
                <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>per month</p>
                <p className="font-black text-3xl" style={{ color: '#ffffff', fontFamily: 'var(--font-geist-mono, monospace)' }}>₱999</p>
              </div>
              <div className="px-5 pt-4 pb-5 flex flex-col gap-2.5 flex-1">
                {[
                  'Everything in Free',
                  'Payroll tracking for staff',
                  'Expense recording',
                  'Loyalty card management',
                  'Patient reminders via Messenger',
                  'Quarterly financial summaries',
                  'Audit logs for data privacy',
                  'SC / PWD discount tracking',
                ].map((f) => (
                  <div key={f} className="flex gap-2 text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    <span className="shrink-0 font-bold" style={{ color: '#F5C018' }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <Link
                  href="/register"
                  className="block text-center font-black text-sm py-3 rounded-xl"
                  style={{ background: '#F5C018', color: '#0B1627' }}
                >
                  Get Basic — ₱999 / mo
                </Link>
              </div>
            </div>

            {/* PRO */}
            <div
              className="flex flex-col rounded-2xl overflow-hidden"
              style={{ width: 240, background: '#ffffff', border: '1.5px solid #E0E8F8', flexShrink: 0 }}
            >
              <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px dashed #E0E8F8' }}>
                <p className="font-black text-lg mb-0.5" style={{ color: '#0B1627' }}>Pro</p>
                <p className="text-xs mb-3" style={{ color: '#9AAABB' }}>per month</p>
                <p className="font-black text-3xl" style={{ color: '#0B1627', fontFamily: 'var(--font-geist-mono, monospace)' }}>₱1,500</p>
              </div>
              <div className="px-5 pt-4 pb-5 flex flex-col gap-2.5 flex-1">
                {[
                  'Everything in Basic',
                  'With Bookkeeping Support — a real accountant reviews your records each quarter',
                  'BIR e-invoicing transmittal',
                  'Priority support',
                ].map((f) => (
                  <div key={f} className="flex gap-2 text-xs leading-snug" style={{ color: '#3A4A66' }}>
                    <span className="shrink-0 font-bold" style={{ color: '#1A3FD0' }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5 mt-auto">
                <Link
                  href="/register"
                  className="block text-center font-bold text-sm py-3 rounded-xl"
                  style={{ background: '#0B1627', color: '#ffffff' }}
                >
                  Get Pro — ₱1,500 / mo
                </Link>
              </div>
            </div>

          </div>
        </div>

        <p className="px-5 mt-5 text-xs" style={{ color: '#9AAABB' }}>
          Prices are in Philippine Pesos (₱). Upgrade, downgrade, or cancel any time.
        </p>
      </section>

      {/* ════════════════════════════════════════════════════════
          PRIVACY CALLOUT
      ════════════════════════════════════════════════════════ */}
      <section className="px-5 py-14" style={{ background: '#ffffff', borderTop: '1px solid #EEF0F5' }}>
        <div
          className="rounded-2xl p-6"
          style={{ background: '#0B1627' }}
        >
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#F5C018' }}>
            Data privacy
          </p>
          <h2
            className="font-black leading-tight mb-4"
            style={{ fontSize: 'clamp(22px, 5vw, 34px)', color: '#ffffff', letterSpacing: '-0.02em' }}
          >
            Patient records are
            Sensitive Personal
            Information under
            Philippine law.
          </h2>
          <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Republic Act 10173 — the Data Privacy Act — requires dental clinics to protect
            patient information. Sigurado logs every access, records consent at enrollment,
            and ensures no clinic ever sees another clinic&apos;s data.
          </p>
          <div className="flex flex-col gap-2">
            {[
              'Every patient record access is logged with the user and timestamp',
              'Consent is recorded at patient enrollment',
              'Clinics are fully isolated — your data stays yours',
            ].map((point) => (
              <div key={point} className="flex gap-2 text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>
                <span style={{ color: '#F5C018' }}>—</span> {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════════════ */}
      <section
        className="px-5 py-16 flex flex-col items-center text-center"
        style={{ background: '#1A3FD0' }}
      >
        <Image
          src="/logo.png"
          alt="Sigurado"
          width={200}
          height={133}
          className="object-contain mb-7 brightness-0 invert"
        />
        <h2
          className="font-black leading-tight mb-4"
          style={{ fontSize: 'clamp(28px, 7vw, 48px)', color: '#ffffff', letterSpacing: '-0.02em', maxWidth: 420 }}
        >
          Your clinic is ready
          <br />when you are.
        </h2>
        <p className="text-sm mb-9 max-w-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Start on the free plan today. No credit card, no setup fee, no contracts.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/register"
            className="block text-center font-black text-base py-4 rounded-2xl"
            style={{ background: '#F5C018', color: '#0B1627' }}
          >
            Register your clinic — it&apos;s free
          </Link>
          <Link
            href="/login"
            className="block text-center font-semibold text-sm py-3.5 rounded-2xl"
            style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            Already registered? Sign in →
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════ */}
      <footer
        className="px-5 py-6 flex flex-col gap-1"
        style={{ background: '#060E1F', borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          © {new Date().getFullYear()} Sigurado. Built for Philippine dental clinics.
        </p>
        <div className="flex gap-5 mt-1">
          <Link href="/login" className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Sign in</Link>
          <Link href="/register" className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Register</Link>
        </div>
      </footer>
    </div>
  )
}
