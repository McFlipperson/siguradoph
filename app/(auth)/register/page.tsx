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
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)
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

  async function handleOAuth(provider: 'google' | 'apple') {
    setOauthLoading(provider)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/confirm` } })
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

        {/* ── Terms agreement checkbox ── */}
        <button
          type="button" aria-label="Agree to terms" aria-pressed={agreed} onClick={() => setAgreed((v) => !v)}
          className="absolute"
          style={{ left: '20.5%', width: '57.5%', top: '57.8%', height: '3%' }}
        />

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

        {/* ── Google ── */}
        <button
          type="button" aria-label="Sign up with Google" onClick={() => handleOAuth('google')} disabled={oauthLoading !== null}
          className="absolute active:opacity-80"
          style={{ left: '25.5%', width: '22.5%', top: '68.1%', height: '4%' }}
        />

        {/* ── Apple ── */}
        <button
          type="button" aria-label="Sign up with Apple" onClick={() => handleOAuth('apple')} disabled={oauthLoading !== null}
          className="absolute active:opacity-80"
          style={{ left: '50.5%', width: '22.5%', top: '68.1%', height: '4%' }}
        />
      </form>
    </main>
  )
}
