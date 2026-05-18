'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { PrinterSection } from './PrinterSection'

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
  name: string
  ownerName: string
  street: string
  city: string
  province: string
  zip: string
  phone: string
  email: string
  tin: string
  vatRegistered: boolean
  orSeriesStart: string
  orSeriesCurrentNumber: number
  enrollmentDate: string
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
  const [orSeriesStart, setOrSeriesStart] = useState(clinic.orSeriesStart)
  const [savingClinic, setSavingClinic] = useState(false)

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
        body: JSON.stringify({ name: clinicName, ownerName, street, city, province, zip, phone, email, orSeriesStart }),
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
        <div className="space-y-4">
          {clinic.orSeriesCurrentNumber > 1 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              Your OR series is already in use (OR #{clinic.orSeriesCurrentNumber} issued). Changing the OR Series prefix will affect future receipts only.
            </div>
          )}

          <div className="space-y-3">
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
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" className={`${inputClass} mt-1`} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">OR Series Prefix (e.g. OR-000001)</label>
              <input value={orSeriesStart} onChange={e => setOrSeriesStart(e.target.value)} className={`${inputClass} mt-1`} />
            </div>
          </div>

          {/* Read-only info */}
          <div className="rounded-xl border divide-y">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-muted-foreground">TIN</span>
              <span className="text-sm font-medium">{clinic.tin}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-muted-foreground">VAT Status</span>
              <span className="text-sm font-medium">{clinic.vatRegistered ? 'VAT Registered' : 'Non-VAT'}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-muted-foreground">Current OR Number</span>
              <span className="text-sm font-medium font-mono">{formattedCurrentOr}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-muted-foreground">Enrollment Date</span>
              <span className="text-sm font-medium">
                {new Date(clinic.enrollmentDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
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
          <PrinterSection />
        </div>
      )}
    </div>
  )
}
