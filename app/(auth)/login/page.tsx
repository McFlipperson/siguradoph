'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Suspense, useState } from 'react'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { createClient } from '@/lib/supabase-browser'
import { signIn } from './actions'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'sigurado.xyz'

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}

function LoginForm() {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [remember, setRemember]     = useState(true)
  const [loading, setLoading]       = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [resetSent, setResetSent]   = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setResetSent(false); setLoading(true)
    const { error: authError } = await signIn(email, password)
    if (authError) { setError('Incorrect email or password.'); setLoading(false); return }
    try {
      const res = await fetch('/api/my-clinic-slug')
      if (res.ok) {
        const { slug } = await res.json() as { slug: string | null }
        if (slug) { window.location.href = `https://${slug}.${ROOT_DOMAIN}/`; return }
      }
    } catch { /* fall through */ }
    window.location.href = '/onboarding'
  }

  async function handleForgot() {
    if (!email) { setError('Enter your email above first.'); return }
    setError(null); setResetLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/confirm` })
    setResetSent(true); setResetLoading(false)
  }

  async function handleOAuth() {
    setOauthLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/confirm` } })
  }

  return (
    <main
      className={`${jakarta.className} min-h-screen w-full flex flex-col items-center justify-center px-4 py-10`}
      style={{ background: 'linear-gradient(160deg, #C8E4F8 0%, #E8F2FF 40%, #EEF6FF 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed top-0 left-0 w-[380px] h-[380px] rounded-full opacity-60" style={{ background: 'radial-gradient(circle, #BFDBFE 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />
      <div className="pointer-events-none fixed bottom-0 right-0 w-[320px] h-[320px] rounded-full opacity-50" style={{ background: 'radial-gradient(circle, #BFDBFE 0%, transparent 70%)', transform: 'translate(30%, 30%)' }} />

      {/* Card */}
      <div className="relative w-full max-w-[420px] bg-white rounded-[2.2rem] shadow-[0_20px_60px_-16px_rgba(0,56,168,.22)] ring-1 ring-blue-100/80 overflow-hidden pb-0">

        {/* Decorative top-right dot grid */}
        <div className="absolute top-4 right-6 pointer-events-none opacity-40" style={{ backgroundImage: 'radial-gradient(circle, #93C5FD 1.5px, transparent 1.5px)', backgroundSize: '10px 10px', width: 60, height: 60 }} />

        {/* Green checkmark badge */}
        <div className="absolute top-5 right-5 z-10 w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center shadow-md ring-2 ring-white">
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M3 8.5L6 11.5L13 4.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>

        {/* Sparkle decorations */}
        <div className="absolute top-8 left-10 text-[#FCD116] text-[18px] leading-none select-none pointer-events-none" aria-hidden="true">✦</div>

        {/* Card body */}
        <div className="px-8 pt-10 pb-6 flex flex-col items-center">

          {/* Logo */}
          <Image src="/images/hero-logo.png" alt="Sigurado" width={160} height={48} className="h-10 w-auto object-contain mb-5" priority draggable={false} />

          {/* Headline */}
          <h1 className="text-[1.65rem] font-extrabold tracking-tight text-[#0B1B3F] text-center leading-tight">
            Welcome back!
            <span className="ml-1.5 text-[1.1rem]" aria-hidden="true">✨</span>
          </h1>
          <p className="mt-1.5 text-[14px] font-medium text-center text-[#0B1B3F]/55 max-w-[260px] leading-snug">
            Log in to continue managing your clinic with ease.
          </p>

          {/* Error / success message */}
          {(error || resetSent) && (
            <div className={`mt-4 w-full rounded-xl px-4 py-2.5 text-[13px] font-semibold text-center ${error ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'}`}>
              {error ?? 'Reset email sent — check your inbox.'}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full mt-5 flex flex-col gap-4">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0B1B3F]/70">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full rounded-xl px-4 py-3 text-[14px] text-[#0B1B3F] font-medium outline-none focus:ring-2 focus:ring-[#1E5BE6]/40 transition-shadow"
                style={{ background: '#EEF6FF', border: '1.5px solid #BFDBFE' }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#0B1B3F]/70">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
                  {showPass ? (
                    <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRemember(v => !v)}
                className="flex items-center gap-2 text-[13px] font-medium text-[#0B1B3F]/65 hover:text-[#0B1B3F] transition-colors"
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${remember ? 'bg-[#1E5BE6] border-[#1E5BE6]' : 'bg-white border-blue-200'}`}>
                  {remember && <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5"><path d="M1.5 5L3.5 7L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                Remember me
              </button>
              <button
                type="button"
                onClick={handleForgot}
                disabled={resetLoading}
                className="text-[13px] font-semibold text-[#1E5BE6] hover:text-[#0038A8] transition-colors disabled:opacity-50"
              >
                {resetLoading ? 'Sending…' : 'Forgot password?'}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3.5 text-[15px] font-bold text-white flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
              style={{ background: '#1E5BE6', boxShadow: '0 10px 28px -8px rgba(30,91,230,.55)' }}
            >
              {loading ? 'Signing in…' : (
                <>
                  Log in
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
            type="button"
            onClick={handleOAuth}
            disabled={oauthLoading}
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

          {/* Security badge */}
          <div className="mt-4 w-full flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: '#EEF6FF' }}>
            <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1E5BE6,#0038A8)' }}>
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div className="text-[13px] font-bold text-[#0B1B3F] flex items-center gap-1">
                Your clinic. Your data.
                <span className="text-[#FCD116] text-[11px]">✦</span>
              </div>
              <div className="text-[11.5px] font-medium text-[#0B1B3F]/55">Secure, private, and always protected.</div>
            </div>
          </div>

          {/* Register link */}
          <p className="mt-4 text-[13px] font-medium text-[#0B1B3F]/50 text-center">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-bold text-[#1E5BE6] hover:text-[#0038A8] transition-colors">Register free</Link>
          </p>
        </div>

        {/* Mascot characters — bottom of card */}
        {/* Drop login-nurse.png and login-doc.png into public/images/ when ready */}
        <div className="relative w-full h-[160px] mt-2 overflow-hidden pointer-events-none select-none">
          {/* Left mascot placeholder */}
          {/* <Image src="/images/login-nurse.png" alt="" width={140} height={180} className="absolute bottom-0 left-4 h-[155px] w-auto object-contain" draggable={false} /> */}
          {/* Right mascot placeholder */}
          {/* <Image src="/images/login-doc.png" alt="" width={140} height={180} className="absolute bottom-0 right-4 h-[155px] w-auto object-contain" draggable={false} /> */}
        </div>

        {/* Bottom privacy strip */}
        <div className="flex items-center justify-center gap-2 px-6 pb-5 -mt-6">
          <svg viewBox="0 0 30 20" className="w-5 h-[14px] rounded-sm ring-1 ring-black/10 shrink-0" fill="none">
            <rect width="30" height="10" fill="#0038A8"/>
            <rect y="10" width="30" height="10" fill="#CE1126"/>
            <polygon points="0,0 14,10 0,20" fill="white"/>
            <circle cx="4.5" cy="10" r="2.2" fill="#FCD116"/>
          </svg>
          <p className="text-[11px] font-medium text-[#0B1B3F]/40 text-center">
            Your data is protected under <span className="font-bold text-[#0B1B3F]/60">RA 10173</span> — Philippines Data Privacy Act of 2012.
          </p>
        </div>
      </div>
    </main>
  )
}
