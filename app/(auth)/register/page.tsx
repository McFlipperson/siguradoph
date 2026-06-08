'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { createClient } from '@/lib/supabase-browser'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const [email, setEmail]           = useState('')
  const [clinicName, setClinicName] = useState('')
  const [password, setPassword]     = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [agreed, setAgreed]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [sent, setSent]             = useState(false)

  useEffect(() => {
    const plan = searchParams.get('plan')
    if (plan === 'basic' || plan === 'pro') {
      localStorage.setItem('sigurado_selected_plan', plan)
    } else {
      localStorage.removeItem('sigurado_selected_plan')
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!agreed)             { setError('Please agree to the Terms and Privacy Policy.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    if (clinicName.trim()) localStorage.setItem('sigurado_clinic_name', clinicName.trim())
    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    })
    if (authError) { setError(authError.message); setLoading(false); return }
    if (data.user && data.user.identities?.length === 0) {
      setError('An account with that email already exists. Please sign in instead.')
      setLoading(false)
      return
    }
    setSent(true)
  }

  async function handleOAuth() {
    setOauthLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/confirm` } })
  }

  const bgStyle = { background: 'linear-gradient(160deg, #C8E4F8 0%, #E8F2FF 40%, #EEF6FF 100%)' }

  // ── Email sent confirmation ────────────────────────────────────────────────
  if (sent) {
    return (
      <main className={`${jakarta.className} min-h-screen w-full flex flex-col items-center justify-center px-4 py-10`} style={bgStyle}>
        <div className="pointer-events-none fixed top-0 left-0 w-[380px] h-[380px] rounded-full opacity-60" style={{ background: 'radial-gradient(circle, #BFDBFE 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />
        <div className="w-full max-w-[420px] bg-white rounded-[2.2rem] shadow-[0_20px_60px_-16px_rgba(0,56,168,.22)] ring-1 ring-blue-100/80 overflow-hidden">
          <div className="px-8 pt-10 pb-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center ring-2 ring-emerald-100">
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="m16 19 2 2 4-4"/></svg>
            </div>
            <Image src="/images/hero-logo.png" alt="Sigurado" width={140} height={42} className="h-9 w-auto object-contain" draggable={false} />
            <div>
              <h1 className="text-[1.5rem] font-extrabold text-[#0B1B3F] tracking-tight">Check your email!</h1>
              <p className="mt-2 text-[14px] font-medium text-[#0B1B3F]/55 leading-relaxed">
                We sent a confirmation link to<br />
                <span className="font-bold text-[#0B1B3F]/80">{email}</span>.
              </p>
              <div className="w-full rounded-xl px-4 py-3 text-[13px] font-semibold text-center bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                ⚠️ You must click the link in that email <strong>before</strong> you can log in. Check your spam folder if you don&apos;t see it.
              </div>
            </div>
            <Link
              href="/login"
              className="w-full rounded-xl py-3.5 text-[15px] font-bold text-white flex items-center justify-center"
              style={{ background: '#1E5BE6', boxShadow: '0 10px 28px -8px rgba(30,91,230,.55)' }}
            >
              Back to Sign In
            </Link>
          </div>
          <div className="relative w-full overflow-hidden pointer-events-none select-none" style={{ height: 230 }}>
            <Image src="/images/login2DOCS.png" alt="" fill className="object-cover object-bottom" sizes="(max-width: 480px) 100vw, 420px" draggable={false} />
          </div>
        </div>
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

  // ── Register form ──────────────────────────────────────────────────────────
  return (
    <main className={`${jakarta.className} min-h-screen w-full flex flex-col items-center justify-center px-4 py-10`} style={bgStyle}>
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed top-0 left-0 w-[380px] h-[380px] rounded-full opacity-60" style={{ background: 'radial-gradient(circle, #BFDBFE 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />
      <div className="pointer-events-none fixed bottom-0 right-0 w-[320px] h-[320px] rounded-full opacity-50" style={{ background: 'radial-gradient(circle, #BFDBFE 0%, transparent 70%)', transform: 'translate(30%, 30%)' }} />

      {/* Card */}
      <div className="relative w-full max-w-[420px] bg-white rounded-[2.2rem] shadow-[0_20px_60px_-16px_rgba(0,56,168,.22)] ring-1 ring-blue-100/80 overflow-hidden">

        {/* Decorative dot grid */}
        <div className="absolute top-4 right-6 pointer-events-none opacity-40" style={{ backgroundImage: 'radial-gradient(circle, #93C5FD 1.5px, transparent 1.5px)', backgroundSize: '10px 10px', width: 60, height: 60 }} />

        {/* Gold sparkle */}
        <div className="absolute top-8 left-10 text-[#FCD116] text-[18px] leading-none select-none pointer-events-none" aria-hidden="true">✦</div>

        {/* Card body */}
        <div className="px-8 pt-10 pb-6 flex flex-col items-center">

          {/* Logo */}
          <Image src="/images/hero-logo.png" alt="Sigurado" width={160} height={48} className="h-10 w-auto object-contain mb-5" priority draggable={false} />

          {/* Headline */}
          <h1 className="text-[1.55rem] font-extrabold tracking-tight text-[#0B1B3F] text-center leading-tight">
            Start for free
            <span className="ml-1.5 text-[1.1rem]" aria-hidden="true">🎉</span>
          </h1>
          <p className="mt-1.5 text-[14px] font-medium text-center text-[#0B1B3F]/55 max-w-[270px] leading-snug">
            Set up your clinic in under 5 minutes. No credit card needed.
          </p>

          {/* Error message */}
          {error && (
            <div className="mt-4 w-full rounded-xl px-4 py-2.5 text-[13px] font-semibold text-center bg-red-50 text-red-600 ring-1 ring-red-200">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full mt-5 flex flex-col gap-4">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0B1B3F]/70">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email" required
                className="w-full rounded-xl px-4 py-3 text-[14px] text-[#0B1B3F] font-medium outline-none focus:ring-2 focus:ring-[#1E5BE6]/40 transition-shadow"
                style={{ background: '#EEF6FF', border: '1.5px solid #BFDBFE' }}
              />
            </div>

            {/* Clinic name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0B1B3F]/70">Clinic name</label>
              <input
                type="text" value={clinicName} onChange={e => setClinicName(e.target.value)}
                placeholder="Your Dental Clinic" autoComplete="organization" required
                className="w-full rounded-xl px-4 py-3 text-[14px] text-[#0B1B3F] font-medium outline-none focus:ring-2 focus:ring-[#1E5BE6]/40 transition-shadow"
                style={{ background: '#EEF6FF', border: '1.5px solid #BFDBFE' }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0B1B3F]/70">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters" autoComplete="new-password" required
                  className="w-full rounded-xl px-4 py-3 pr-11 text-[14px] text-[#0B1B3F] font-medium outline-none focus:ring-2 focus:ring-[#1E5BE6]/40 transition-shadow"
                  style={{ background: '#EEF6FF', border: '1.5px solid #BFDBFE' }}
                />
                <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0B1B3F]/40 hover:text-[#0B1B3F]/70 transition-colors">
                  {showPass
                    ? <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Terms */}
            <button type="button" onClick={() => setAgreed(v => !v)} className="flex items-start gap-2.5 text-left">
              <div className={`mt-0.5 shrink-0 w-4 h-4 rounded flex items-center justify-center border transition-colors ${agreed ? 'bg-[#1E5BE6] border-[#1E5BE6]' : 'bg-white border-blue-200'}`}>
                {agreed && <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5"><path d="M1.5 5L3.5 7L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span className="text-[12.5px] font-medium text-[#0B1B3F]/60 leading-snug">
                I agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="font-semibold text-[#1E5BE6] underline underline-offset-2">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="font-semibold text-[#1E5BE6] underline underline-offset-2">Privacy Policy</a>
              </span>
            </button>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full rounded-xl py-3.5 text-[15px] font-bold text-white flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
              style={{ background: '#1E5BE6', boxShadow: '0 10px 28px -8px rgba(30,91,230,.55)' }}
            >
              {loading ? 'Creating account…' : (
                <>
                  Create free account
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="w-full flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: '#DBEAFE' }} />
            <span className="text-[12px] font-medium text-[#0B1B3F]/40">or continue with</span>
            <div className="flex-1 h-px" style={{ background: '#DBEAFE' }} />
          </div>

          {/* Google */}
          <button
            type="button" onClick={handleOAuth} disabled={oauthLoading}
            className="w-full flex items-center justify-center gap-3 rounded-xl py-3 text-[14px] font-semibold text-[#0B1B3F] bg-white ring-1 ring-blue-100 shadow-sm hover:shadow-md transition-shadow disabled:opacity-60"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"/>
            </svg>
            {oauthLoading ? 'Connecting…' : 'Continue with Google'}
          </button>

          {/* Sign in link */}
          <p className="mt-4 text-[13px] font-medium text-[#0B1B3F]/50 text-center">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[#1E5BE6] hover:text-[#0038A8] transition-colors">Sign in</Link>
          </p>
        </div>

        {/* Mascot image — same as login */}
        <div className="relative w-full overflow-hidden pointer-events-none select-none" style={{ height: 230 }}>
          <Image src="/images/login2DOCS.png" alt="" fill className="object-cover object-bottom" sizes="(max-width: 480px) 100vw, 420px" draggable={false} />
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
