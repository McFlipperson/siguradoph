'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createClient } from '@/lib/supabase-browser'
import { toast } from 'sonner'
import { SignaturePad } from '@/components/SignaturePad'
import type { Step1Data } from '@/app/(onboarding)/onboarding/actions'

interface Step1IdentityProps {
  initialData: Partial<Step1Data>
  onSave: (data: Step1Data) => Promise<string>
  isSaving: boolean
}

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'sigurado.xyz'
const today = new Date().toISOString().split('T')[0]

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
}

type SlugStatus = 'idle' | 'checking' | 'available'

export function Step1Identity({ initialData, onSave, isSaving }: Step1IdentityProps) {
  const slugLocked = Boolean(initialData.slug) // slug is immutable once saved

  const [form, setForm] = useState<Step1Data>({
    slug: initialData.slug ?? '',
    logoUrl: initialData.logoUrl ?? null,
    signatureUrl: initialData.signatureUrl ?? null,
    clinicName: initialData.clinicName ?? '',
    ownerName: initialData.ownerName ?? '',
    street: initialData.street ?? '',
    city: initialData.city ?? '',
    province: initialData.province ?? '',
    zip: initialData.zip ?? '',
    phone: initialData.phone ?? '',
    gcashNumber: initialData.gcashNumber ?? '',
    email: initialData.email ?? '',
    facebookPageUrl: initialData.facebookPageUrl ?? '',
    accountantEmail: initialData.accountantEmail ?? '',
    enrollmentDate: initialData.enrollmentDate ?? today,
  })
  const [slugStatus, setSlugStatus] = useState<SlugStatus>(slugLocked ? 'available' : 'idle')
  const [error, setError] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const resolveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function set(field: keyof Step1Data, value: string | null) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Auto-resolve slug from clinic name — tries base, then base-2, base-3, etc.
  // User never has to touch or think about this.
  useEffect(() => {
    if (slugLocked) return
    const base = toSlug(form.clinicName)
    if (base.length < 3) {
      setSlugStatus('idle')
      return
    }

    if (resolveTimer.current) clearTimeout(resolveTimer.current)
    setSlugStatus('checking')

    resolveTimer.current = setTimeout(async () => {
      for (let i = 0; i <= 9; i++) {
        const candidate = i === 0 ? base : `${base}-${i + 1}`
        try {
          const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(candidate)}`)
          const data = await res.json() as { available: boolean }
          if (data.available) {
            setForm(prev => ({ ...prev, slug: candidate }))
            setSlugStatus('available')
            return
          }
        } catch {
          // network hiccup — keep trying next variant
        }
      }
      // All variants exhausted (extremely unlikely — clinic names are unique)
      // Set base anyway and let the server handle the edge case
      setForm(prev => ({ ...prev, slug: base }))
      setSlugStatus('available')
    }, 500)
  }, [form.clinicName, slugLocked])

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB')
      return
    }

    setLogoUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const ext = file.name.split('.').pop() ?? 'png'
      const path = `${user.id}/logo.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('clinic-logos')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('clinic-logos')
        .getPublicUrl(path)

      setForm(prev => ({ ...prev, logoUrl: publicUrl }))
      toast.success('Logo uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLogoUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Only block if we're still mid-check — everything else proceeds
    if (!slugLocked && slugStatus === 'checking') {
      setError('Still setting up your clinic URL, please wait a moment…')
      return
    }

    try {
      await onSave(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Let&apos;s set up your clinic</h2>
        <p className="text-sm text-muted-foreground">Set up your services, loyalty cards, and reminders — then you&apos;re ready to add your first patient.</p>
      </div>

      {/* Logo upload */}
      <div className="flex flex-col gap-2">
        <Label className="font-bold text-base">📸 Clinic Logo <span className="font-normal text-muted-foreground text-sm">(optional)</span></Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/gif, image/webp, image/heic, image/heif, image/svg+xml"
          className="hidden"
          onChange={handleLogoChange}
        />
        <button
          type="button"
          disabled={logoUploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full min-h-[120px] rounded-3xl border-4 border-dashed border-blue-300 bg-blue-50 flex flex-col items-center justify-center gap-2 active:bg-blue-100 transition-colors disabled:opacity-60"
        >
          {form.logoUrl ? (
            <Image
              src={form.logoUrl}
              alt="Clinic logo"
              width={80}
              height={80}
              className="w-20 h-20 object-contain rounded-2xl shadow"
              unoptimized
            />
          ) : (
            <>
              <span className="text-5xl leading-none">{logoUploading ? '⏳' : '📷'}</span>
              <span className="text-sm font-bold text-blue-700">{logoUploading ? 'Uploading…' : 'Tap to upload your logo'}</span>
              <span className="text-xs text-blue-500">PNG, JPG, screenshot — anything. Max 5 MB.</span>
            </>
          )}
        </button>
        {form.logoUrl && (
          <button
            type="button"
            className="text-xs text-destructive font-semibold text-center py-1"
            onClick={() => setForm(prev => ({ ...prev, logoUrl: null }))}
          >
            Remove logo
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="clinicName" className="font-bold text-base">🏥 Clinic Name *</Label>
        <Input
          id="clinicName"
          value={form.clinicName}
          onChange={e => set('clinicName', e.target.value)}
          required
          className="min-h-[48px]"
          placeholder="e.g. Dela Cruz Dental Clinic"
        />
      </div>

      {/* Auto-resolved URL preview — no input needed */}
      {form.clinicName.length >= 3 && (
        <div className="flex flex-col gap-1">
          <Label className="font-bold text-base">🌐 Your Clinic URL</Label>
          <div className="flex items-center gap-2 bg-muted rounded-xl px-4 min-h-[48px]">
            {slugStatus === 'checking' ? (
              <span className="text-sm text-muted-foreground animate-pulse">Setting up your URL…</span>
            ) : form.slug ? (
              <span className="text-sm font-mono font-semibold text-foreground">
                {form.slug}.{ROOT_DOMAIN}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            This is set automatically — no action needed. You can customize it later in Settings.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="ownerName" className="font-bold text-base">👨‍⚕️ Owner / Dentist Name *</Label>
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
        <Label className="font-bold text-base">✍️ Dentist Signature <span className="font-normal text-muted-foreground text-sm">(optional)</span></Label>
        <p className="text-xs text-muted-foreground -mt-1">Sign once here — it prints on every dental certificate you issue. You can change it later in Settings.</p>
        <SignaturePad value={form.signatureUrl ?? null} onChange={(url) => set('signatureUrl', url)} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="street" className="font-bold text-base">📍 Street Address *</Label>
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
          <Label htmlFor="city" className="font-bold text-sm">🏙️ City / Municipality *</Label>
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
          <Label htmlFor="province" className="font-bold text-sm">🗺️ Province *</Label>
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
        <Label htmlFor="zip" className="font-bold text-base">📮 ZIP Code *</Label>
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
        <Label htmlFor="phone" className="font-bold text-base">📞 Phone Number *</Label>
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
        <Label htmlFor="gcashNumber" className="font-bold text-base">💚 GCash Number <span className="font-normal text-muted-foreground text-sm">(optional)</span></Label>
        <Input
          id="gcashNumber"
          type="tel"
          value={form.gcashNumber}
          onChange={e => set('gcashNumber', e.target.value)}
          className="min-h-[48px]"
          placeholder="09xxxxxxxxx"
        />
        <p className="text-xs text-muted-foreground">Used to match GCash payments to your subscription. You can add this later in Settings.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="font-bold text-base">✉️ Clinic Email *</Label>
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
        <Label htmlFor="facebookPageUrl" className="font-bold text-base">👍 Facebook Page URL <span className="font-normal text-muted-foreground text-sm">(optional)</span></Label>
        <Input
          id="facebookPageUrl"
          type="url"
          value={form.facebookPageUrl}
          onChange={e => set('facebookPageUrl', e.target.value)}
          className="min-h-[48px]"
          placeholder="https://facebook.com/yourclinic"
        />
        <div className="rounded-xl bg-muted/60 border border-border px-4 py-3 space-y-2">
          <p className="text-xs font-semibold">How to find your Facebook Page link</p>
          <ol className="text-xs text-muted-foreground leading-relaxed space-y-1 list-decimal list-inside">
            <li>Open Facebook and go to your clinic&apos;s page — the one your patients follow and message you on</li>
            <li>Look at the address bar at the top of your browser. It will say something like <span className="font-mono bg-muted px-1 rounded">facebook.com/YourClinicName</span></li>
            <li>Copy that whole address and paste it here</li>
          </ol>
          <p className="text-xs text-muted-foreground">You can skip this for now and add it later in Settings.</p>
        </div>
      </div>

      {/* Accountant Email — TAX_MODULE hidden. Re-enable in lib/features.ts */}

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

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isSaving || logoUploading || slugStatus === 'checking'} className="w-full min-h-[64px] rounded-3xl font-extrabold text-lg">
        {isSaving ? 'Saving…' : slugStatus === 'checking' ? 'Setting up URL…' : 'Next →'}
      </Button>
    </form>
  )
}
