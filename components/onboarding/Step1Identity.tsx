'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { Step1Data } from '@/app/(onboarding)/onboarding/actions'

interface Step1IdentityProps {
  initialData: Partial<Step1Data>
  onSave: (data: Step1Data) => Promise<string>
  isSaving: boolean
}

const today = new Date().toISOString().split('T')[0]

export function Step1Identity({ initialData, onSave, isSaving }: Step1IdentityProps) {
  const [form, setForm] = useState<Step1Data>({
    clinicName: initialData.clinicName ?? '',
    ownerName: initialData.ownerName ?? '',
    street: initialData.street ?? '',
    city: initialData.city ?? '',
    province: initialData.province ?? '',
    zip: initialData.zip ?? '',
    phone: initialData.phone ?? '',
    email: initialData.email ?? '',
    facebookPageUrl: initialData.facebookPageUrl ?? '',
    enrollmentDate: initialData.enrollmentDate ?? today,
  })
  const [error, setError] = useState<string | null>(null)

  function set(field: keyof Step1Data, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await onSave(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Clinic Identity</h2>
        <p className="text-sm text-muted-foreground">Tell us about your dental clinic.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="clinicName">Clinic Name *</Label>
        <Input
          id="clinicName"
          value={form.clinicName}
          onChange={e => set('clinicName', e.target.value)}
          required
          className="min-h-[48px]"
          placeholder="e.g. Dela Cruz Dental Clinic"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ownerName">Owner / Dentist Name *</Label>
        <Input
          id="ownerName"
          value={form.ownerName}
          onChange={e => set('ownerName', e.target.value)}
          required
          className="min-h-[48px]"
          placeholder="Dr. Maria Dela Cruz"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="street">Street Address *</Label>
        <Input
          id="street"
          value={form.street}
          onChange={e => set('street', e.target.value)}
          required
          className="min-h-[48px]"
          placeholder="123 Rizal Street"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">City / Municipality *</Label>
          <Input
            id="city"
            value={form.city}
            onChange={e => set('city', e.target.value)}
            required
            className="min-h-[48px]"
            placeholder="Cebu City"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="province">Province *</Label>
          <Input
            id="province"
            value={form.province}
            onChange={e => set('province', e.target.value)}
            required
            className="min-h-[48px]"
            placeholder="Cebu"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="zip">ZIP Code *</Label>
        <Input
          id="zip"
          value={form.zip}
          onChange={e => set('zip', e.target.value)}
          required
          className="min-h-[48px]"
          placeholder="6000"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={e => set('phone', e.target.value)}
          required
          className="min-h-[48px]"
          placeholder="+63 912 345 6789"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Clinic Email *</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={e => set('email', e.target.value)}
          required
          className="min-h-[48px]"
          placeholder="clinic@example.com"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="facebookPageUrl">Facebook Page URL (optional)</Label>
        <Input
          id="facebookPageUrl"
          type="url"
          value={form.facebookPageUrl}
          onChange={e => set('facebookPageUrl', e.target.value)}
          className="min-h-[48px]"
          placeholder="https://facebook.com/yourclinic"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Day One Date — records start from here</CardTitle>
          <CardDescription>
            This is your enrollment date. Financial and compliance records will be tracked from this date onward.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium">{form.enrollmentDate}</p>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        type="submit"
        disabled={isSaving}
        className="w-full min-h-[48px]"
      >
        {isSaving ? 'Saving…' : 'Next →'}
      </Button>
    </form>
  )
}
