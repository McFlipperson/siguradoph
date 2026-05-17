'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPatient } from '../actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

const RELATIONSHIPS = [
  'Mother',
  'Father',
  'Legal Guardian',
  'Grandparent',
  'Sibling 18+',
  'Other',
]

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

const inputClass =
  'w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'
const textareaClass =
  'w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-none'

export default function NewPatientForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    phone: '',
    email: '',
    medicalHistory: '',
    medications: '',
    allergies: '',
  })

  const [consentGiven, setConsentGiven] = useState(false)
  const [isMinor, setIsMinor] = useState(false)
  const [guardianName, setGuardianName] = useState('')
  const [guardianRelationship, setGuardianRelationship] = useState(RELATIONSHIPS[0])
  const [guardianPhone, setGuardianPhone] = useState('')

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const requiredFilled =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.dateOfBirth &&
    form.address.trim() &&
    form.phone.trim() &&
    form.medicalHistory.trim() &&
    form.medications.trim() &&
    form.allergies.trim() &&
    (!isMinor || (guardianName.trim() && guardianPhone.trim()))

  const canSubmit = consentGiven && !!requiredFilled && !isPending

  const [submitError, setSubmitError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitError(null)
    startTransition(async () => {
      try {
        const patientId = await createPatient({
          ...form,
          isMinor,
          guardianName: isMinor ? guardianName : undefined,
          guardianRelationship: isMinor ? guardianRelationship : undefined,
          guardianPhone: isMinor ? guardianPhone : undefined,
        })
        router.push(`/patients/${patientId}`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong.'
        if (msg.startsWith('DAY_ONE')) {
          setSubmitError('This clinic is not yet accepting records. Please check the enrollment date in Settings.')
        } else {
          setSubmitError('Could not save patient. Please try again.')
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-8">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" required>
              <input
                className={inputClass}
                value={form.firstName}
                onChange={set('firstName')}
                required
                autoComplete="given-name"
              />
            </Field>
            <Field label="Last Name" required>
              <input
                className={inputClass}
                value={form.lastName}
                onChange={set('lastName')}
                required
                autoComplete="family-name"
              />
            </Field>
          </div>

          <Field label="Date of Birth" required>
            <input
              type="date"
              className={inputClass}
              value={form.dateOfBirth}
              onChange={set('dateOfBirth')}
              max={today}
              required
            />
          </Field>

          <Field label="Address" required>
            <textarea
              className={textareaClass}
              rows={2}
              value={form.address}
              onChange={set('address')}
              required
            />
          </Field>

          <Field label="Phone" required>
            <input
              type="tel"
              className={inputClass}
              value={form.phone}
              onChange={set('phone')}
              required
              autoComplete="tel"
            />
          </Field>

          <Field label="Email" hint="Optional">
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medical Background</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field label="Medical History" required>
            <textarea
              className={textareaClass}
              rows={3}
              value={form.medicalHistory}
              onChange={set('medicalHistory')}
              placeholder="e.g. diabetes, hypertension — write None if not applicable"
              required
            />
          </Field>

          <Field label="Current Medications" required>
            <textarea
              className={textareaClass}
              rows={3}
              value={form.medications}
              onChange={set('medications')}
              placeholder="List all medications. Write None if not applicable"
              required
            />
          </Field>

          <Field label="Allergies" required>
            <textarea
              className={textareaClass}
              rows={2}
              value={form.allergies}
              onChange={set('allergies')}
              placeholder="e.g. penicillin, latex. Write None if not applicable"
              required
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consent & Guardian</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* Consent toggle */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={consentGiven}
                onClick={() => setConsentGiven((v) => !v)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  consentGiven ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                    consentGiven ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <span className="text-sm font-medium">Patient has given verbal consent</span>
            </div>
            <p className="text-xs text-muted-foreground pl-0">
              By enabling this, you confirm the patient has been informed of and verbally agreed to
              the clinic&apos;s data privacy, treatment, and anesthesia consent terms.
            </p>
          </div>

          {/* Minor toggle */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isMinor}
                onClick={() => setIsMinor((v) => !v)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isMinor ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                    isMinor ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <span className="text-sm font-medium">Patient is under 18?</span>
            </div>

            {isMinor && (
              <div className="flex flex-col gap-3 pl-0">
                <Field label="Guardian Name" required>
                  <input
                    className={inputClass}
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    required={isMinor}
                  />
                </Field>
                <Field label="Relationship" required>
                  <select
                    className={inputClass}
                    value={guardianRelationship}
                    onChange={(e) => setGuardianRelationship(e.target.value)}
                  >
                    {RELATIONSHIPS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Guardian Phone" required>
                  <input
                    type="tel"
                    className={inputClass}
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    required={isMinor}
                  />
                </Field>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {submitError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {submitError}
        </div>
      )}

      <Button
        type="submit"
        disabled={!canSubmit || isPending}
        className="w-full min-h-[56px] text-base"
      >
        {isPending ? 'Saving…' : 'Save Patient'}
      </Button>
    </form>
  )
}
