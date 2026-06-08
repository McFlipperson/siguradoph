'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { createClient } from '@/lib/supabase-browser'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export default function SetPasswordPage() {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)

  const bgStyle = { background: 'linear-gradient(160deg, #C8E4F8 0%, #E8F2FF 40%, #EEF6FF 100%)' }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm)    { setError('Passwords do not match.'); return }
    if (password.length < 8)     { setError('Password must be at least 8 characters.'); return }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) { setError(updateError.message); setLoading(false); return }

    // Find the clinic subdomain for this staff member and redirect there
    try {
      const res  = await fetch('/api/my-clinic-slug')
      const data = await res.json() as { slug?: string }
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'sigurado.xyz'
      if (data.slug) {
        window.location.href = `https://${data.slug}.${rootDomain}/`
        return
      }
    } catch {
      // fallback below
    }
    window.location.href = '/'
  }

  if (done) return null // redirect is in flight

  return (
    <main
      className={`${jakarta.className} min-h-screen w-full flex flex-col items-center justify-center px-4 py-10`}
      style={bgStyle}
    >
      {/* Decorative blobs */}
      <div
        className="pointer-events-none fixed top-0 left-0 w-[380px] h-[380px] rounded-full opacity-60"
        style={{ background: 'radial-gradient(circle, #BFDBFE 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }}
      />
      <div
        className="pointer-events-none fixed bottom-0 right-0 w-[320px] h-[320px] rounded-full opacity-50"
        style={{ background: 'radial-gradient(circle, #BFDBFE 0%, transparent 70%)', transform: 'translate(30%, 30%)' }}
      />

      {/* Card */}
      <div className="relative w-full max-w-[420px] bg-white rounded-[2.2rem] shadow-[0_20px_60px_-16px_rgba(0,56,168,.22)] ring-1 ring-blue-100/80 overflow-hidden">

        {/* Decorative dot grid */}
        <div
          className="absolute top-4 right-6 pointer-events-none opacity-40"
          style={{ backgroundImage: 'radial-gradient(circle, #93C5FD 1.5px, transparent 1.5px)', backgroundSize: '10px 10px', width: 60, height: 60 }}
        />

        {/* Gold sparkle */}
        <div className="absolute top-8 left-10 text-[#FCD116] text-[18px] leading-none select-none pointer-events-none" aria-hidden="true">✦</div>

        {/* Card body */}
        <div className="px-8 pt-10 pb-6 flex flex-col items-center">

          {/* Logo */}
          <Image
            src="/images/hero-logo.png"
            alt="Sigurado"
            width={160} height={48}
            className="h-10 w-auto object-contain mb-5"
            priority draggable={false}
          />

          {/* Headline */}
          <h1 className="text-[1.55rem] font-extrabold tracking-tight text-[#0B1B3F] text-center leading-tight">
            Welcome to the team
            <span className="ml-1.5 text-[1.1rem]" aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1.5 text-[14px] font-medium text-center text-[#0B1B3F]/55 max-w-[270px] leading-snug">
            Set a password to secure your account. You&apos;ll use it to sign in from now on.
          </p>

          {/* Error */}
          {error && (
            <div className="mt-4 w-full rounded-xl px-4 py-2.5 text-[13px] font-semibold text-center bg-red-50 text-red-600 ring-1 ring-red-200">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full mt-5 flex flex-col gap-4">

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0B1B3F]/70">New Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  className="w-full rounded-xl px-4 py-3 pr-11 text-[14px] text-[#0B1B3F] font-medium outline-none focus:ring-2 focus:ring-[#1E5BE6]/40 transition-shadow"
                  style={{ background: '#EEF6FF', border: '1.5px solid #BFDBFE' }}
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0B1B3F]/40 hover:text-[#0B1B3F]/70 transition-colors"
                >
                  {showPass
                    ? <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0B1B3F]/70">Confirm Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
                required
                className="w-full rounded-xl px-4 py-3 text-[14px] text-[#0B1B3F] font-medium outline-none focus:ring-2 focus:ring-[#1E5BE6]/40 transition-shadow"
                style={{ background: '#EEF6FF', border: '1.5px solid #BFDBFE' }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3.5 text-[15px] font-bold text-white flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
              style={{ background: '#1E5BE6', boxShadow: '0 10px 28px -8px rgba(30,91,230,.55)' }}
            >
              {loading ? 'Setting up your account…' : (
                <>
                  Set password &amp; enter app
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Mascot image — matches register/login */}
        <div className="relative w-full overflow-hidden pointer-events-none select-none" style={{ height: 230 }}>
          <Image
            src="/images/login2DOCS.png"
            alt=""
            fill
            className="object-cover object-bottom"
            sizes="(max-width: 480px) 100vw, 420px"
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom privacy strip */}
      <div className="flex items-center justify-center gap-2 px-6 pt-4 pb-2">
        <svg viewBox="0 0 30 20" className="w-5 h-[13px] rounded-sm ring-1 ring-white/30 shrink-0" fill="none">
          <rect width="30" height="10" fill="#0038A8"/><rect y="10" width="30" height="10" fill="#CE1126"/>
          <polygon points="0,0 14,10 0,20" fill="white"/><circle cx="4.5" cy="10" r="2.2" fill="#FCD116"/>
        </svg>
        <p className="text-[11px] font-medium text-[#0B1B3F]/50 text-center">
          Your data is protected under <span className="font-semibold text-[#0B1B3F]/70">RA 10173</span> — Philippines Data Privacy Act of 2012.
        </p>
      </div>
    </main>
  )
}
