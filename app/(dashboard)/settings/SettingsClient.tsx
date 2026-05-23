'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import Image from 'next/image'
import { PrinterSection } from './PrinterSection'
import { createClient } from '@/lib/supabase-browser'
import { updateClinicLogo } from './actions'

const SUPPLIER_CATEGORIES = [
  { value: 'DENTAL_SUPPLIES', label: 'Dental Supplies' },
  { value: 'MEDICAL_SUPPLIES', label: 'Medical Supplies' },
  { value: 'RENT', label: 'Rent' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'INTERNET_PHONE', label: 'Internet & Phone' },
  { value: 'PROFESSIONAL_FEES', label: 'Professional Fees' },
  { value: 'LICENSES_PERMITS', label: 'Licenses & Permits' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OTHER', label: 'Other' },
] as const

type ClinicData = {
  id: string
  slug: string | null
  logoUrl: string | null
  name: string
  ownerName: string
  street: string
  city: string
  province: string
  zip: string
  phone: string
  email: string
  facebookPageUrl: string
  messengerPageId: string
  tin: string
  rdoCode: string
  corNumber: string
  entityType: string
  filingMethod: string
  vatRegistered: boolean
  vatRegistrationDate: string | null
  orSeriesStart: string
  orSeriesCurrentNumber: number
  enrollmentDate: string
  hasEmployees: boolean
  sssEmployerNumber: string
  philhealthEmployerNumber: string
  pagibigEmployerNumber: string
  accountantEmail: string
}

type ServiceItem = {
  id: string
  name: string
  category: string
  isActive: boolean
  sortOrder: number
}

type SupplierItem = {
  id: string
  name: string
  address: string | null
  tin: string | null
  vatRegistered: boolean
  category: string
}

type SupplierFormData = {
  name: string
  address: string
  tin: string
  vatRegistered: boolean
  category: string
}

// ─── SupplierSheet ────────────────────────────────────────────────────────────

function SupplierSheet({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: SupplierFormData) => Promise<void>
  initial?: SupplierItem
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [tin, setTin] = useState(initial?.tin ?? '')
  const [vatRegistered, setVatRegistered] = useState(initial?.vatRegistered ?? false)
  const [category, setCategory] = useState(initial?.category ?? '')
  const [saving, setSaving] = useState(false)

  // Sync when sheet opens
  useState(() => {
    if (initial) {
      setName(initial.name)
      setAddress(initial.address ?? '')
      setTin(initial.tin ?? '')
      setVatRegistered(initial.vatRegistered)
      setCategory(initial.category)
    } else {
      setName('')
      setAddress('')
      setTin('')
      setVatRegistered(false)
      setCategory('')
    }
  })

  const canSave = name.trim() !== '' && category.trim() !== ''

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave({ name, address, tin, vatRegistered, category })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative rounded-t-2xl bg-background max-h-[90vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex items-center justify-between px-4 pb-3">
          <h2 className="text-base font-semibold">{initial ? 'Edit Supplier' : 'Add Supplier'}</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
        </div>
        <div className="overflow-y-auto px-4 pb-6 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Supplier Name <span className="text-red-500">*</span></label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Dental Depot PH"
              className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1"
            />
          </div>

          {/* Category chip grid */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Category <span className="text-red-500">*</span></p>
            <div className="grid grid-cols-3 gap-2">
              {SUPPLIER_CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`min-h-[44px] px-2 py-2 rounded-lg border text-xs font-medium transition-colors text-center ${category === c.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Address (optional)</label>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. 123 Supplier St, Manila"
              className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1"
            />
          </div>

          {/* TIN */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">TIN (optional)</label>
            <input
              value={tin}
              onChange={e => setTin(e.target.value)}
              placeholder="000-000-000-000"
              className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1"
            />
          </div>

          {/* VAT Registered toggle */}
          <div className="flex items-center justify-between min-h-[48px]">
            <span className="text-sm font-medium">VAT Registered</span>
            <button
              onClick={() => setVatRegistered(v => !v)}
              className={`relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors ${vatRegistered ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${vatRegistered ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Supplier'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SettingsClient ───────────────────────────────────────────────────────────

export default function SettingsClient({
  clinic,
  initialServices,
  initialSuppliers,
}: {
  clinic: ClinicData
  initialServices: ServiceItem[]
  initialSuppliers: SupplierItem[]
}) {
  const [tab, setTab] = useState<'clinic' | 'services' | 'suppliers' | 'devices'>('clinic')

  // ── Clinic tab state ──
  const [clinicName, setClinicName] = useState(clinic.name)
  const [ownerName, setOwnerName] = useState(clinic.ownerName)
  const [street, setStreet] = useState(clinic.street)
  const [city, setCity] = useState(clinic.city)
  const [province, setProvince] = useState(clinic.province)
  const [zip, setZip] = useState(clinic.zip)
  const [phone, setPhone] = useState(clinic.phone)
  const [email, setEmail] = useState(clinic.email)
  const [facebookPageUrl, setFacebookPageUrl] = useState(clinic.facebookPageUrl)
  const [messengerPageId, setMessengerPageId] = useState(clinic.messengerPageId)
  const [orSeriesStart, setOrSeriesStart] = useState(clinic.orSeriesStart)
  const [hasEmployees, setHasEmployees] = useState(clinic.hasEmployees)
  const [sssEmployerNumber, setSssEmployerNumber] = useState(clinic.sssEmployerNumber)
  const [philhealthEmployerNumber, setPhilhealthEmployerNumber] = useState(clinic.philhealthEmployerNumber)
  const [pagibigEmployerNumber, setPagibigEmployerNumber] = useState(clinic.pagibigEmployerNumber)
  const [accountantEmail, setAccountantEmail] = useState(clinic.accountantEmail)
  const [tin, setTin] = useState(clinic.tin)
  const [rdoCode, setRdoCode] = useState(clinic.rdoCode)
  const [corNumber, setCorNumber] = useState(clinic.corNumber)
  const [entityType, setEntityType] = useState(clinic.entityType)
  const [vatRegistered, setVatRegistered] = useState(clinic.vatRegistered)
  const [vatRegistrationDate, setVatRegistrationDate] = useState(clinic.vatRegistrationDate ?? '')
  const [filingMethod, setFilingMethod] = useState(clinic.filingMethod)
  const [savingClinic, setSavingClinic] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(clinic.logoUrl)
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return }
    setLogoUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const ext = file.name.split('.').pop() ?? 'png'
      const path = `${user.id}/logo.${ext}`
      const { error: uploadError } = await supabase.storage.from('clinic-logos').upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('clinic-logos').getPublicUrl(path)
      const { error } = await updateClinicLogo(publicUrl)
      if (error) throw new Error(error)
      setLogoUrl(publicUrl)
      toast.success('Logo updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLogoUploading(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  async function handleRemoveLogo() {
    const { error } = await updateClinicLogo(null)
    if (error) { toast.error(error); return }
    setLogoUrl(null)
    toast.success('Logo removed')
  }

  // Compute current OR number display
  const orMatch = clinic.orSeriesStart.match(/^([A-Za-z\-_]+)(\d+)$/)
  const orPrefix = orMatch ? orMatch[1] : ''
  const orPadLength = orMatch ? orMatch[2].length : 6
  const formattedCurrentOr = orMatch
    ? orPrefix + String(clinic.orSeriesCurrentNumber).padStart(orPadLength, '0')
    : String(clinic.orSeriesCurrentNumber)

  async function handleSaveClinic() {
    setSavingClinic(true)
    try {
      const res = await fetch('/api/settings/clinic', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clinicName, ownerName, street, city, province, zip, phone, email,
          facebookPageUrl, messengerPageId,
          orSeriesStart,
          hasEmployees, sssEmployerNumber, philhealthEmployerNumber, pagibigEmployerNumber,
          accountantEmail,
          tin, rdoCode, corNumber, entityType,
          vatRegistered, vatRegistrationDate: vatRegistrationDate || null,
          filingMethod,
        }),
      })
      if (!res.ok) throw new Error('Failed to save clinic settings')
      toast.success('Clinic settings saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSavingClinic(false)
    }
  }

  // ── Services tab state ──
  const [services, setServices] = useState<ServiceItem[]>(initialServices)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [newServiceName, setNewServiceName] = useState('')
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null)
  const [deleteServiceError, setDeleteServiceError] = useState<string | null>(null)

  function startEdit(s: ServiceItem) {
    setEditingId(s.id)
    setEditingName(s.name)
  }

  async function saveEdit() {
    if (!editingId || !editingName.trim()) {
      setEditingId(null)
      return
    }
    try {
      const res = await fetch(`/api/settings/services/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      })
      if (!res.ok) throw new Error('Failed to update service')
      setServices(prev => prev.map(s => s.id === editingId ? { ...s, name: editingName.trim() } : s))
      toast.success('Service updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update service')
    } finally {
      setEditingId(null)
    }
  }

  async function handleAddService() {
    if (!newServiceName.trim()) return
    try {
      const res = await fetch('/api/settings/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newServiceName.trim() }),
      })
      if (!res.ok) throw new Error('Failed to add service')
      const added: ServiceItem = await res.json()
      setServices(prev => [...prev, added])
      setNewServiceName('')
      toast.success('Service added')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add service')
    }
  }

  async function handleToggleService(s: ServiceItem) {
    try {
      const res = await fetch(`/api/settings/services/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !s.isActive }),
      })
      if (!res.ok) throw new Error('Failed to update service')
      setServices(prev => prev.map(item => item.id === s.id ? { ...item, isActive: !item.isActive } : item))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update service')
    }
  }

  async function handleDeleteService(id: string) {
    setDeleteServiceError(null)
    try {
      const res = await fetch(`/api/settings/services/${id}`, { method: 'DELETE' })
      if (res.status === 409) {
        const data = await res.json()
        setDeleteServiceError(data.error ?? 'Cannot delete: service is in use')
        return
      }
      if (!res.ok) throw new Error('Failed to delete service')
      setServices(prev => prev.filter(s => s.id !== id))
      setDeletingServiceId(null)
      toast.success('Service deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete service')
    }
  }

  // ── Suppliers tab state ──
  const [suppliers, setSuppliers] = useState<SupplierItem[]>(initialSuppliers)
  const [supplierSheetOpen, setSupplierSheetOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null)
  const [deletingSupplier, setDeletingSupplier] = useState<string | null>(null)
  const [supplierDeleteError, setSupplierDeleteError] = useState<string | null>(null)

  async function handleSaveSupplier(data: SupplierFormData, id?: string) {
    try {
      if (id) {
        const res = await fetch(`/api/suppliers/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('Failed to update supplier')
        toast.success('Supplier updated')
      } else {
        const res = await fetch('/api/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error('Failed to add supplier')
        toast.success('Supplier added')
      }
      // Refetch suppliers
      const listRes = await fetch('/api/suppliers')
      if (listRes.ok) {
        const updated: SupplierItem[] = await listRes.json()
        setSuppliers(updated)
      }
      setSupplierSheetOpen(false)
      setEditingSupplier(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save supplier')
    }
  }

  async function handleDeleteSupplier(id: string) {
    setSupplierDeleteError(null)
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
      if (res.status === 409) {
        const data = await res.json()
        setSupplierDeleteError(data.error ?? 'Cannot delete: supplier is referenced by expenses')
        return
      }
      if (!res.ok) throw new Error('Failed to delete supplier')
      setSuppliers(prev => prev.filter(s => s.id !== id))
      setDeletingSupplier(null)
      toast.success('Supplier deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete supplier')
    }
  }

  function categoryLabel(val: string) {
    return SUPPLIER_CATEGORIES.find(c => c.value === val)?.label ?? val
  }

  const inputClass = 'w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring'

  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Tab selector */}
      <div className="flex rounded-xl border overflow-hidden">
        {(['clinic', 'services', 'suppliers', 'devices'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors capitalize ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'}`}
          >
            {t === 'clinic' ? 'Clinic' : t === 'services' ? 'Services' : t === 'suppliers' ? 'Suppliers' : 'Devices'}
          </button>
        ))}
      </div>

      {/* ── CLINIC TAB ── */}
      {tab === 'clinic' && (
        <div className="space-y-6">

          {/* ── Logo ── */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Clinic Logo</h2>
            <div className="rounded-2xl border border-border bg-muted/30 p-4 flex flex-col items-center gap-3">
              {logoUrl ? (
                <Image src={logoUrl} alt="Clinic logo" width={240} height={80} className="h-20 w-auto object-contain" unoptimized />
              ) : (
                <div className="h-20 w-full rounded-xl bg-muted flex items-center justify-center text-sm text-muted-foreground">No logo uploaded</div>
              )}
              <input ref={logoInputRef} type="file" accept="image/png, image/jpeg, image/jpg, image/gif, image/webp, image/heic, image/heif, image/svg+xml" className="hidden" onChange={handleLogoUpload} />
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="flex-1 min-h-[44px] rounded-xl border-2 border-blue-600 text-blue-700 text-sm font-semibold active:bg-blue-50 disabled:opacity-50"
                >
                  {logoUploading ? 'Uploading…' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="min-h-[44px] px-4 rounded-xl border border-destructive text-destructive text-sm font-semibold active:bg-destructive/10"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">PNG, JPG or SVG · max 5 MB</p>
            </div>
          </div>

          {/* ── Basic Info ── */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Basic Info</h2>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Clinic Name</label>
              <input value={clinicName} onChange={e => setClinicName(e.target.value)} className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Owner / Dentist Name</label>
              <input value={ownerName} onChange={e => setOwnerName(e.target.value)} className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Street Address</label>
              <input value={street} onChange={e => setStreet(e.target.value)} className={`${inputClass} mt-1`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">City</label>
                <input value={city} onChange={e => setCity(e.target.value)} className={`${inputClass} mt-1`} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Province</label>
                <input value={province} onChange={e => setProvince(e.target.value)} className={`${inputClass} mt-1`} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">ZIP Code</label>
              <input value={zip} onChange={e => setZip(e.target.value)} className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Clinic Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Accountant Email</label>
              <input
                value={accountantEmail}
                onChange={e => setAccountantEmail(e.target.value)}
                type="email"
                placeholder="cpa@youraccountant.com"
                className={`${inputClass} mt-1`}
              />
              <div className="mt-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-emerald-800">📊 Quarterly Auto-Report</p>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Once set, your accountant will automatically receive a detailed financial summary by email at the start of every quarter — <strong>January 1, April 1, July 1, and October 1</strong>. Each email includes a revenue + VAT summary and two attached CSV spreadsheets (invoices and expenses) ready for BIR filing. No manual work needed.
                </p>
              </div>
            </div>
          </div>

          {/* ── Social & Messenger ── */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Social & Messenger</h2>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Facebook Page URL</label>
              <input
                value={facebookPageUrl}
                onChange={e => setFacebookPageUrl(e.target.value)}
                placeholder="https://facebook.com/yourclinic"
                className={`${inputClass} mt-1`}
              />
              <div className="mt-2 rounded-xl bg-muted/60 border border-border px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-foreground">How to find your Facebook Page link</p>
                <ol className="text-xs text-muted-foreground leading-relaxed space-y-1 list-decimal list-inside">
                  <li>Open Facebook and go to your clinic&apos;s page (the one your patients follow)</li>
                  <li>Look at the address bar at the top of your browser — it will show something like <span className="font-mono bg-muted px-1 rounded">facebook.com/YourClinicName</span></li>
                  <li>Copy that entire address and paste it here</li>
                </ol>
                <p className="text-xs text-muted-foreground">Not sure which page? Search for your clinic name on Facebook — it&apos;s the page with the blue checkmark or the one your patients message you on.</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Messenger Page ID</label>
              <input
                value={messengerPageId}
                onChange={e => setMessengerPageId(e.target.value)}
                placeholder="e.g. 123456789012345"
                className={`${inputClass} mt-1`}
              />
              <div className="mt-2 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-blue-800">How to find your Page ID</p>
                <ol className="text-xs text-blue-700 leading-relaxed space-y-1 list-decimal list-inside">
                  <li>Go to your clinic&apos;s Facebook Page in a browser</li>
                  <li>Click the <strong>About</strong> tab on your page</li>
                  <li>Scroll down to the <strong>Page Transparency</strong> section</li>
                  <li>Your Page ID is the long number listed there (e.g. 123456789012345)</li>
                </ol>
                <p className="text-xs text-blue-600">Copy only the numbers — no spaces or dashes. This is used to route patient Messenger messages to your clinic.</p>
              </div>
            </div>
          </div>

          {/* ── OR Series ── */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Official Receipts</h2>
            {clinic.orSeriesCurrentNumber > 1 && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
                OR series already in use (#{formattedCurrentOr} issued). Changing the prefix affects future receipts only.
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Official Receipt Series</label>
              <input value={orSeriesStart} onChange={e => setOrSeriesStart(e.target.value)} placeholder="e.g. OR-000001" className={`${inputClass} mt-1`} />
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Every time you issue a receipt to a patient, it gets a unique number — like OR-000001, OR-000002, and so on. This is required by the BIR (Bureau of Internal Revenue). Just type what you want the first receipt to look like, for example <span className="font-mono bg-muted px-1 rounded">OR-000001</span>, and Sigurado will automatically count up from there every time you print a receipt.
              </p>
            </div>
          </div>

          {/* ── Payroll & Gov't Numbers ── */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payroll</h2>
            <div className="flex items-center justify-between min-h-[48px] rounded-xl border px-4">
              <span className="text-sm font-medium">Clinic has employees</span>
              <button
                onClick={() => setHasEmployees(v => !v)}
                className={`relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors ${hasEmployees ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${hasEmployees ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {hasEmployees && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">SSS Employer Number <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <input value={sssEmployerNumber} onChange={e => setSssEmployerNumber(e.target.value)} placeholder="03-XXXXXXX-X" className={`${inputClass} mt-1`} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">PhilHealth Employer Number <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <input value={philhealthEmployerNumber} onChange={e => setPhilhealthEmployerNumber(e.target.value)} placeholder="XX-000000000-X" className={`${inputClass} mt-1`} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Pag-IBIG Employer Number <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <input value={pagibigEmployerNumber} onChange={e => setPagibigEmployerNumber(e.target.value)} placeholder="XXXX-XXXX-XXXX" className={`${inputClass} mt-1`} />
                </div>
              </>
            )}
          </div>

          {/* ── BIR & Tax ── */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">BIR (Bureau of Internal Revenue) & Tax</h2>
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <p className="text-xs text-amber-800 leading-relaxed">These should match your BIR COR (Certificate of Registration) exactly. If you made a typo or something has changed — like your VAT (Value Added Tax) status or entity type — correct it here. Changes update your records in Sigurado only and do not notify the BIR.</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">TIN (Tax Identification Number)</label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-1">Your 12-digit tax ID — printed on your COR (Certificate of Registration).</p>
              <input value={tin} onChange={e => setTin(e.target.value)} placeholder="XXX-XXX-XXX-XXX" className={`${inputClass}`} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">RDO (Revenue District Office) Code</label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-1">The BIR branch code for your area — printed on your COR (Certificate of Registration). Example: 044, 083.</p>
              <input value={rdoCode} onChange={e => setRdoCode(e.target.value)} placeholder="e.g. 083" className={`${inputClass}`} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">COR (Certificate of Registration) Number</label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-1">The reference number at the top of your BIR Certificate of Registration document.</p>
              <input value={corNumber} onChange={e => setCorNumber(e.target.value)} placeholder="e.g. RC0000123456" className={`${inputClass}`} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Entity Type</label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-1">How your business is legally structured. Most individual dentists are Sole Proprietor.</p>
              <select value={entityType} onChange={e => setEntityType(e.target.value)} className={`${inputClass}`}>
                <option value="SOLE_PROPRIETOR">Sole Proprietor — I own and run it myself</option>
                <option value="PARTNERSHIP">Partnership — two or more people own it together</option>
                <option value="CORPORATION">Corporation — registered as a company</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Filing Method</label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-1">How you submit tax returns to the BIR (Bureau of Internal Revenue). Not sure? Most small clinics use eBIRForms.</p>
              <select value={filingMethod} onChange={e => setFilingMethod(e.target.value)} className={`${inputClass}`}>
                <option value="EBIRFORMS">eBIRForms (Electronic BIR Forms) — fill out forms on computer, submit online</option>
                <option value="EFPS">eFPS (Electronic Filing and Payment System) — for larger businesses</option>
              </select>
            </div>
            <div className="flex items-start justify-between min-h-[48px] gap-4 rounded-xl border px-4 py-3">
              <div className="flex-1">
                <p className="text-sm font-medium">VAT (Value Added Tax) Registered</p>
                <p className="text-xs text-muted-foreground mt-0.5">Turn ON if your clinic is registered for VAT (Value Added Tax) with the BIR (Bureau of Internal Revenue). Mandatory once annual revenue exceeds ₱3 million.</p>
              </div>
              <button
                type="button"
                onClick={() => setVatRegistered(v => !v)}
                className={`relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors mt-1 ${vatRegistered ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${vatRegistered ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {vatRegistered && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">VAT (Value Added Tax) Registration Date</label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-1">The date you officially became VAT registered — printed on your VAT certificate or COR (Certificate of Registration).</p>
                <input type="date" value={vatRegistrationDate} onChange={e => setVatRegistrationDate(e.target.value)} className={`${inputClass}`} />
              </div>
            )}
            <div className="rounded-xl border divide-y">
              <div className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">Next OR (Official Receipt) Number</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">The number that will be printed on the next OR (Official Receipt) you issue to a patient. Sigurado automatically counts this up every time you print a receipt.</p>
                </div>
                <span className="text-sm font-medium font-mono shrink-0">{formattedCurrentOr}</span>
              </div>
              <div className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">Enrollment Date</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">The date your clinic was registered on Sigurado. No financial records can be entered before this date — this is your Day One.</p>
                </div>
                <span className="text-sm font-medium shrink-0">
                  {new Date(clinic.enrollmentDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveClinic}
            disabled={savingClinic}
            className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50"
          >
            {savingClinic ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* ── SERVICES TAB ── */}
      {tab === 'services' && (
        <div className="space-y-2">
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No services yet.</p>
          ) : (
            services.map(s => (
              <div key={s.id}>
                <div className={`rounded-xl border p-3 flex items-center gap-3 ${!s.isActive ? 'opacity-50' : ''}`}>
                  {editingId === s.id ? (
                    <input
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit() }}
                      autoFocus
                      className="flex-1 min-h-[40px] rounded border border-input px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : (
                    <span
                      className="flex-1 text-sm cursor-pointer py-1"
                      onClick={() => startEdit(s)}
                    >
                      {s.name}
                    </span>
                  )}
                  {s.category && (
                    <span className="text-xs text-muted-foreground shrink-0">{s.category}</span>
                  )}
                  {/* Active toggle */}
                  <button
                    onClick={() => handleToggleService(s)}
                    className={`relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors ${s.isActive ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${s.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={() => { setDeletingServiceId(s.id); setDeleteServiceError(null) }}
                    className="text-muted-foreground min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                    aria-label="Delete service"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9h8l1-9" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                {/* Delete confirm */}
                {deletingServiceId === s.id && (
                  <div className="mt-1 rounded-xl border border-red-200 bg-red-50 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-red-800">Delete &ldquo;{s.name}&rdquo;?</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setDeletingServiceId(null); setDeleteServiceError(null) }}
                          className="text-xs px-3 py-1.5 rounded-lg border min-h-[36px]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteService(s.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white min-h-[36px]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {deleteServiceError && (
                      <p className="text-xs text-red-700">{deleteServiceError}</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Add row */}
          <div className="flex gap-2 mt-2">
            <input
              value={newServiceName}
              onChange={e => setNewServiceName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddService() }}
              placeholder="New service name…"
              className="flex-1 min-h-[44px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleAddService}
              disabled={!newServiceName.trim()}
              className="min-h-[44px] px-4 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* ── SUPPLIERS TAB ── */}
      {tab === 'suppliers' && (
        <div className="space-y-3">
          <button
            onClick={() => { setEditingSupplier(null); setSupplierSheetOpen(true) }}
            className="w-full min-h-[48px] rounded-xl border-2 border-dashed border-primary text-primary text-sm font-medium flex items-center justify-center gap-2"
          >
            + Add Supplier
          </button>

          {suppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No suppliers yet.</p>
          ) : (
            suppliers.map(s => (
              <div key={s.id}>
                <div
                  className="rounded-xl border p-4 cursor-pointer active:opacity-80"
                  onClick={() => { setEditingSupplier(s); setSupplierSheetOpen(true) }}
                  onContextMenu={ev => { ev.preventDefault(); setDeletingSupplier(s.id); setSupplierDeleteError(null) }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{s.name}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {categoryLabel(s.category)}
                        </span>
                        {s.vatRegistered && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">VAT Registered</span>
                        )}
                        {s.tin && (
                          <span className="text-xs text-muted-foreground">TIN: {s.tin}</span>
                        )}
                      </div>
                      {s.address && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{s.address}</p>
                      )}
                    </div>
                  </div>
                </div>
                {/* Delete confirm */}
                {deletingSupplier === s.id && (
                  <div className="mt-1 rounded-xl border border-red-200 bg-red-50 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-red-800">Delete &ldquo;{s.name}&rdquo;?</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setDeletingSupplier(null); setSupplierDeleteError(null) }}
                          className="text-xs px-3 py-1.5 rounded-lg border min-h-[36px]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(s.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white min-h-[36px]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {supplierDeleteError && (
                      <p className="text-xs text-red-700">{supplierDeleteError}</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          <SupplierSheet
            open={supplierSheetOpen}
            onClose={() => { setSupplierSheetOpen(false); setEditingSupplier(null) }}
            onSave={(data) => handleSaveSupplier(data, editingSupplier?.id)}
            initial={editingSupplier ?? undefined}
          />
        </div>
      )}

      {/* ── DEVICES TAB ── */}
      {tab === 'devices' && (
        <div className="space-y-6">
          <PrinterSection clinicName={clinicName} clinicLogoUrl={logoUrl} />
        </div>
      )}
    </div>
  )
}
