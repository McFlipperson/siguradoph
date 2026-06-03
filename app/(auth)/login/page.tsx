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
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)
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

  async function handleOAuth(provider: 'google' | 'apple') {
    setOauthLoading(provider)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/confirm` } })
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

        {/* ── Google ── */}
        <button
          type="button"
          aria-label="Continue with Google"
          onClick={() => handleOAuth('google')}
          disabled={oauthLoading !== null}
          className="absolute active:opacity-80"
          style={{ left: '25.5%', width: '22.5%', top: '72.3%', height: '5%' }}
        />

        {/* ── Apple ── */}
        <button
          type="button"
          aria-label="Continue with Apple"
          onClick={() => handleOAuth('apple')}
          disabled={oauthLoading !== null}
          className="absolute active:opacity-80"
          style={{ left: '50.5%', width: '22.5%', top: '72.3%', height: '5%' }}
        />
      </form>
    </main>
  )
}
