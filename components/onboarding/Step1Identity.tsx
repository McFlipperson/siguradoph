'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createClient } from '@/lib/supabase-browser'
import { toast } from 'sonner'
import type { Step1Data } from '@/app/(onboarding)/onboarding/actions'

interface Step1IdentityProps {
  initialData: Partial<Step1Data>
  onSave: (data: Step1Data) => Promise<string>
  isSaving: boolean
}

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'sigurado.xyz'
const today = new Date().toISOString().split('T')[0]
const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
}

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export function Step1Identity({ initialData, onSave, isSaving }: Step1IdentityProps) {
  const slugLocked = Boolean(initialData.slug) // slug is immutable once saved

  const [form, setForm] = useState<Step1Data>({
    slug: initialData.slug ?? '',
    logoUrl: initialData.logoUrl ?? null,
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
  const [slugStatus, setSlugStatus] = useState<SlugStatus>(slugLocked ? 'available' : 'idle')
  const [slugEdited, setSlugEdited] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function set(field: keyof Step1Data, value: string | null) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Auto-generate slug from clinic name (only if not manually edited and not locked)
  useEffect(() => {
    if (slugLocked || slugEdited) return
    const generated = toSlug(form.clinicName)
    if (generated.length >= 3) {
      setForm(prev => ({ ...prev, slug: generated }))
    }
  }, [form.clinicName, slugEdited, slugLocked])

  const checkSlug = useCallback((slug: string) => {
    if (checkTimer.current) clearTimeout(checkTimer.current)
    if (slug.length < 3) { setSlugStatus('invalid'); return }
    if (!SLUG_RE.test(slug)) { setSlugStatus('invalid'); return }
    setSlugStatus('checking')
    checkTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(slug)}`)
        const data = await res.json() as { available: boolean }
        setSlugStatus(data.available ? 'available' : 'taken')
      } catch {
        setSlugStatus('idle')
      }
    }, 400)
  }, [])

  function handleSlugChange(value: string) {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlugEdited(true)
    set('slug', cleaned)
    checkSlug(cleaned)
  }

  function handleSlugBlur() {
    if (!slugLocked) checkSlug(form.slug)
  }

  const slugHint: { text: string; color: string } | null = (() => {
    if (slugLocked) return { text: 'Your clinic address is locked and cannot be changed.', color: 'text-muted-foreground' }
    switch (slugStatus) {
      case 'checking': return { text: 'Checking availability…', color: 'text-muted-foreground' }
      case 'available': return { text: '✓ Available', color: 'text-green-600' }
      case 'taken': return { text: '✗ Already taken — try a different one', color: 'text-destructive' }
      case 'invalid': return { text: 'Use only lowercase letters, numbers, and hyphens (min 3 characters)', color: 'text-destructive' }
      default: return null
    }
  })()

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
      // reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!slugLocked && slugStatus !== 'available') {
      setError('Please choose a valid, available clinic address before continuing.')
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
        <p className="text-sm text-muted-foreground">10 minutes now saves you hours every month — receipts, payroll, and BIR filings will run themselves after this.</p>
      </div>

      {/* Logo upload */}
      <div className="flex flex-col gap-2">
        <Label>Clinic Logo (optional)</Label>
        <div className="flex items-center gap-4">
          {/* Preview */}
          <div className="w-16 h-16 rounded-xl border bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {form.logoUrl ? (
              <Image
                src={form.logoUrl}
                alt="Clinic logo"
                width={64}
                height={64}
                className="w-full h-full object-contain"
                unoptimized
              />
            ) : (
              <span className="text-2xl text-muted-foreground select-none">🏥</span>
            )}
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/gif, image/webp, image/heic, image/heif, image/svg+xml"
              className="hidden"
              onChange={handleLogoChange}
            />
            <Button
              type="button"
              variant="outline"
              className="min-h-[48px]"
              disabled={logoUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {logoUploading ? 'Uploading…' : form.logoUrl ? 'Change Logo' : 'Upload Logo'}
            </Button>
            {form.logoUrl && (
              <Button
                type="button"
                variant="ghost"
                className="min-h-[40px] text-destructive hover:text-destructive"
                onClick={() => setForm(prev => ({ ...prev, logoUrl: null }))}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">PNG, JPG, screenshot — anything works. Max 5 MB.</p>
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

      {/* Slug / Clinic URL */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="slug">Your Clinic Address *</Label>
        <p className="text-xs text-muted-foreground -mt-1">
          This is the web address your staff will use to log in. Choose something short and recognizable — like your clinic name.{' '}
          <span className="font-medium">You cannot change this later.</span>
        </p>
        <div className="flex items-center gap-0 border border-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring">
          <span className="bg-muted text-muted-foreground text-sm px-3 py-3 border-r border-input whitespace-nowrap select-none">
            {ROOT_DOMAIN}/
          </span>
          <Input
            id="slug"
            value={form.slug}
            onChange={e => handleSlugChange(e.target.value)}
            onBlur={handleSlugBlur}
            disabled={slugLocked}
            className="border-0 rounded-none shadow-none focus-visible:ring-0 min-h-[48px]"
            placeholder="dela-cruz-dental"
          />
        </div>
        {form.slug && (
          <p className="text-xs text-muted-foreground font-mono">
            {form.slug}.{ROOT_DOMAIN}
          </p>
        )}
        {slugHint && (
          <p className={`text-xs ${slugHint.color}`}>{slugHint.text}</p>
        )}
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

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isSaving || logoUploading} className="w-full min-h-[48px]">
        {isSaving ? 'Saving…' : 'Next →'}
      </Button>
    </form>
  )
}
