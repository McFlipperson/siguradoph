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
  'Patient privacy tools — consent records & audit logs',
  'Messenger support 9am–4pm',
]

const PRO_EXTRAS = [
  'Employee records & attendance tracking',
  'Payroll — SSS, PhilHealth, Pag-IBIG, 13th month & holiday pay',
  'Service Incentive Leave (SIL) tracking',
  'Incident logging & breach reporting',
  'Messenger support 9am–4pm',
]

export default function LandingPage() {
  return (
    <div
      className="min-h-screen antialiased"
      style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)', background: '#ffffff', color: '#0B1627' }}
    >

      {/* Animated flag / sheet keyframes — injected once at the top */}
      <style>{`
        @keyframes flagWave {
          0%   { d: path('M0,0 Q25,-18 50,0 Q75,18 100,0 L100,100 Q75,118 50,100 Q25,82 0,100 Z'); opacity: 0.13; }
          25%  { d: path('M0,0 Q25,20 50,0 Q75,-20 100,0 L100,100 Q75,80 50,100 Q25,120 0,100 Z'); opacity: 0.18; }
          50%  { d: path('M0,0 Q30,-22 55,5 Q80,28 100,0 L100,100 Q70,72 45,95 Q20,118 0,100 Z'); opacity: 0.14; }
          75%  { d: path('M0,0 Q20,15 50,-5 Q80,-20 100,0 L100,100 Q80,120 50,105 Q20,85 0,100 Z'); opacity: 0.17; }
          100% { d: path('M0,0 Q25,-18 50,0 Q75,18 100,0 L100,100 Q75,118 50,100 Q25,82 0,100 Z'); opacity: 0.13; }
        }
        @keyframes sheetDrift1 {
          0%, 100% { transform: translate(-5%, -8%) rotate(-6deg) scaleX(1.1); opacity: 0.10; }
          40%       { transform: translate(3%, 5%)  rotate(2deg)  scaleX(0.95); opacity: 0.18; }
          70%       { transform: translate(-2%, 2%) rotate(-3deg) scaleX(1.05); opacity: 0.13; }
        }
        @keyframes sheetDrift2 {
          0%, 100% { transform: translate(8%, 4%)  rotate(5deg)  scaleX(0.9);  opacity: 0.08; }
          35%       { transform: translate(-4%, -6%) rotate(-4deg) scaleX(1.08); opacity: 0.15; }
          65%       { transform: translate(2%, 3%)  rotate(1deg)  scaleX(1.02); opacity: 0.11; }
        }
        @keyframes sheetDrift3 {
          0%, 100% { transform: translate(0%, -12%) rotate(-2deg) scaleX(1.15); opacity: 0.07; }
          50%       { transform: translate(-6%, 8%)  rotate(6deg)  scaleX(0.88); opacity: 0.14; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════
          NAV
      ══════════════════════════════════════════════════════════ */}
      <nav
        className="flex items-center justify-between px-5 py-4"
        style={{ background: '#0038A8' }}
      >
        <div className="flex items-center gap-3">
          <Image
            src="/images/SIG final PH LOGO.png"
            alt="Sigurado"
            width={120}
            height={40}
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
      <section
        className="overflow-hidden relative"
        style={{ background: '#0038A8' }}
      >
        {/* ── Animated sheet / flag layers ─────────────────────── */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Sheet 1 — large slow billow */}
          <div style={{
            position: 'absolute',
            inset: '-20% -10%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(252,209,22,0.10) 40%, rgba(206,17,38,0.08) 70%, transparent 100%)',
            borderRadius: '38% 62% 55% 45% / 45% 35% 65% 55%',
            filter: 'blur(2px)',
            animation: 'sheetDrift1 9s ease-in-out infinite',
            willChange: 'transform, opacity',
          }} />
          {/* Sheet 2 — medium, offset phase */}
          <div style={{
            position: 'absolute',
            inset: '-15% -5%',
            background: 'linear-gradient(220deg, rgba(255,255,255,0.12) 0%, rgba(252,209,22,0.07) 50%, transparent 100%)',
            borderRadius: '55% 45% 38% 62% / 60% 40% 60% 40%',
            filter: 'blur(1px)',
            animation: 'sheetDrift2 12s ease-in-out infinite',
            willChange: 'transform, opacity',
          }} />
          {/* Sheet 3 — thin highlight edge */}
          <div style={{
            position: 'absolute',
            inset: '-25% -15%',
            background: 'linear-gradient(60deg, transparent 30%, rgba(255,255,255,0.10) 55%, rgba(206,17,38,0.06) 75%, transparent 100%)',
            borderRadius: '40% 60% 50% 50% / 50% 55% 45% 50%',
            animation: 'sheetDrift3 15s ease-in-out infinite',
            willChange: 'transform, opacity',
          }} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-0 relative">

          {/* Text side */}
          <div className="flex-1 px-5 pt-12 pb-10 sm:pb-0">
            {/* Hero logo — new logo */}
            <div className="mb-6">
              <Image
                src="/images/SIG final PH LOGO.png"
                alt="Sigurado"
                width={180}
                height={60}
                className="object-contain"
                priority
              />
            </div>
            <h1
              className="font-black leading-tight mb-5"
              style={{ fontSize: 'clamp(28px, 7vw, 54px)', color: '#ffffff', letterSpacing: '-0.025em' }}
            >
              Dental clinic software
              <br />built for the Philippines.
            </h1>
            <p className="text-base leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 400 }}>
              If you can use a smartphone, Sigurado is for you. Patient records, receipts,
              reminders, and patient privacy — no tech background needed.
            </p>
            {/* Trust line — CHANGE 3 */}
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.55)', maxWidth: 400 }}>
              No credit card. No time limit. Cancel anytime.
            </p>
            <Link
              href="/register"
              className="inline-block font-black text-base px-7 py-4 rounded-2xl"
              style={{ background: '#CE1126', color: '#ffffff' }}
            >
              Start free — no credit card needed
            </Link>
          </div>

          {/* Dashboard screenshot — right side, floats up from bottom */}
          <div className="flex justify-center sm:justify-end sm:flex-shrink-0 sm:self-end px-5 sm:px-8 pt-6 sm:pt-0">
            <div
              style={{
                width: 200,
                borderRadius: '20px 20px 0 0',
                overflow: 'hidden',
                boxShadow: '0 -6px 32px rgba(0,0,0,0.3), 0 0 0 1.5px rgba(255,255,255,0.15)',
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

        </div> {/* end relative inner wrapper */}
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
        className="flex items-center justify-center gap-4 px-5 py-5"
        style={{ background: '#0B1627' }}
      >
        <Image
          src="/images/SIG final PH LOGO.png"
          alt="Sigurado"
          width={32}
          height={32}
          className="object-contain opacity-90"
        />
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
                <Link href="/register" className="block text-center font-bold text-sm py-3.5 rounded-xl" style={{ background: '#CE1126', color: '#ffffff' }}>
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
                <Link href="/register" className="block text-center font-black text-sm py-3.5 rounded-xl" style={{ background: '#CE1126', color: '#ffffff' }}>
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
              src="/images/SIG final PH LOGO.png"
              alt="Sigurado"
              width={52}
              height={52}
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
        <div className="flex items-center gap-3">
          <Image
            src="/images/SIG final PH LOGO.png"
            alt="Sigurado"
            width={56}
            height={56}
            className="object-contain"
          />
          <span className="font-black text-xl" style={{ color: '#ffffff' }}>Sigurado</span>
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
