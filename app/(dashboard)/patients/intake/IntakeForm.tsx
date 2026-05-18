'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitIntake, type IntakeFormData } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const GUARDIAN_RELATIONSHIPS = [
  'Mother',
  'Father',
  'Legal Guardian',
  'Grandparent',
  'Sibling (18+)',
  'Other',
]

export function IntakeForm({ clinicName }: { clinicName: string }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [medicalHistory, setMedicalHistory] = useState('')
  const [medications, setMedications] = useState('')
  const [allergies, setAllergies] = useState('')
  const [isMinor, setIsMinor] = useState(false)
  const [guardianName, setGuardianName] = useState('')
  const [guardianRelationship, setGuardianRelationship] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consentGiven) {
      toast.error('Patient must consent before submitting.')
      return
    }
    setSubmitting(true)

    const data: IntakeFormData = {
      firstName, lastName, dateOfBirth, address, phone,
      email: email || undefined,
      medicalHistory, medications, allergies,
      isMinor,
      guardianName: isMinor ? guardianName : undefined,
      guardianRelationship: isMinor ? guardianRelationship : undefined,
    }

    const result = await submitIntake(data)
    setSubmitting(false)

    if (result.success) {
      setDone(true)
    } else {
      toast.error('Something went wrong. Please try again.')
    }
  }

  function handleReset() {
    setFirstName(''); setLastName(''); setDateOfBirth(''); setAddress('')
    setPhone(''); setEmail(''); setMedicalHistory(''); setMedications('')
    setAllergies(''); setIsMinor(false); setGuardianName('')
    setGuardianRelationship(''); setConsentGiven(false); setDone(false)
    formRef.current?.scrollTo({ top: 0 })
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <div className="text-5xl">✓</div>
        <div>
          <h2 className="text-xl font-bold">Thank you, {firstName}!</h2>
          <p className="text-muted-foreground mt-1">Your information has been recorded.</p>
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <Button variant="outline" className="flex-1 min-h-[48px]" onClick={() => router.push('/patients')}>
            View Patients
          </Button>
          <Button className="flex-1 min-h-[48px]" onClick={handleReset}>
            New Patient
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-6 pb-10">

      {/* Personal Info */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold border-b pb-2">Personal Information</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firstName">First Name *</Label>
            <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required className="min-h-[48px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} required className="min-h-[48px]" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dob">Date of Birth *</Label>
          <Input id="dob" type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required className="min-h-[48px]" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address">Address *</Label>
          <Input id="address" value={address} onChange={e => setAddress(e.target.value)} required className="min-h-[48px]" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="min-h-[48px]" placeholder="+63 912 345 6789" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email (optional)</Label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="min-h-[48px]" />
        </div>
      </section>

      {/* Minor Guardian */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <input
            id="isMinor"
            type="checkbox"
            checked={isMinor}
            onChange={e => setIsMinor(e.target.checked)}
            className="h-5 w-5 rounded"
          />
          <Label htmlFor="isMinor">Patient is a minor (under 18)</Label>
        </div>

        {isMinor && (
          <div className="flex flex-col gap-3 pl-2 border-l-2 border-muted">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="guardianName">Guardian Full Name *</Label>
              <Input id="guardianName" value={guardianName} onChange={e => setGuardianName(e.target.value)} required={isMinor} className="min-h-[48px]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="guardianRel">Relationship to Patient *</Label>
              <select
                id="guardianRel"
                value={guardianRelationship}
                onChange={e => setGuardianRelationship(e.target.value)}
                required={isMinor}
                className="min-h-[48px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select relationship</option>
                {GUARDIAN_RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        )}
      </section>

      {/* Medical Info */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold border-b pb-2">Medical Information</h2>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="medHistory">Medical History</Label>
          <textarea
            id="medHistory"
            value={medicalHistory}
            onChange={e => setMedicalHistory(e.target.value)}
            placeholder="e.g. diabetes, hypertension, heart condition..."
            rows={3}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="medications">Current Medications</Label>
          <textarea
            id="medications"
            value={medications}
            onChange={e => setMedications(e.target.value)}
            placeholder="List any medications currently taking..."
            rows={2}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="allergies">Known Allergies</Label>
          <textarea
            id="allergies"
            value={allergies}
            onChange={e => setAllergies(e.target.value)}
            placeholder="e.g. penicillin, latex, aspirin..."
            rows={2}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
          />
        </div>
      </section>

      {/* RA 10173 Consent */}
      <section className="flex flex-col gap-3 bg-muted/50 rounded-xl p-4">
        <h2 className="text-base font-semibold">Data Privacy Consent</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          In compliance with the <strong>Data Privacy Act of 2012 (RA 10173)</strong>, {clinicName} collects your personal and medical information solely for the purpose of providing dental care. Your data is stored securely, will not be shared with third parties without your consent, and may be retained for up to 10 years as required by law.
        </p>
        <div className="flex items-start gap-3">
          <input
            id="consent"
            type="checkbox"
            checked={consentGiven}
            onChange={e => setConsentGiven(e.target.checked)}
            className="h-5 w-5 rounded mt-0.5 shrink-0"
          />
          <Label htmlFor="consent" className="text-sm leading-relaxed">
            I have read and understood the above. I consent to {clinicName} collecting and processing my personal and medical information for dental care purposes.
          </Label>
        </div>
      </section>

      <Button
        type="submit"
        disabled={submitting || !consentGiven}
        className="w-full min-h-[56px] text-base"
      >
        {submitting ? 'Submitting…' : 'Submit Intake Form'}
      </Button>
    </form>
  )
}
