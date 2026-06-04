import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import Hero from './Hero'

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
      className="min-h-screen antialiased scroll-smooth"
      style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)', background: '#ffffff', color: '#0B1627' }}
    >


      {/* ══════════════════════════════════════════════════════════
          NAV
      ══════════════════════════════════════════════════════════ */}
      {/* Nav removed — hero.png is the top of the page; its built-in
          buttons will be wired as overlay regions (same technique as auth). */}

      {/* ══════════════════════════════════════════════════════════
          SECTION 1 — HERO (real responsive component from Claude Design)
          CTAs scroll to #pricing.
      ══════════════════════════════════════════════════════════ */}
      <Hero />

      {/* ══════════════════════════════════════════════════════════
          SECTION 2 — FOUNDER / ABOUT
      ══════════════════════════════════════════════════════════ */}
      <section id="about" className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8" style={{ background: '#E8F2FF' }}>
        <div className="max-w-[1280px] mx-auto rounded-[2.2rem] overflow-hidden ring-1 ring-blue-200/60 shadow-[0_8px_60px_-16px_rgba(0,56,168,.16)]" style={{ background: '#EEF6FF' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ minHeight: 540 }}>

            {/* LEFT: Doctor photo */}
            <div className="relative overflow-hidden order-2 lg:order-1" style={{ background: '#E4F0FF', minHeight: 380 }}>
              {/* Decorative blobs */}
              <div className="absolute w-[500px] h-[500px] rounded-full -top-32 -left-32 pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(190,218,255,.75) 0%,transparent 65%)' }} />
              <div className="absolute w-[320px] h-[320px] rounded-full -bottom-12 right-0 pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(190,218,255,.55) 0%,transparent 65%)' }} />
              {/* Camera badge */}
              <div className="absolute top-5 left-5 z-10 w-9 h-9 rounded-xl flex items-center justify-center ring-1 ring-white/70 shadow-sm" style={{ background: 'rgba(255,255,255,.70)', backdropFilter: 'blur(8px)' }}>
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-[#0038A8]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="13" rx="2"/><circle cx="12" cy="13" r="3"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </div>
              {/* Decorative stars */}
              <div className="absolute top-8 right-9 text-[#1E5BE6] text-[22px] leading-none select-none pointer-events-none" style={{ fontWeight: 900 }} aria-hidden="true">✦</div>
              <div className="absolute top-20 right-24 w-3 h-3 rounded-full pointer-events-none" style={{ background: 'rgba(206,17,38,.65)' }} />
              <div className="absolute left-5 bottom-40 flex flex-col gap-2 pointer-events-none" aria-hidden="true">
                <div className="w-7 h-1.5 rounded-full" style={{ background: '#1E5BE6', opacity: .65 }} />
                <div className="w-5 h-1.5 rounded-full" style={{ background: '#1E5BE6', opacity: .40 }} />
              </div>
              {/* Doctor photo */}
              <Image
                src="/images/doc-omega.png"
                alt="Dr. Omega-Brunet, Founder of Sigurado"
                fill
                className="object-cover select-none"
                style={{ objectPosition: '50% 15%' }}
                draggable={false}
              />
              {/* Name card */}
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto z-20 bg-white rounded-2xl p-3.5 flex items-center gap-3.5 shadow-[0_10px_30px_rgba(0,56,168,.2)] ring-1 ring-blue-100/80" style={{ minWidth: 270 }}>
                <div className="shrink-0 w-[52px] h-[52px] rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1E5BE6,#0038A8)' }}>
                  <svg viewBox="0 0 28 28" className="w-[30px] h-[30px]" fill="none">
                    <ellipse cx="14" cy="10" rx="8.5" ry="6" fill="white"/>
                    <rect x="9" y="15" width="4" height="6.5" rx="2" fill="white"/>
                    <rect x="15" y="15" width="4" height="6.5" rx="2" fill="white"/>
                    <circle cx="20.5" cy="5" r="2.2" fill="#FCD116"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-[#0B1B3F] text-[14.5px] leading-tight">Dr. Omega-Brunet</div>
                  <div className="font-semibold text-[13px] mt-0.5" style={{ color: '#1E5BE6' }}>Founder &amp; Dentist</div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <svg viewBox="0 0 30 20" className="w-[22px] h-[14px] rounded-sm overflow-hidden ring-1 ring-black/10 shrink-0" fill="none">
                      <rect width="30" height="10" fill="#0038A8"/>
                      <rect y="10" width="30" height="10" fill="#CE1126"/>
                      <polygon points="0,0 14,10 0,20" fill="white"/>
                      <circle cx="4.5" cy="10" r="2.2" fill="#FCD116"/>
                    </svg>
                    <span className="text-[11.5px] font-semibold text-[#0B1B3F]/60 whitespace-nowrap">Proudly Filipino</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Text + feature cards + banner */}
            <div className="order-1 lg:order-2 flex flex-col p-7 sm:p-9 lg:p-10 xl:p-11 gap-5">
              {/* Decorative dots */}
              <div className="flex gap-2 self-end -mt-1 mb-1" aria-hidden="true">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(30,91,230,.45)' }} />
                <div className="w-2 h-2 rounded-full mt-0.5" style={{ background: 'rgba(30,91,230,.25)' }} />
                <div className="w-3 h-3 rounded-full -mt-0.5" style={{ background: 'rgba(206,17,38,.50)' }} />
              </div>
              <Image src="/images/hero-logo.png" alt="Sigurado" width={180} height={44} className="h-[40px] sm:h-[44px] w-auto object-contain self-start -ml-1 -mt-3" draggable={false} />
              {/* Headline */}
              <div className="relative">
                <h2 className="font-extrabold tracking-tight leading-[1.07]" style={{ fontSize: 'clamp(1.75rem,3vw,2.65rem)' }}>
                  <span className="text-[#0B1B3F]">Built by a Filipino dentist</span><br/>
                  <span style={{ color: '#1E5BE6' }}>for Filipino dentists.</span>
                  <span className="ml-1.5 text-[#CE1126]" style={{ fontWeight: 400, fontSize: '.8em', lineHeight: 1 }}>♡</span>
                </h2>
                <div className="mt-2.5 h-[3.5px] w-[56%] rounded-full" style={{ background: 'linear-gradient(90deg,#1E5BE6,#93C5FD)' }} />
              </div>
              <p className="text-[15px] sm:text-[15.5px] leading-[1.72] max-w-[34rem] font-medium" style={{ color: 'rgba(11,27,63,.62)' }}>
                Sigurado was created by Dr. Omega-Brunet — a practicing dentist who{' '}
                <span className="font-semibold underline decoration-dotted underline-offset-[3px]" style={{ color: '#0B1B3F', textDecorationColor: '#1E5BE6' }}>understands</span>
                {' '}the real challenges of running a clinic in the Philippines.
              </p>
              {/* Feature cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { grad: 'linear-gradient(135deg,#60A5FA,#2563EB)', icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><rect x="2" y="2" width="20" height="14" rx="5" fill="white" opacity=".95"/><polygon points="2,16 8,20 8,16" fill="white" opacity=".95"/><circle cx="8" cy="9" r="1.6" fill="#2563EB"/><circle cx="12" cy="9" r="1.6" fill="#2563EB"/><circle cx="16" cy="9" r="1.6" fill="#2563EB"/></svg>, label: 'Built from real clinic experience' },
                  { grad: 'linear-gradient(135deg,#4ADE80,#16A34A)', icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><rect x="5" y="5" width="14" height="16" rx="2" fill="white" opacity=".95"/><rect x="9" y="3" width="6" height="4" rx="1.5" fill="white" opacity=".9"/><path d="M8 11 L10.5 13.5 L16 8" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 15.5 L10.5 18 L16 12.5" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: 'Designed for local workflows & regulations' },
                  { grad: 'linear-gradient(135deg,#FDE68A,#F59E0B)', icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><path d="M12 2 L20 6 L20 13.5 C20 17.8 16.5 21 12 22.5 C7.5 21 4 17.8 4 13.5 L4 6 Z" fill="white" opacity=".95"/><rect x="9.5" y="12" width="5" height="5" rx="1.5" fill="#F59E0B"/><path d="M10.5 12 L10.5 10.5 C10.5 9.4 11.2 8.5 12 8.5 C12.8 8.5 13.5 9.4 13.5 10.5 L13.5 12" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" fill="none"/></svg>, label: 'Secure & compliant with PH data privacy laws' },
                  { grad: 'linear-gradient(135deg,#FCA5A5,#EF4444)', icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white"><path d="M12 20.5 C12 20.5 3 14 3 8.5 C3 5.9 5.2 4 8 4 C9.8 4 11.2 4.9 12 6.1 C12.8 4.9 14.2 4 16 4 C18.8 4 21 5.9 21 8.5 C21 14 12 20.5 12 20.5 Z"/></svg>, label: 'Made to help you focus on your patients' },
                ].map(({ grad, icon, label }) => (
                  <div key={label} className="bg-white rounded-2xl p-3.5 flex flex-col items-center text-center gap-2.5 shadow-sm ring-1 ring-blue-100/80">
                    <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center" style={{ background: grad }}>{icon}</div>
                    <p className="text-[12px] sm:text-[12.5px] font-semibold text-[#0B1B3F] leading-tight">{label}</p>
                  </div>
                ))}
              </div>
              {/* Blue benefits banner */}
              <div className="rounded-2xl overflow-hidden grid grid-cols-2 sm:grid-cols-4 mt-auto" style={{ background: 'linear-gradient(110deg,#0038A8 0%,#1353CE 55%,#1E5BE6 100%)' }}>
                {[
                  { icon: <svg viewBox="0 0 24 24" className="w-[14px] h-[14px]" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, title: 'Automatic daily backups', sub: 'Your data is safe. Always.' },
                  { icon: <svg viewBox="0 0 24 24" className="w-[14px] h-[14px]" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 8 L12 12 L15 14"/></svg>, title: 'Save 5+ hours a week', sub: 'Less admin, more time for patients.' },
                  { icon: <svg viewBox="0 0 24 24" className="w-[14px] h-[14px]" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8 L16 8 M8 12 L16 12 M8 16 L12 16"/></svg>, title: 'Clear reports that matter', sub: 'See your clinic grow with confidence.' },
                  { icon: <svg viewBox="0 0 24 24" className="w-[14px] h-[14px]" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="3.5"/><path d="M4 20 C4 16.7 7.6 14 12 14 C16.4 14 20 16.7 20 20"/></svg>, title: 'Real human support', sub: "We're here when you need us." },
                ].map(({ icon, title, sub }, i) => (
                  <div key={title} className={`flex flex-col gap-2 p-4 sm:p-[18px]${i < 3 ? ' border-r border-white/10' : ''}`}>
                    <div className="relative w-8 h-8 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">{icon}</div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-[15px] h-[15px] rounded-full bg-emerald-400 flex items-center justify-center" style={{ outline: '1.5px solid #1353CE' }}>
                        <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5"><path d="M2 5.2L3.8 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </div>
                    <div className="text-[12.5px] font-bold text-white leading-tight">{title}</div>
                    <div className="text-[11px] text-white/60 leading-snug">{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════
          SECTION 3 — GET STARTED / STEPS
      ══════════════════════════════════════════════════════════ */}
      <section id="get-started" className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8" style={{ background: '#E8F2FF' }}>
        <div className="max-w-[1280px] mx-auto rounded-[2.2rem] overflow-visible ring-1 ring-blue-200/60 shadow-[0_8px_60px_-16px_rgba(0,56,168,.14)]" style={{ background: '#ffffff' }}>

          {/* Header row */}
          <div className="relative px-7 sm:px-9 lg:px-10 pt-8 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-visible rounded-t-[2.2rem]" style={{ background: 'linear-gradient(120deg,#ffffff 35%,#C8E4F8 100%)' }}>
            {/* Left: Headline */}
            <div className="flex flex-col justify-center gap-3 z-10">
              <div className="flex items-center gap-3 mb-1" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0" fill="#FCD116"><path d="M12 2 L13.5 9 L20 8 L14.5 12 L18 19 L12 15 L6 19 L9.5 12 L4 8 L10.5 9 Z"/></svg>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#4ADE80' }} />
                <div className="text-[#1E5BE6] font-black text-xl leading-none">+</div>
              </div>
              <h2 className="font-extrabold tracking-tight leading-[1.07]" style={{ fontSize: 'clamp(2rem,4vw,3.2rem)' }}>
                <span className="text-[#0B1B3F]">Register and<br/>you&apos;re </span><span style={{ color: '#1E5BE6' }}>ready to go.</span>
              </h2>
              <div className="h-[3.5px] w-[62%] rounded-full" style={{ background: 'linear-gradient(90deg,#1E5BE6,#93C5FD)' }} />
              <div className="flex gap-1 mt-1" aria-hidden="true">
                <div className="w-5 h-1 rounded-full" style={{ background: '#FCD116', opacity: .8 }} />
                <div className="w-3 h-1 rounded-full" style={{ background: '#FCD116', opacity: .5 }} />
              </div>
            </div>
            {/* Right: Mascot image */}
            <div className="relative flex justify-end items-end -mt-4 lg:-mt-20 overflow-visible">
              <Image
                src="/images/section3-couple.png"
                alt="Sigurado mascots"
                width={400}
                height={360}
                className="object-contain select-none w-[280px] sm:w-[340px] lg:w-[380px] xl:w-[400px]"
                draggable={false}
                style={{ WebkitMaskImage: 'linear-gradient(to right,transparent 0%,black 28%,black 85%,transparent 100%),linear-gradient(to bottom,black 70%,transparent 100%)', WebkitMaskComposite: 'source-in', maskImage: 'linear-gradient(to right,transparent 0%,black 28%,black 85%,transparent 100%),linear-gradient(to bottom,black 70%,transparent 100%)', maskComposite: 'intersect' }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="px-4 sm:px-6 lg:px-8 pb-4 flex flex-col gap-3">
            {/* Step 1 */}
            <div className="rounded-2xl flex items-center gap-4 sm:gap-5 px-5 sm:px-6 py-5 ring-1 ring-blue-100/60 bg-white">
              <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-white text-lg" style={{ background: '#0038A8' }}>1</div>
              <div className="shrink-0 w-[56px] h-[56px] rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#EEF5FF,#DBEAFE)' }}>
                <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
                  <rect x="6" y="5" width="20" height="24" rx="3" fill="#DBEAFE"/><rect x="11" y="3" width="10" height="5" rx="2" fill="#93C5FD"/>
                  <path d="M11 14 L13.5 16.5 L20 10" stroke="#1E5BE6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11 20 L13.5 22.5 L20 16" stroke="#1E5BE6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#0B1B3F] text-[16px] sm:text-[17px]">Create your clinic account — <span className="font-medium text-[#0B1B3F]/70">takes less than 5 minutes.</span></p>
              </div>
              <div className="hidden sm:flex shrink-0 items-center justify-center w-[72px] h-[72px]" aria-hidden="true">
                <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none">
                  <circle cx="28" cy="34" r="18" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="2"/>
                  <circle cx="28" cy="34" r="14" fill="white" stroke="#60A5FA" strokeWidth="1.5"/>
                  <path d="M28 24 L28 34 L34 38" stroke="#1E5BE6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M42 22 L48 18 M44 26 L50 24 M44 30 L50 32" stroke="#FCD116" strokeWidth="2" strokeLinecap="round" opacity=".85"/>
                  <circle cx="28" cy="34" r="2" fill="#0038A8"/>
                </svg>
              </div>
            </div>
            {/* Step 2 */}
            <div className="rounded-2xl flex items-center gap-4 sm:gap-5 px-5 sm:px-6 py-5 ring-1 ring-green-100/60" style={{ background: '#F3FFF6' }}>
              <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-white text-lg" style={{ background: '#0038A8' }}>2</div>
              <div className="shrink-0 w-[56px] h-[56px] rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#ECFDF5,#D1FAE5)' }}>
                <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
                  <circle cx="10" cy="11" r="5" fill="#3B82F6"/><circle cx="20" cy="9" r="5" fill="#22C55E"/><circle cx="28" cy="13" r="4" fill="#F59E0B"/>
                  <path d="M3 26 C3 21 6.5 18 10 18 C11.8 18 13.4 18.8 14.5 20" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  <path d="M8 26 C8 21 12 18 17 18 C22 18 26 21 26 26" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#0B1B3F] text-[16px] sm:text-[17px]">Add your patients, services, and staff. <span className="font-medium text-[#0B1B3F]/70">We guide you through every step.</span></p>
              </div>
              <div className="hidden sm:flex shrink-0 items-center justify-center w-[72px] h-[72px]" aria-hidden="true">
                <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none">
                  <circle cx="20" cy="28" r="7" fill="#4ADE80"/><circle cx="32" cy="26" r="7" fill="#22C55E"/><circle cx="44" cy="28" r="7" fill="#86EFAC"/>
                  <path d="M8 50 C8 43 13 39 20 39 C24 39 27.5 40.5 30 43" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  <path d="M16 50 C16 43 23 39 32 39 C41 39 48 43 48 50" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  <path d="M32 18 C32 18 28 14.5 28 12 C28 10 29.7 8.5 31 9.5 C32 8.5 34 8.5 35 10.5 C36 12.5 32 18 32 18Z" fill="#EF4444" opacity=".9"/>
                </svg>
              </div>
            </div>
            {/* Step 3 */}
            <div className="rounded-2xl flex items-center gap-4 sm:gap-5 px-5 sm:px-6 py-5 ring-1 ring-amber-100/60" style={{ background: '#FFFBF0' }}>
              <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-white text-lg" style={{ background: '#0038A8' }}>3</div>
              <div className="shrink-0 w-[56px] h-[56px] rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#FFFBF0,#FEF3C7)' }}>
                <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
                  <path d="M5 12 L5 28 C5 29.1 5.9 30 7 30 L25 30 C26.1 30 27 29.1 27 28 L27 12 Z" fill="#3B82F6"/>
                  <path d="M5 12 L10 6 L22 6 L27 12 Z" fill="#1D4ED8"/>
                  <circle cx="20" cy="22" r="6" fill="#22C55E"/>
                  <path d="M17 22 L19 24 L23 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#0B1B3F] text-[16px] sm:text-[17px]">Start seeing patients. <span className="font-medium text-[#0B1B3F]/70">Sigurado handles the records, receipts, and reports.</span></p>
              </div>
              <div className="hidden sm:flex shrink-0 items-center justify-center w-[72px] h-[72px]" aria-hidden="true">
                <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none">
                  <rect x="8" y="42" width="10" height="14" rx="3" fill="#FCD116"/><rect x="22" y="32" width="10" height="24" rx="3" fill="#F59E0B"/>
                  <rect x="36" y="24" width="10" height="32" rx="3" fill="#FCD116"/><rect x="50" y="18" width="10" height="38" rx="3" fill="#F59E0B"/>
                  <path d="M4 56 L60 56" stroke="#E5E7EB" strokeWidth="1.5"/>
                </svg>
              </div>
            </div>
          </div>

          {/* CTA Bar — Messenger */}
          <div className="mx-4 sm:mx-6 lg:mx-8 mb-4 sm:mb-6 rounded-2xl flex items-center gap-4 px-5 sm:px-7 py-5" style={{ background: 'linear-gradient(100deg,#0038A8 0%,#1353CE 60%,#1E5BE6 100%)' }}>
            <div className="shrink-0 w-12 h-12 rounded-full bg-white/15 flex items-center justify-center ring-2 ring-white/20">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-[16px] sm:text-[17px] leading-tight">Questions? We&apos;re on Messenger.</div>
              <div className="text-[13px] text-white/65 mt-0.5">9am–4pm — real support, real people. You&apos;re not alone.</div>
            </div>
            <a href="https://m.me/sigurado" target="_blank" rel="noopener noreferrer" className="shrink-0 w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#0038A8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
            </a>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════
          SECTION 4 — PRICING
      ══════════════════════════════════════════════════════════ */}
      <section id="pricing" className="scroll-mt-4 py-10 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8" style={{ background: '#E8F2FF' }}>
        <div className="max-w-[1280px] mx-auto flex flex-col gap-6">

          {/* Founding Member Banner */}
          <div className="relative rounded-2xl overflow-hidden px-6 sm:px-8 py-5 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4" style={{ background: 'linear-gradient(105deg,#E8A000 0%,#FCD116 45%,#FFE055 100%)', boxShadow: '0 8px 32px -8px rgba(200,130,0,.55)' }}>
            <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'radial-gradient(circle,#000 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
            <div className="shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl shadow-md" style={{ background: 'rgba(0,0,0,.15)' }}>
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1.5" fill="white" stroke="none"/></svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="whitespace-nowrap text-[11px] font-black uppercase tracking-[.12em] px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,.18)', color: '#fff' }}>First 100 Clinics Only</span>
              </div>
              <div className="font-extrabold text-[18px] sm:text-[20px] leading-tight" style={{ color: '#0B1B3F' }}>Founding member pricing — locked in forever.</div>
              <div className="text-[13.5px] mt-1 font-semibold" style={{ color: 'rgba(11,27,63,.70)' }}>Price will <span style={{ textDecoration: 'underline', textDecorationStyle: 'dotted' }}>never</span> increase as long as your subscription is active.</div>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-1.5 text-center" style={{ minWidth: 120 }}>
              <div className="font-extrabold text-[28px] leading-none" style={{ color: '#0B1B3F' }}>100</div>
              <div className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wide" style={{ color: 'rgba(11,27,63,.65)' }}>clinic spots</div>
              <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,.15)' }}>
                <div className="h-full rounded-full" style={{ width: '38%', background: '#0038A8', opacity: .8 }} />
              </div>
              <div className="whitespace-nowrap text-[10.5px] font-semibold" style={{ color: 'rgba(11,27,63,.60)' }}>Filling up fast</div>
            </div>
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-4 lg:gap-5 items-start">

            {/* FREE */}
            <div className="bg-white rounded-2xl p-7 flex flex-col gap-5 ring-1 ring-blue-100/80 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#EEF5FF' }}>
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#0038A8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
                </div>
                <div>
                  <div className="font-extrabold text-[#0B1B3F] text-[22px] leading-none">Free</div>
                  <div className="text-[13px] text-[#0B1B3F]/55 font-medium mt-0.5">For clinics just getting started.</div>
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-0.5">
                  <span className="font-extrabold text-[#0B1B3F] text-[42px] leading-none">₱0</span>
                </div>
                <div className="text-[13px] text-[#0B1B3F]/50 font-medium mt-1.5">No credit card. No time limit.<br/>Up to 30 patients.</div>
              </div>
              <div className="h-px bg-blue-100/60" />
              <ul className="flex flex-col gap-2.5 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-[#0B1B3F]/75 font-medium">
                    <svg viewBox="0 0 16 16" className="w-4 h-4 mt-0.5 shrink-0 text-[#0038A8]" fill="currentColor"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.6 9.8L4.6 8l1-1 1.8 1.8 3.6-3.6 1 1Z"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center rounded-xl py-3.5 text-[15px] font-bold text-[#0038A8] ring-2 ring-[#0038A8] hover:bg-[#0038A8] hover:text-white transition-colors">Start for free</Link>
            </div>

            {/* BASIC */}
            <div className="bg-white rounded-2xl p-7 flex flex-col gap-5 ring-2 ring-[#0038A8]/30 shadow-[0_4px_24px_rgba(0,56,168,.1)]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#EEF5FF' }}>
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#0038A8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="10" width="18" height="11" rx="2"/><path d="M3 10l9-7 9 7"/><rect x="9" y="14" width="6" height="7" rx="1"/></svg>
                </div>
                <div>
                  <div className="font-extrabold text-[#0B1B3F] text-[22px] leading-none">Basic</div>
                  <div className="text-[13px] text-[#0B1B3F]/55 font-medium mt-0.5">Everything your clinic needs to run smoothly.</div>
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="font-extrabold text-[#0B1B3F] text-[42px] leading-none">₱499</span>
                  <span className="text-[14px] font-semibold text-[#0B1B3F]/50">/month</span>
                </div>
              </div>
              <div className="h-px bg-blue-100/60" />
              <ul className="flex flex-col gap-2.5 flex-1">
                {BASIC_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-[#0B1B3F]/75 font-medium">
                    <svg viewBox="0 0 16 16" className="w-4 h-4 mt-0.5 shrink-0 text-[#0038A8]" fill="currentColor"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.6 9.8L4.6 8l1-1 1.8 1.8 3.6-3.6 1 1Z"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=basic" className="block text-center rounded-xl py-3.5 text-[15px] font-bold text-white" style={{ background: '#0038A8' }}>Get Basic</Link>
            </div>

            {/* PRO — Most Popular */}
            <div className="rounded-2xl flex flex-col overflow-hidden shadow-[0_12px_48px_rgba(0,56,168,.35)] ring-2 ring-[#0038A8]/40" style={{ background: 'linear-gradient(160deg,#1E5BE6 0%,#0038A8 60%,#002880 100%)' }}>
              <div className="flex items-center justify-center gap-2 py-3 font-bold text-[12.5px] uppercase tracking-[.1em]" style={{ background: '#FCD116', color: '#0B1B3F' }}>
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="#0B1B3F"><path d="M8 1l1.8 3.6L14 5.6l-3 2.9.7 4.1L8 10.5l-3.7 2.1.7-4.1-3-2.9 4.2-.6z"/></svg>
                Most Popular
              </div>
              <div className="p-7 flex flex-col gap-5 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.15)' }}>
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="7" r="3"/><circle cx="16" cy="8" r="2.5"/><path d="M2 20c0-3.3 3.1-6 7-6"/><path d="M10 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>
                  </div>
                  <div>
                    <div className="font-extrabold text-white text-[22px] leading-none">Pro</div>
                    <div className="text-[13px] font-medium mt-0.5" style={{ color: 'rgba(255,255,255,.65)' }}>For clinics with staff.</div>
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-extrabold text-white text-[42px] leading-none">₱999</span>
                    <span className="text-[14px] font-semibold" style={{ color: 'rgba(255,255,255,.55)' }}>/month</span>
                  </div>
                </div>
                <div className="h-px" style={{ background: 'rgba(255,255,255,.15)' }} />
                <div>
                  <div className="text-[13px] font-bold text-white mb-3 uppercase tracking-wide opacity-80">Everything in Basic, plus:</div>
                  <ul className="flex flex-col gap-2.5">
                    {PRO_EXTRAS.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13.5px] font-medium" style={{ color: 'rgba(255,255,255,.85)' }}>
                        <svg viewBox="0 0 16 16" className="w-4 h-4 mt-0.5 shrink-0" fill="white"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.6 9.8L4.6 8l1-1 1.8 1.8 3.6-3.6 1 1Z"/></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href="/register?plan=pro" className="block text-center rounded-xl py-3.5 text-[15px] font-bold bg-white hover:bg-blue-50 transition-colors" style={{ color: '#0038A8' }}>Get Pro</Link>
              </div>
            </div>
          </div>

          {/* Trust bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" stroke="#0038A8" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title: 'Cancel anytime', sub: 'No lock-in contract' },
              { icon: <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>, title: 'Setup in less than 5 minutes', sub: 'Get started right away' },
              { icon: <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none" stroke="#0038A8" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title: 'RA 10173 Compliant', sub: 'Your data is secure' },
            ].map(({ icon, title, sub }) => (
              <div key={title} className="bg-white rounded-xl px-5 py-4 flex items-center gap-3.5 ring-1 ring-blue-100/60 shadow-sm">
                {icon}
                <div>
                  <div className="text-[13.5px] font-bold text-[#0B1B3F]">{title}</div>
                  <div className="text-[12px] font-medium text-[#0B1B3F]/50">{sub}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 5 — PRIVACY CALLOUT
      ══════════════════════════════════════════════════════════ */}
      <section>
        <Image
          src="/images/section5.png"
          alt="Patient privacy — Sigurado keeps your records protected"
          width={1536}
          height={1024}
          className="w-full h-auto block"
        />
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 5B — PAPERWORK HOURS
      ══════════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8" style={{ background: '#E8F2FF' }}>
        <div className="max-w-[1280px] mx-auto relative rounded-[2.2rem] overflow-hidden bg-white ring-1 ring-blue-200/60 shadow-[0_8px_60px_-16px_rgba(0,56,168,.16)] px-6 sm:px-12 lg:px-20 py-10 sm:py-14 flex flex-col items-center text-center">

          {/* Decorative sparkles */}
          <div className="absolute top-8 left-12 text-[#1E5BE6] text-[18px] pointer-events-none select-none" aria-hidden="true">✦</div>
          <div className="absolute top-12 left-[15%] w-[6px] h-[6px] rounded-full pointer-events-none" style={{ background: '#1E5BE6', opacity: .35 }} />
          <div className="absolute top-6 right-14 text-[#FCD116] text-[22px] pointer-events-none select-none" aria-hidden="true">✦</div>
          <div className="absolute top-16 right-[12%] text-[#1E5BE6] text-[14px] pointer-events-none select-none" aria-hidden="true">✦</div>

          {/* Left 3D illustration */}
          <Image
            src="/images/plant.png"
            alt=""
            width={220}
            height={260}
            aria-hidden
            draggable={false}
            className="absolute bottom-0 left-0 w-[140px] sm:w-[180px] lg:w-[220px] h-auto object-contain select-none pointer-events-none"
          />

          {/* Right 3D illustration */}
          <Image
            src="/images/tools.png"
            alt=""
            width={220}
            height={260}
            aria-hidden
            draggable={false}
            className="absolute bottom-0 right-0 w-[140px] sm:w-[180px] lg:w-[220px] h-auto object-contain select-none pointer-events-none"
          />

          {/* Clock icon */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 ring-1 ring-blue-100" style={{ background: '#EEF6FF' }}>
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="#1E5BE6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 7v5l3 2"/>
            </svg>
          </div>

          {/* Headline */}
          <h2 className="font-extrabold tracking-tight leading-[1.07] max-w-[680px]" style={{ fontSize: 'clamp(1.9rem,4.5vw,3.2rem)', color: '#0B1B3F' }}>
            How many hours did paperwork{' '}
            <span style={{ color: '#1E5BE6' }}>steal</span> this month?
          </h2>

          {/* Icon flow */}
          <div className="mt-8 mb-2 flex flex-wrap items-center justify-center gap-x-1 gap-y-4">
            {[
              { label: 'Appointments', icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#1E5BE6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M8 18h.01M12 18h.01"/></svg> },
              { label: 'Receipts', icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#1E5BE6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/><path d="M8 7h.01"/></svg> },
              { label: 'Reports', icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#1E5BE6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 17v-4M12 17v-8M16 17v-6"/></svg> },
              { label: 'Records', icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#1E5BE6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/><path d="M8 10h8M8 14h5"/></svg> },
              { label: 'Follow-ups', icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#1E5BE6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
            ].map(({ label, icon }, i) => (
              <div key={label} className="flex items-center gap-1">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-blue-100" style={{ background: '#EEF6FF' }}>
                    {icon}
                  </div>
                  <span className="text-[11.5px] font-semibold text-[#0B1B3F]/70 whitespace-nowrap">{label}</span>
                </div>
                {i < 4 && (
                  <div className="flex items-center mb-4 mx-1">
                    <svg viewBox="0 0 40 8" className="w-8 h-2" fill="none">
                      <line x1="0" y1="4" x2="40" y2="4" stroke="#93C5FD" strokeWidth="2" strokeDasharray="4 3"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
            {/* Arrow + Sigurado */}
            <div className="flex items-center gap-2 mb-4 ml-1">
              <svg viewBox="0 0 32 16" className="w-7 h-4" fill="none">
                <path d="M2 8 C8 8 16 4 28 8" stroke="#1E5BE6" strokeWidth="2" strokeLinecap="round" fill="none"/>
                <path d="M24 4l6 4-6 4" stroke="#1E5BE6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <div className="flex flex-col items-center gap-1.5 mb-4">
              <div className="w-[68px] h-[68px] rounded-2xl flex items-center justify-center shadow-md ring-1 ring-blue-200" style={{ background: '#ffffff' }}>
                <Image src="/images/s-logo-ph.png" alt="Sigurado" width={44} height={44} className="w-[44px] h-[44px] object-contain" />
              </div>
              <span className="text-[12px] font-bold text-[#0B1B3F]">Sigurado</span>
            </div>
          </div>

          {/* Subtext */}
          <p className="mt-4 text-[15px] sm:text-[16px] leading-relaxed font-medium max-w-[480px]" style={{ color: 'rgba(11,27,63,.60)' }}>
            The small tasks that take a few minutes each day can quietly become{' '}
            <span className="font-bold" style={{ color: '#1E5BE6' }}>dozens of hours</span> every month.
          </p>

          {/* CTA Button */}
          <Link
            href="/register"
            className="mt-8 inline-flex items-center justify-center gap-3 rounded-2xl px-8 py-4 text-[17px] font-bold text-white transition-transform hover:-translate-y-0.5"
            style={{ background: '#1E5BE6', boxShadow: '0 14px 30px -10px rgba(30,91,230,.55)' }}
          >
            See How Simple It Is
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
          </Link>

          {/* Trust badges */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] font-semibold" style={{ color: 'rgba(11,27,63,.55)' }}>
            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-[#1E5BE6]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Free forever up to 50 patients
            </span>
            <span className="text-[#1E5BE6] opacity-40">·</span>
            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-[#1E5BE6]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
              No credit card required
            </span>
          </div>

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
