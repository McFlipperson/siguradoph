'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import Image from 'next/image'
import { PrinterSection } from './PrinterSection'
import { createClient } from '@/lib/supabase-browser'
import { updateClinicLogo, updateClinicSignature } from './actions'
import { SignaturePad } from '@/components/SignaturePad'

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
  dpoName: string
  dpoEmail: string
  dpoPhone: string
  npcRegistrationNumber: string
  npcRegistrationDate: string | null
  prcLicenseNo: string
  signatureUrl: string | null
  gcashNumber: string
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

type StaffMember = {
  id: string
  email: string
  isActive: boolean
  createdAt: string
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
  initialStaff,
}: {
  clinic: ClinicData
  initialServices: ServiceItem[]
  initialSuppliers: SupplierItem[]
  initialStaff: StaffMember[]
}) {
  const [tab, setTab] = useState<'clinic' | 'services' | 'suppliers' | 'devices' | 'staff'>('clinic')

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
  // TAX_MODULE — kept so values are preserved on save; hidden from UI via lib/features.ts
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hasEmployees, setHasEmployees] = useState(clinic.hasEmployees)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sssEmployerNumber, setSssEmployerNumber] = useState(clinic.sssEmployerNumber)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [philhealthEmployerNumber, setPhilhealthEmployerNumber] = useState(clinic.philhealthEmployerNumber)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pagibigEmployerNumber, setPagibigEmployerNumber] = useState(clinic.pagibigEmployerNumber)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [accountantEmail, setAccountantEmail] = useState(clinic.accountantEmail)
  // Clinic's own DPO + NPC registration (clinic = PIC under RA 10173)
  const [dpoName, setDpoName] = useState(clinic.dpoName)
  const [dpoEmail, setDpoEmail] = useState(clinic.dpoEmail)
  const [dpoPhone, setDpoPhone] = useState(clinic.dpoPhone)
  const [npcRegistrationNumber, setNpcRegistrationNumber] = useState(clinic.npcRegistrationNumber)
  const [npcRegistrationDate, setNpcRegistrationDate] = useState(clinic.npcRegistrationDate ?? '')
  const [prcLicenseNo, setPrcLicenseNo] = useState(clinic.prcLicenseNo)
  const [signatureUrl, setSignatureUrl] = useState<string | null>(clinic.signatureUrl)
  const [gcashNumber, setGcashNumber] = useState(clinic.gcashNumber)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tin, setTin] = useState(clinic.tin)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [rdoCode, setRdoCode] = useState(clinic.rdoCode)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [corNumber, setCorNumber] = useState(clinic.corNumber)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [entityType, setEntityType] = useState(clinic.entityType)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [vatRegistered, setVatRegistered] = useState(clinic.vatRegistered)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [vatRegistrationDate, setVatRegistrationDate] = useState(clinic.vatRegistrationDate ?? '')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          dpoName, dpoEmail, dpoPhone, npcRegistrationNumber,
          npcRegistrationDate: npcRegistrationDate || null,
          prcLicenseNo,
          gcashNumber,
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

  // ── Staff tab state ──
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false)

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      const res = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to send invite'); return }
      toast.success(`Invite sent to ${inviteEmail.trim()}`)
      setInviteEmail('')
      setInviteSheetOpen(false)
      // Refresh list
      const listRes = await fetch('/api/staff')
      if (listRes.ok) setStaff(await listRes.json())
    } catch {
      toast.error('Failed to send invite')
    } finally {
      setInviting(false)
    }
  }

  async function handleToggleStaff(member: StaffMember) {
    try {
      const res = await fetch(`/api/staff/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !member.isActive }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setStaff(prev => prev.map(s => s.id === member.id ? { ...s, isActive: !s.isActive } : s))
      toast.success(member.isActive ? 'Access removed' : 'Access restored')
    } catch {
      toast.error('Failed to update staff access')
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
        {(['clinic', 'services', 'suppliers', 'devices', 'staff'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-[11px] font-medium transition-colors capitalize ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'}`}
          >
            {t === 'clinic' ? 'Clinic' : t === 'services' ? 'Services' : t === 'suppliers' ? 'Suppliers' : t === 'devices' ? 'Devices' : 'Staff'}
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
            {/* TAX_MODULE — Accountant Email hidden. Re-enable in lib/features.ts.
            <div>
              <label className="text-xs font-medium text-muted-foreground">Accountant Email</label>
              <input value={accountantEmail} onChange={e => setAccountantEmail(e.target.value)}
                type="email" placeholder="cpa@youraccountant.com" className={`${inputClass} mt-1`} />
              <div className="mt-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-emerald-800">📊 Quarterly Auto-Report</p>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Once set, your accountant will automatically receive a detailed financial summary
                  by email at the start of every quarter. No manual work needed.
                </p>
              </div>
            </div>
            */}
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
                Every time you issue a receipt to a patient, it gets a unique number — like OR-000001, OR-000002, and so on. Just type what you want the first receipt to look like, for example <span className="font-mono bg-muted px-1 rounded">OR-000001</span>, and Sigurado will automatically count up from there every time you print a receipt.
              </p>
            </div>
          </div>

          {/* TAX_MODULE — Payroll & Gov't Numbers section hidden. Re-enable in lib/features.ts.
          <div className="space-y-3">
            <h2>Payroll</h2>
            ... Clinic has employees toggle + SSS/PhilHealth/Pag-IBIG employer numbers ...
          </div>
          */}

          {/* TAX_MODULE — BIR & Tax section hidden. Re-enable in lib/features.ts.
          <div className="space-y-3">
            <h2>BIR (Bureau of Internal Revenue) & Tax</h2>
            ... TIN, RDO Code, COR Number, Entity Type, Filing Method, VAT toggle ...
            ... Next OR number and Enrollment Date info tiles ...
          </div>
          */}

          {/* Enrollment Date — shown independently of tax module */}
          <div className="rounded-xl border divide-y">
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

          {/* Data Privacy — the CLINIC's own DPO (clinic = Personal Information Controller) */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data Privacy (RA 10173)</h2>
            <div className="rounded-lg bg-muted/40 border px-4 py-3 text-xs text-muted-foreground leading-relaxed">
              Your clinic is the <strong>Personal Information Controller</strong>. Under RA 10173 you must
              appoint your own Data Protection Officer (DPO) and, if you process the data of 1,000+ patients,
              register with the National Privacy Commission. Record your DPO and registration here — this is
              the information you provide to the NPC. (Sigurado has its own separate DPO as your processor.)
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">DPO Full Name</label>
              <input value={dpoName} onChange={e => setDpoName(e.target.value)} placeholder="e.g. Dr. Maria Santos" className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">DPO Email</label>
              <input value={dpoEmail} onChange={e => setDpoEmail(e.target.value)} inputMode="email" placeholder="dpo@yourclinic.ph" className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">DPO Phone</label>
              <input value={dpoPhone} onChange={e => setDpoPhone(e.target.value)} inputMode="tel" placeholder="+63 9XX XXX XXXX" className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">NPC Registration Number <span className="font-normal">(if registered)</span></label>
              <input value={npcRegistrationNumber} onChange={e => setNpcRegistrationNumber(e.target.value)} placeholder="e.g. PIC-XXXXXXXX" className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">NPC Registration Date</label>
              <input type="date" value={npcRegistrationDate ? npcRegistrationDate.slice(0, 10) : ''} onChange={e => setNpcRegistrationDate(e.target.value)} className={`${inputClass} mt-1`} />
            </div>
          </div>

          {/* GCash Number — used to auto-match incoming subscription payments */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subscription Payment</h2>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Your GCash Number</label>
              <input
                value={gcashNumber}
                onChange={e => setGcashNumber(e.target.value)}
                inputMode="tel"
                placeholder="e.g. 09171234567"
                className={`${inputClass} mt-1`}
              />
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                When you pay your Sigurado subscription via GCash, we match the payment to your
                account using this number. Enter the number you send GCash payments from.
              </p>
            </div>
          </div>

          {/* Dentist credentials — printed on dental certificates */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dentist Credentials</h2>
            <div>
              <label className="text-xs font-medium text-muted-foreground">PRC License No.</label>
              <input value={prcLicenseNo} onChange={e => setPrcLicenseNo(e.target.value)} placeholder="e.g. 0123456" className={`${inputClass} mt-1`} />
              <p className="text-xs text-muted-foreground mt-1">Printed on every dental certificate you issue.</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Dentist Signature</label>
              <p className="text-xs text-muted-foreground mb-2">Saved automatically. Printed above the dentist&apos;s name on certificates.</p>
              <SignaturePad
                value={signatureUrl}
                onChange={async (url) => {
                  setSignatureUrl(url)
                  const res = await updateClinicSignature(url)
                  if (res.error) toast.error(res.error)
                  else toast.success(url ? 'Signature saved' : 'Signature removed')
                }}
              />
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
          <PrinterSection
            clinicName={clinicName}
            clinicLogoUrl={logoUrl}
            clinicAddress={`${street}, ${city}, ${province} ${zip}`}
            clinicTin={tin}
          />
        </div>
      )}

      {/* ── STAFF TAB ── */}
      {tab === 'staff' && (
        <div className="space-y-3">
          <div className="rounded-lg bg-muted/40 border px-4 py-3 text-xs text-muted-foreground leading-relaxed">
            Staff members get access to patients, visits, payments, loyalty cards, scheduling, reminders, and expenses.
            They cannot view reports, payroll, compliance, or settings.
          </div>

          <button
            onClick={() => setInviteSheetOpen(true)}
            className="w-full min-h-[48px] rounded-xl border-2 border-dashed border-primary text-primary text-sm font-medium flex items-center justify-center gap-2"
          >
            + Invite Staff
          </button>

          {staff.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No staff invited yet.</p>
          ) : (
            staff.map(member => (
              <div key={member.id} className={`rounded-xl border p-4 flex items-center gap-3 ${!member.isActive ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {member.isActive ? 'Active' : 'Deactivated'} · Invited {new Date(member.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleStaff(member)}
                  className={`relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors ${member.isActive ? 'bg-primary' : 'bg-muted'}`}
                  title={member.isActive ? 'Remove access' : 'Restore access'}
                >
                  <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${member.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))
          )}

          {/* Invite sheet */}
          {inviteSheetOpen && (
            <div className="fixed inset-0 z-50 flex flex-col justify-end">
              <div className="absolute inset-0 bg-black/40" onClick={() => setInviteSheetOpen(false)} />
              <div className="relative rounded-t-2xl bg-background">
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>
                <div className="flex items-center justify-between px-4 pb-3">
                  <h2 className="text-base font-semibold">Invite Staff</h2>
                  <button onClick={() => setInviteSheetOpen(false)} className="p-2 text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
                </div>
                <div className="px-4 pb-8 space-y-3">
                  <p className="text-sm text-muted-foreground">They&apos;ll receive an email to set their password and get access to the clinic app.</p>
                  <input
                    type="email"
                    inputMode="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleInvite() }}
                    placeholder="secretary@email.com"
                    className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                  <button
                    onClick={handleInvite}
                    disabled={!inviteEmail.trim() || inviting}
                    className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50"
                  >
                    {inviting ? 'Sending…' : 'Send Invite'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
