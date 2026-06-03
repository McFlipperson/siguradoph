'use client'

import Image from 'next/image'
import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { signIn } from './actions'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'sigurado.xyz'

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}

function LoginForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading]   = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)
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
    <main className="min-h-screen w-full flex items-center justify-center bg-[#cfe2f8]">
      {/* Wrapper matches the rendered image size; children positioned with
          % coordinates track the image as it scales. */}
      <form onSubmit={handleSubmit} className="relative">
        <Image
          src="/images/login-image.png"
          alt="Sigurado login"
          width={954}
          height={1635}
          priority
          className="block max-h-screen max-w-full"
          style={{ height: 'auto', width: 'auto', maxHeight: '100vh', maxWidth: '100%' }}
        />

        {/* ── Status message (over the area above the email box) ── */}
        {(error || resetSent) && (
          <div
            className="absolute text-center text-[1.4vh] font-semibold rounded-lg px-2 py-1"
            style={{
              left: '20.5%', width: '57.5%', top: '36.5%',
              background: 'rgba(255,255,255,0.92)',
              color: error ? '#dc2626' : '#15803d',
            }}
          >
            {error ?? 'Reset email sent! Check your inbox.'}
          </div>
        )}

        {/* ── Email ── */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          className="absolute rounded-[14px] bg-white text-gray-800 text-[1.6vh] outline-none focus:ring-2 focus:ring-blue-300"
          style={{ left: '20.5%', width: '57.5%', top: '41.2%', height: '3.6%', paddingLeft: '12%', paddingRight: '4%' }}
        />

        {/* ── Password ── */}
        <input
          type={showPass ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          autoComplete="current-password"
          required
          className="absolute rounded-[14px] bg-white text-gray-800 text-[1.6vh] outline-none focus:ring-2 focus:ring-blue-300"
          style={{ left: '20.5%', width: '57.5%', top: '51.6%', height: '3.6%', paddingLeft: '12%', paddingRight: '12%' }}
        />
        <button
          type="button"
          aria-label="Toggle password visibility"
          onClick={() => setShowPass((v) => !v)}
          className="absolute"
          style={{ left: '70%', width: '8%', top: '51.6%', height: '3.6%' }}
        />

        {/* ── Remember me ── */}
        <button
          type="button"
          aria-label="Toggle remember me"
          aria-pressed={remember}
          onClick={() => setRemember((v) => !v)}
          className="absolute"
          style={{ left: '20.5%', width: '28%', top: '56.8%', height: '3.4%' }}
        />

        {/* ── Forgot password ── */}
        <button
          type="button"
          aria-label="Forgot password"
          onClick={handleForgot}
          disabled={resetLoading}
          className="absolute"
          style={{ left: '58%', width: '22%', top: '56.8%', height: '3.4%' }}
        />

        {/* ── Log in (submit) ── */}
        <button
          type="submit"
          aria-label="Log in"
          disabled={loading}
          className="absolute flex items-center justify-center active:opacity-80 disabled:opacity-100"
          style={{ left: '20.5%', width: '57.5%', top: '61.4%', height: '5.8%' }}
        >
          {loading && (
            <span className="rounded-[14px] bg-blue-600 w-full h-full flex items-center justify-center text-white font-bold text-[1.7vh]">
              Signing in…
            </span>
          )}
        </button>

        {/* ── Single Google button — opaque, covers the drawn Google+Apple
            pair in the image (Apple removed). ── */}
        <button
          type="button"
          aria-label="Continue with Google"
          onClick={handleOAuth}
          disabled={oauthLoading}
          className="absolute flex items-center justify-center gap-2 rounded-[12px] bg-white border border-gray-200 shadow-sm font-semibold text-gray-700 text-[1.6vh] active:bg-gray-50 disabled:opacity-60"
          style={{ left: '21%', width: '56%', top: '71%', height: '6.4%' }}
        >
          <svg className="w-[2.4vh] h-[2.4vh]" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"/>
          </svg>
          {oauthLoading ? 'Connecting…' : 'Continue with Google'}
        </button>
      </form>
    </main>
  )
}
