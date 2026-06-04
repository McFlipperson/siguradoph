'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus_Jakarta_Sans } from 'next/font/google'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export default function Hero() {
  // Count-up KPIs (respects prefers-reduced-motion)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fmt = (n: number, comma: boolean) => (comma ? n.toLocaleString('en-US') : String(n))

    function countUp(el: Element) {
      const target = parseInt(el.getAttribute('data-target') || '0', 10)
      const comma = el.getAttribute('data-format') === 'comma'
      if (reduce) { el.textContent = fmt(target, comma); return }
      const dur = 1500
      let start: number | null = null
      function step(ts: number) {
        if (start === null) start = ts
        const p = Math.min((ts - start) / dur, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        el.textContent = fmt(Math.round(target * eased), comma)
        if (p < 1) requestAnimationFrame(step)
        else el.textContent = fmt(target, comma)
      }
      requestAnimationFrame(step)
    }

    const timers: ReturnType<typeof setTimeout>[] = []
    document.querySelectorAll('.sg-hero .countup').forEach((el, i) => {
      timers.push(setTimeout(() => countUp(el), 700 + i * 150))
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <section className={`sg-hero ${jakarta.className} relative w-full min-h-[100svh] overflow-hidden`}>
      <style>{heroCss}</style>

      {/* Full-bleed clinic photo */}
      <Image
        src="/images/hero-clinic-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* Soft light overlays for text contrast */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-white/20" />
      <div
        className="absolute inset-0 z-[1] pointer-events-none hidden lg:block"
        style={{ background: 'linear-gradient(100deg, rgba(255,254,251,.88) 0%, rgba(255,254,251,.72) 30%, rgba(255,254,251,.22) 52%, rgba(255,254,251,0) 65%)' }}
      />
      <div
        className="absolute inset-x-0 top-0 h-32 z-[1] pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(253,251,247,.55), rgba(253,251,247,0))' }}
      />

      {/* Nav bar */}
      <div className="absolute top-0 inset-x-0 z-[3] flex items-center justify-between px-6 sm:px-8 lg:px-12 py-5">
        <Image src="/images/hero-logo.png" alt="Sigurado" width={120} height={36} className="h-8 w-auto object-contain" priority draggable={false} />
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 rounded-xl text-[13.5px] font-semibold text-[#0B1B3F]/80 hover:text-[#0B1B3F] transition-colors glass ring-1 ring-black/8"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center px-4 py-2 rounded-xl text-[13.5px] font-bold text-white transition-transform hover:-translate-y-0.5"
            style={{ background: '#0038A8', boxShadow: '0 6px 18px -6px rgba(0,56,168,.55)' }}
          >
            Register Free
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-[2] mx-auto w-full max-w-[1280px] px-6 sm:px-8 lg:px-12 py-10 sm:py-12 lg:py-0 min-h-[100svh] flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">

          {/* LEFT */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-start text-left order-1">

            {/* Logo — hidden on mobile (nav bar covers it); visible lg+ */}
            <Image
              src="/images/hero-logo.png"
              alt="Sigurado"
              width={1166}
              height={348}
              priority
              className="reveal d1 hidden lg:block h-[52px] sm:h-[58px] w-auto -ml-1 select-none"
              draggable={false}
            />

            {/* Badge */}
            <div className="reveal d2 mt-6 inline-flex items-center gap-2.5 rounded-full glass pl-1.5 pr-4 py-1.5 ring-1 ring-black/5 shadow-sm">
              <span className="grid place-items-center w-6 h-6 rounded-full overflow-hidden ring-1 ring-black/10 shrink-0" aria-hidden="true">
                <svg viewBox="0 0 24 16" className="w-full h-full">
                  <rect width="24" height="8" fill="#0038A8" />
                  <rect y="8" width="24" height="8" fill="#CE1126" />
                  <polygon points="0,0 11,8 0,16" fill="#fff" />
                  <circle cx="3.2" cy="8" r="1.5" fill="#FCD116" />
                </svg>
              </span>
              <span className="whitespace-nowrap text-[13px] sm:text-sm font-semibold text-[#0B1B3F]/90 tracking-tight">Built for Filipino Dental Clinics</span>
            </div>

            {/* Headline */}
            <h1 className="reveal d3 mt-6 font-extrabold tracking-[-0.03em] leading-[1.02] text-[clamp(2.4rem,6.2vw,4.05rem)]">
              <span className="text-[#0B1B3F]">Spend less time on paperwork.</span>
              <span className="block relative w-fit text-[#1E5BE6] mt-1">
                More time with patients.
                <svg className="absolute -bottom-2 left-0 w-[102%] h-4" viewBox="0 0 320 18" fill="none" preserveAspectRatio="none" aria-hidden="true">
                  <path className="draw-underline" d="M3 13 C 80 4, 240 4, 317 11" stroke="#1E5BE6" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            {/* Subtext */}
            <p className="reveal d4 mt-7 max-w-[34rem] text-[clamp(1.02rem,1.6vw,1.2rem)] leading-relaxed text-[#0B1B3F]/65 font-medium">
              Appointments, records, receipts, treatment plans, and reports — all in one simple system.
            </p>

            {/* Buttons → scroll to pricing */}
            <div className="reveal d5 mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
              <a href="#pricing" className="btn btn-primary group inline-flex items-center justify-center gap-3 rounded-2xl bg-[#0038A8] px-7 py-4 text-white">
                <svg className="w-5 h-5 -ml-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                <span className="flex flex-col items-start leading-tight whitespace-nowrap">
                  <span className="text-[1.05rem] font-bold">Start Free</span>
                  <span className="text-[11px] font-medium text-white/70">No credit card required</span>
                </span>
                <svg className="arrow w-5 h-5 ml-1 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
              </a>
              <a href="#get-started" className="btn btn-outline group inline-flex items-center justify-center gap-3 rounded-2xl glass px-6 py-4 ring-1 ring-[#0B1B3F]/12 text-[#0B1B3F]">
                <span className="play-ring grid place-items-center w-9 h-9 rounded-full bg-[#0038A8] text-white shrink-0">
                  <svg className="w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </span>
                <span className="whitespace-nowrap text-[1.02rem] font-bold">See how it works</span>
              </a>
            </div>

            {/* Trust line */}
            <div className="reveal d6 mt-8 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-3.5 gap-y-2.5 text-[13px] sm:text-sm font-semibold text-[#0B1B3F]/75">
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                <svg className="w-[18px] h-[18px] text-[#0038A8] shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.1 14.2-3.6-3.6 1.4-1.4 2.2 2.2 4.9-4.9 1.4 1.4-6.3 6.3Z" /></svg>
                <span>Free forever for up to <span className="text-[#0038A8] font-bold">30 patients</span></span>
              </span>
              <span className="hidden sm:inline text-[#0B1B3F]/25">·</span>
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                <svg className="w-[17px] h-[17px] text-[#FCD116] shrink-0" viewBox="0 0 24 24" fill="currentColor" stroke="#E0A800" strokeWidth="0.5"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></svg>
                <span>Setup in under <span className="text-[#0038A8] font-bold">5 minutes</span></span>
              </span>
            </div>
          </div>

          {/* RIGHT: device */}
          <div className="lg:col-span-6 xl:col-span-7 order-2 flex justify-center lg:justify-end">
            <div className="reveal-device relative w-full max-w-[330px] sm:max-w-[380px] lg:max-w-[400px]">
              <div className="float-el relative">

                {/* Tablet frame */}
                <div className="relative rounded-[2.4rem] bg-[#14171d] p-[12px] shadow-[0_40px_90px_-30px_rgba(11,27,63,.55),0_18px_40px_-20px_rgba(11,27,63,.4)] ring-1 ring-black/40">
                  <div className="absolute top-1/2 -translate-y-1/2 left-[5px] w-[3px] h-16 rounded-full bg-white/10" />
                  <div className="relative rounded-[1.7rem] overflow-hidden bg-white aspect-[3/4]">
                    <Image src="/images/hero-dashboard.png" alt="Sigurado dashboard" fill sizes="(max-width:1024px) 380px, 400px" className="object-cover object-top" draggable={false} />
                    {/* screen glare */}
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,.28) 0%, rgba(255,255,255,0) 30%)' }} />
                  </div>
                </div>

                {/* Floating KPI chip: Patients Seen */}
                <div className="hchip float-chip-a absolute left-2 sm:-left-16 bottom-24 sm:bottom-32 glass rounded-2xl px-4 py-3 shadow-[0_18px_40px_-16px_rgba(11,27,63,.4)] ring-1 ring-white/60">
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center w-9 h-9 rounded-xl bg-[#0038A8]/12 text-[#0038A8] shrink-0">
                      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </span>
                    <div className="leading-none">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#0B1B3F]/50">Patients seen</div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="countup text-[1.5rem] font-extrabold text-[#0B1B3F] tabular-nums" data-target="18">0</span>
                        <span className="text-[11px] font-medium text-[#0B1B3F]/45">today</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating KPI chip: Today's Revenue */}
                <div className="hchip float-chip-b absolute right-2 sm:-right-7 bottom-14 sm:bottom-16 glass rounded-2xl px-4 py-3 shadow-[0_18px_40px_-16px_rgba(11,27,63,.4)] ring-1 ring-white/60">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#0B1B3F]/50">Today&apos;s revenue</div>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-[1.45rem] font-extrabold text-[#0B1B3F]">₱</span>
                    <span className="countup text-[1.45rem] font-extrabold text-[#0B1B3F] tabular-nums" data-target="12450" data-format="comma">0</span>
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <span className="text-[9px]">▲</span> 18% vs yesterday
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

const heroCss = `
.sg-hero .reveal { opacity:1; }
.sg-hero .reveal-device { opacity:1; }
.sg-hero .hchip { opacity:1; }
.sg-hero .float-el { will-change:transform; }

@media (prefers-reduced-motion: no-preference) {
  .sg-hero .reveal { opacity:0; transform:translateY(22px); animation:sghRevealUp .8s cubic-bezier(.22,.61,.36,1) forwards; }
  .sg-hero .d1{animation-delay:.05s} .sg-hero .d2{animation-delay:.20s} .sg-hero .d3{animation-delay:.35s}
  .sg-hero .d4{animation-delay:.50s} .sg-hero .d5{animation-delay:.62s} .sg-hero .d6{animation-delay:.74s}
  .sg-hero .reveal-device { opacity:0; transform:translateY(28px) scale(.97); animation:sghRevealDevice 1s cubic-bezier(.22,.61,.36,1) .45s forwards; }
  .sg-hero .float-el { animation:sghFloaty 6.5s ease-in-out infinite; }
  .sg-hero .hchip { opacity:0; animation:sghFadeIn .8s ease forwards; }
  .sg-hero .float-chip-a { animation:sghFadeIn .8s ease .55s forwards, sghFloaty 5.5s ease-in-out .9s infinite; }
  .sg-hero .float-chip-b { animation:sghFadeIn .8s ease .7s forwards, sghFloaty 6.8s ease-in-out 1.1s infinite; }
  .sg-hero .draw-underline { stroke-dasharray:320; stroke-dashoffset:320; animation:sghDraw 1s ease .9s forwards; }
}

@keyframes sghRevealUp { to { opacity:1; transform:none; } }
@keyframes sghRevealDevice { to { opacity:1; transform:none; } }
@keyframes sghFloaty { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-12px); } }
@keyframes sghFadeIn { to { opacity:1; } }
@keyframes sghDraw { to { stroke-dashoffset:0; } }

.sg-hero .btn { transition:transform .18s cubic-bezier(.22,.61,.36,1), box-shadow .18s ease, background-color .18s ease; }
.sg-hero .btn:hover { transform:translateY(-2px); }
.sg-hero .btn:active { transform:translateY(0); }
.sg-hero .btn-primary { box-shadow:0 14px 30px -10px rgba(0,56,168,.55); }
.sg-hero .btn-primary:hover { box-shadow:0 20px 38px -10px rgba(0,56,168,.65); }
.sg-hero .btn-primary .arrow { transition:transform .25s ease; }
.sg-hero .btn-primary:hover .arrow { transform:translateX(4px); }
.sg-hero .btn-outline:hover { background-color:#ffffff; box-shadow:0 12px 26px -12px rgba(11,27,63,.30); }
.sg-hero .play-ring { transition:transform .25s ease; }
.sg-hero .btn-outline:hover .play-ring { transform:scale(1.08); }

.sg-hero .glass { background:rgba(255,255,255,.72); backdrop-filter:blur(14px) saturate(140%); -webkit-backdrop-filter:blur(14px) saturate(140%); }
`
