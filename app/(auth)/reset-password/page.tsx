'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePassword } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

export default function ResetPasswordPage() {
  const router = useRouter()
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

    setLoading(true)
    const { error: updateError } = await updatePassword(password)

    if (updateError) {
      setError(updateError)
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="flex flex-col items-center gap-3">
          <Image src="/logo.png" alt="Sigurado" width={240} height={160} className="object-contain" />
          <h1 className="text-2xl font-bold">Password updated!</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Your new password is saved. Taking you to sign in…
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/logo.png" alt="Sigurado" width={240} height={160} className="object-contain" />
        <div>
          <h1 className="text-2xl font-bold">Set a new password</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose something you&apos;ll remember</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            autoComplete="new-password"
            className="min-h-[48px]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm">Confirm New Password</Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
            className="min-h-[48px]"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button type="submit" disabled={loading} className="w-full min-h-[48px] text-base mt-1">
          {loading ? 'Saving…' : 'Save new password'}
        </Button>
      </form>
    </div>
  )
}
