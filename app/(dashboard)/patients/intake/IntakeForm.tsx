'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'react-qr-code'
import { submitIntake, type IntakeFormData, type ReminderChannel } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const GUARDIAN_RELATIONSHIPS = [
  'Mother', 'Father', 'Legal Guardian', 'Grandparent', 'Sibling (18+)', 'Other',
]

const REMINDER_OPTIONS: Array<{
  channel: ReminderChannel
  emoji: string
  label: string
  description: string
}> = [
  { channel: 'MESSENGER', emoji: '📱', label: 'Messenger',  description: 'Via Facebook Messenger' },
  { channel: 'EMAIL',     emoji: '📧', label: 'Email',      description: 'To your email address' },
  { channel: 'SMS',       emoji: '📞', label: 'SMS',        description: 'To your phone number' },
  { channel: 'NONE',      emoji: '✕',  label: 'No reminders', description: 'Skip reminders' },
]

const FB_PAGE_ID = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ID ?? ''

export function IntakeForm({ clinicName, clinicFacebookPageUrl }: { clinicName: string; clinicFacebookPageUrl?: string | null }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  // step: 'form' → 'reminders' → 'done'
  const [step, setStep] = useState<'form' | 'reminders' | 'done'>('form')

  // Patient details
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

  // Reminder
  const [reminderChannel, setReminderChannel] = useState<ReminderChannel | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function goToReminders(e: React.FormEvent) {
    e.preventDefault()
    if (!consentGiven) {
      toast.error('Patient must consent before continuing.')
      return
    }
    setStep('reminders')
    window.scrollTo({ top: 0 })
  }

  async function handleSubmit() {
    if (!reminderChannel) {
      toast.error('Please select a reminder preference.')
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
      reminderChannel,
    }

    const result = await submitIntake(data)
    setSubmitting(false)

    if (result.success) {
      setStep('done')
    } else {
      toast.error('Something went wrong. Please try again.')
    }
  }

  function handleReset() {
    setFirstName(''); setLastName(''); setDateOfBirth(''); setAddress('')
    setPhone(''); setEmail(''); setMedicalHistory(''); setMedications('')
    setAllergies(''); setIsMinor(false); setGuardianName('')
    setGuardianRelationship(''); setConsentGiven(false)
    setReminderChannel(null); setStep('form')
    window.scrollTo({ top: 0 })
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <div className="text-5xl">✓</div>
        <div>
          <h2 className="text-xl font-bold">Thank you, {firstName}!</h2>
          <p className="text-muted-foreground mt-1">Your information has been recorded.</p>
          {reminderChannel === 'MESSENGER' && (
            <p className="text-sm text-muted-foreground mt-2">
              When you message our Facebook Page from your phone, your Messenger reminders will activate automatically.
            </p>
          )}
          {reminderChannel === 'EMAIL' && email && (
            <p className="text-sm text-muted-foreground mt-2">
              Reminders will be sent to <strong>{email}</strong>.
            </p>
          )}
          {reminderChannel === 'SMS' && (
            <p className="text-sm text-muted-foreground mt-2">
              SMS reminders will be sent to <strong>{phone}</strong> when available.
            </p>
          )}
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

  // ── Reminders step ────────────────────────────────────────────────────────
  if (step === 'reminders') {
    const messengerUrl = FB_PAGE_ID ? `https://m.me/${FB_PAGE_ID}` : null

    return (
      <div className="flex flex-col gap-6 pb-10">
        <div>
          <h2 className="text-lg font-semibold">Appointment Reminders</h2>
          <p className="text-sm text-muted-foreground mt-1">
            How would you like to receive appointment reminders from {clinicName}?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {REMINDER_OPTIONS.map((opt) => {
            const selected = reminderChannel === opt.channel
            return (
              <button
                key={opt.channel}
                type="button"
                onClick={() => setReminderChannel(opt.channel)}
                className={[
                  'flex flex-col items-center justify-center gap-2 min-h-[88px] rounded-xl border-2 px-3 py-4 text-center transition-colors',
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-foreground',
                ].join(' ')}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <div>
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{opt.description}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Channel-specific info */}
        {reminderChannel === 'MESSENGER' && (
          <div className="flex flex-col items-center gap-4 rounded-xl border bg-background p-5 text-center">
            {messengerUrl ? (
              <>
                <div className="bg-white p-3 rounded-xl border">
                  <QRCode value={messengerUrl} size={180} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{clinicName}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Scan this QR code with your phone and send us any message to activate Messenger reminders.
                  </p>
                  {clinicFacebookPageUrl && (
                    <p className="text-xs text-muted-foreground break-all">{clinicFacebookPageUrl}</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Messenger QR code will appear here once the clinic&apos;s Facebook Page is configured.
              </p>
            )}
          </div>
        )}

        {reminderChannel === 'EMAIL' && (
          <div className="rounded-xl border bg-background p-4 text-center">
            {email ? (
              <p className="text-sm text-muted-foreground">
                Reminders will be sent to <strong className="text-foreground">{email}</strong>
              </p>
            ) : (
              <p className="text-sm text-destructive">
                No email address on file. Go back and add one, or choose another reminder method.
              </p>
            )}
          </div>
        )}

        {reminderChannel === 'SMS' && (
          <div className="rounded-xl border bg-background p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Reminders will be sent to <strong className="text-foreground">{phone}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-1">SMS reminders coming soon.</p>
          </div>
        )}

        {reminderChannel === 'NONE' && (
          <div className="rounded-xl border bg-background p-4 text-center">
            <p className="text-sm text-muted-foreground">No reminders will be sent.</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 min-h-[48px]"
            onClick={() => setStep('form')}
          >
            ← Back
          </Button>
          <Button
            type="button"
            disabled={!reminderChannel || submitting || (reminderChannel === 'EMAIL' && !email)}
            className="flex-1 min-h-[48px]"
            onClick={handleSubmit}
          >
            {submitting ? 'Submitting…' : 'Complete Registration'}
          </Button>
        </div>
      </div>
    )
  }

  // ── Form step ─────────────────────────────────────────────────────────────
  return (
    <form ref={formRef} onSubmit={goToReminders} className="flex flex-col gap-6 pb-10">

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
        disabled={!consentGiven}
        className="w-full min-h-[56px] text-base"
      >
        Continue →
      </Button>
    </form>
  )
}
