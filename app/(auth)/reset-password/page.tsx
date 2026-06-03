'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { updatePassword } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenHash = searchParams.get('token_hash') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (!tokenHash) {
      setError('Reset link is invalid or has expired. Please request a new one.')
      return
    }

    setLoading(true)
    const { error: updateError } = await updatePassword(tokenHash, password)

    if (updateError) {
      setError(updateError)
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  const card = (content: React.ReactNode) => (
    <div className="min-h-screen flex items-center justify-center px-5"
      style={{ background: 'linear-gradient(145deg, #dbeafe 0%, #eff6ff 50%, #e0e7ff 100%)' }}>
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl px-7 py-10">
        <div className="flex justify-center mb-6">
          <Image src="/images/sig-final-ph-logo.png" alt="Sigurado" width={160} height={48} className="object-contain" />
        </div>
        {content}
      </div>
    </div>
  )

  if (done) {
    return card(
      <div className="flex flex-col gap-4 text-center">
        <span className="text-6xl">🎉</span>
        <h1 className="text-2xl font-black text-gray-900">Password updated!</h1>
        <p className="text-sm text-gray-500">Your new password is saved. Taking you to sign in…</p>
      </div>
    )
  }

  return card(
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h1 className="text-2xl font-black text-gray-900">Set a new password</h1>
        <p className="text-sm text-gray-500 mt-1">Choose something you&apos;ll remember</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="font-semibold text-sm">New Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters" required autoComplete="new-password" className="min-h-[52px] rounded-2xl" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm" className="font-semibold text-sm">Confirm New Password</Label>
          <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••" required autoComplete="new-password" className="min-h-[52px] rounded-2xl" />
        </div>
        {error && <p className="text-sm text-red-600 text-center font-medium">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full min-h-[56px] rounded-2xl font-bold text-base mt-1">
          {loading ? 'Saving…' : 'Save new password'}
        </Button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
