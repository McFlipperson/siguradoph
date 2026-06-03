'use client'

import Image from 'next/image'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const [email, setEmail]         = useState('')
  const [clinicName, setClinicName] = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [agreed, setAgreed]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [sent, setSent]           = useState(false)

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

  if (sent) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-[#cfe2f8]">
        <div className="relative">
          <Image src="/images/register-image.png" alt="Sigurado register" width={954} height={1635} priority className="block max-h-screen max-w-full" style={{ height: 'auto', width: 'auto', maxHeight: '100vh', maxWidth: '100%' }} />
          <div className="absolute left-[12%] right-[12%] top-[40%] rounded-2xl bg-white shadow-xl px-6 py-8 text-center flex flex-col items-center gap-4">
            <span className="text-6xl">📬</span>
            <h1 className="text-xl font-black text-gray-900">Check your email!</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              We sent a confirmation link to<br />
              <span className="font-bold text-gray-800">{email}</span>.<br />
              Click it to activate your account.
            </p>
            <a href="/login" className="w-full h-11 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
              Back to Sign In
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#cfe2f8]">
      {/* Wrapper matches the rendered image size; children positioned with
          % coordinates track the image as it scales.
          NOTE: vertical %s are first-pass estimates — fine-tuned live in Chrome. */}
      <form onSubmit={handleSubmit} className="relative">
        <Image
          src="/images/register-image.png"
          alt="Sigurado register"
          width={954}
          height={1635}
          priority
          className="block max-h-screen max-w-full"
          style={{ height: 'auto', width: 'auto', maxHeight: '100vh', maxWidth: '100%' }}
        />

        {/* ── Status message ── */}
        {error && (
          <div
            className="absolute text-center text-[1.4vh] font-semibold rounded-lg px-2 py-1"
            style={{ left: '20.5%', width: '57.5%', top: '34%', background: 'rgba(255,255,255,0.92)', color: '#dc2626' }}
          >
            {error}
          </div>
        )}

        {/* ── Email ── */}
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com" autoComplete="email" required
          className="absolute rounded-[14px] bg-white text-gray-800 text-[1.6vh] outline-none focus:ring-2 focus:ring-blue-300"
          style={{ left: '20.5%', width: '57.5%', top: '39%', height: '3.4%', paddingLeft: '12%', paddingRight: '4%' }}
        />

        {/* ── Clinic name ── */}
        <input
          type="text" value={clinicName} onChange={(e) => setClinicName(e.target.value)}
          placeholder="Your Dental Clinic" autoComplete="organization"
          className="absolute rounded-[14px] bg-white text-gray-800 text-[1.6vh] outline-none focus:ring-2 focus:ring-blue-300"
          style={{ left: '20.5%', width: '57.5%', top: '46.5%', height: '3.4%', paddingLeft: '12%', paddingRight: '4%' }}
        />

        {/* ── Password ── */}
        <input
          type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters" autoComplete="new-password" required
          className="absolute rounded-[14px] bg-white text-gray-800 text-[1.6vh] outline-none focus:ring-2 focus:ring-blue-300"
          style={{ left: '20.5%', width: '57.5%', top: '53.4%', height: '3.4%', paddingLeft: '12%', paddingRight: '12%' }}
        />
        <button
          type="button" aria-label="Toggle password visibility" onClick={() => setShowPass((v) => !v)}
          className="absolute"
          style={{ left: '70%', width: '8%', top: '53.4%', height: '3.4%' }}
        />

        {/* ── Terms agreement checkbox (tap target over the whole row) ── */}
        <button
          type="button" aria-label="Agree to terms" aria-pressed={agreed} onClick={() => setAgreed((v) => !v)}
          className="absolute"
          style={{ left: '20.5%', width: '57.5%', top: '57.8%', height: '3%' }}
        />

        {/* Real checkbox visual — covers the drawn (always-checked) box and
            reflects the actual `agreed` state. pointer-events-none so taps
            fall through to the toggle button above. */}
        <div
          className="absolute flex items-center justify-center rounded-[4px] pointer-events-none transition-colors"
          style={{
            left: '19.9%', width: '4.8%', top: '56.8%', height: '3.2%',
            background: agreed ? '#2563eb' : '#ffffff',
            border: agreed ? '1px solid #2563eb' : '1.5px solid #cbd5e1',
          }}
        >
          {agreed && (
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.5} className="w-[70%] h-[70%]">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          )}
        </div>

        {/* ── "Terms of Service" link (sits above the toggle) ── */}
        <a
          href="/terms" target="_blank" rel="noopener noreferrer"
          aria-label="Terms of Service"
          onClick={(e) => e.stopPropagation()}
          className="absolute z-10"
          style={{ left: '33.5%', width: '16.5%', top: '57.4%', height: '3%' }}
        />

        {/* ── "Privacy Policy" link (sits above the toggle) ── */}
        <a
          href="/privacy" target="_blank" rel="noopener noreferrer"
          aria-label="Privacy Policy"
          onClick={(e) => e.stopPropagation()}
          className="absolute z-10"
          style={{ left: '60%', width: '17.5%', top: '57.4%', height: '3%' }}
        />

        {/* ── Create Account (submit) ── */}
        <button
          type="submit" aria-label="Create account" disabled={loading}
          className="absolute flex items-center justify-center active:opacity-80"
          style={{ left: '20.5%', width: '57.5%', top: '60.8%', height: '4.2%' }}
        >
          {loading && (
            <span className="rounded-[14px] bg-blue-600 w-full h-full flex items-center justify-center text-white font-bold text-[1.7vh]">
              Creating…
            </span>
          )}
        </button>

        {/* ── Single Google button — opaque, covers the drawn Google+Apple
            pair in the image (Apple removed). ── */}
        <button
          type="button" aria-label="Sign up with Google" onClick={handleOAuth} disabled={oauthLoading}
          className="absolute flex items-center justify-center gap-2 rounded-[12px] bg-white border border-gray-200 shadow-sm font-semibold text-gray-700 text-[1.6vh] active:bg-gray-50 disabled:opacity-60"
          style={{ left: '21%', width: '56%', top: '67.2%', height: '5.6%' }}
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
