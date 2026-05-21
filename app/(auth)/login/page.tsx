'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'sigurado.xyz'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const confirmationFailed = searchParams.get('error') === 'confirmation_failed'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleForgotPassword() {
    if (!email) {
      setError('Enter your email address above first, then tap Forgot password.')
      return
    }
    setResetLoading(true)
    setError(null)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    setResetSent(true)
    setResetLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Incorrect email or password.')
      setLoading(false)
      return
    }

    // Fetch their clinic slug and redirect to subdomain dashboard
    try {
      const res = await fetch('/api/my-clinic-slug')
      if (res.ok) {
        const { slug } = await res.json() as { slug: string | null }
        if (slug) {
          window.location.href = `https://${slug}.${ROOT_DOMAIN}/`
          return
        }
      }
    } catch {
      // no slug yet — fall through to onboarding
    }

    // No clinic yet — go to onboarding
    window.location.href = '/onboarding'
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/logo.png" alt="Sigurado" width={240} height={160} className="object-contain" />
        <p className="text-sm text-muted-foreground">Sign in to your clinic account</p>
      </div>

      {confirmationFailed && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive text-center">
          The confirmation link has expired or is invalid. Please register again or contact support.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="min-h-[48px]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="min-h-[48px]"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button type="submit" disabled={loading} className="w-full min-h-[48px] text-base mt-1">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      {resetSent ? (
        <p className="text-center text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          Password reset email sent! Check your inbox and click the link.
        </p>
      ) : (
        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={resetLoading}
          className="text-center text-sm text-muted-foreground underline underline-offset-4 disabled:opacity-50"
        >
          {resetLoading ? 'Sending…' : 'Forgot password?'}
        </button>
      )}

      <p className="text-center text-sm text-muted-foreground">
        No account yet?{' '}
        <Link href="/register" className="text-primary underline underline-offset-4">
          Register your clinic
        </Link>
      </p>
    </div>
  )
}
