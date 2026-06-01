'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'react-qr-code'
import {
  submitIntakeStep1,
  submitIntakeStep2,
  type IntakeStep1Data,
  type ReminderChannel,
} from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const GUARDIAN_RELATIONSHIPS = [
  'Mother', 'Father', 'Legal Guardian', 'Grandparent', 'Sibling (18+)', 'Other',
]

const FB_PAGE_ID = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ID ?? ''

type ChannelOption = {
  channel: ReminderChannel
  emoji: string
  label: string
  sub: string
}

const CHANNEL_OPTIONS: ChannelOption[] = [
  { channel: 'MESSENGER', emoji: '📱', label: 'Messenger',    sub: 'Via Facebook Messenger' },
  { channel: 'EMAIL',     emoji: '📧', label: 'Email',        sub: 'To your email address' },
  { channel: 'SMS',       emoji: '📞', label: 'SMS',          sub: 'To your phone number' },
  { channel: 'NONE',      emoji: '✕',  label: 'No reminders', sub: 'Skip reminders' },
]

export function IntakeForm({
  clinicName,
  clinicFacebookPageUrl,
}: {
  clinicName: string
  clinicFacebookPageUrl?: string | null
}) {
  const router = useRouter()
  type Step = 'form' | 'reminders' | 'done'
  const [step, setStep] = useState<Step>('form')

  // ── Step 1 fields ──────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [philsysId, setPhilsysId] = useState('')
  const [medicalHistory, setMedicalHistory] = useState('')
  const [medications, setMedications] = useState('')
  const [allergies, setAllergies] = useState('')
  const [isMinor, setIsMinor] = useState(false)
  const [guardianName, setGuardianName] = useState('')
  const [guardianRelationship, setGuardianRelationship] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)

  // ── Step 2 state ───────────────────────────────────────────────────────────
  const [patientId, setPatientId] = useState<string | null>(null)
  const [channel, setChannel] = useState<ReminderChannel | null>(null)
  const [savingStep1, setSavingStep1] = useState(false)
  const [savingStep2, setSavingStep2] = useState(false)

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Continue → (end of step 1) ─────────────────────────────────────────────
  async function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    if (!consentGiven) {
      toast.error('Patient must consent before continuing.')
      return
    }
    setSavingStep1(true)
    const data: IntakeStep1Data = {
      firstName, middleName: middleName || undefined, lastName, dateOfBirth, address, phone,
      email: email || undefined,
      philsysId: philsysId || undefined,
      medicalHistory, medications, allergies,
      isMinor,
      guardianName: isMinor ? guardianName : undefined,
      guardianRelationship: isMinor ? guardianRelationship : undefined,
    }
    const result = await submitIntakeStep1(data)
    setSavingStep1(false)

    if (!result.success) {
      toast.error('Something went wrong. Please try again.')
      return
    }
    setPatientId(result.patientId)
    setStep('reminders')
    scrollTop()
  }

  // ── Complete Registration (end of step 2) ──────────────────────────────────
  async function handleComplete() {
    if (!channel || !patientId) return
    setSavingStep2(true)
    const result = await submitIntakeStep2(patientId, channel)
    setSavingStep2(false)

    if (!result.success) {
      toast.error('Something went wrong saving your preference. Please try again.')
      return
    }
    setStep('done')
    scrollTop()
  }

  function handleReset() {
    setFirstName(''); setMiddleName(''); setLastName(''); setDateOfBirth(''); setAddress('')
    setPhone(''); setEmail(''); setPhilsysId(''); setMedicalHistory(''); setMedications('')
    setAllergies(''); setIsMinor(false); setGuardianName('')
    setGuardianRelationship(''); setConsentGiven(false)
    setPatientId(null); setChannel(null); setStep('form')
    scrollTop()
  }

  const messengerUrl = FB_PAGE_ID && patientId
    ? `https://m.me/${FB_PAGE_ID}?ref=patient_${patientId}`
    : null

  // ── DONE ──────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <div className="text-5xl">✓</div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Thank you, {firstName}!</h2>
          <p className="text-muted-foreground">Your information has been recorded.</p>
          {channel === 'MESSENGER' && (
            <p className="text-sm text-muted-foreground">
              When you message our Facebook Page from your phone, Messenger reminders will activate automatically.
            </p>
          )}
          {channel === 'EMAIL' && email && (
            <p className="text-sm text-muted-foreground">
              Reminders will be sent to <strong>{email}</strong>.
            </p>
          )}
          {channel === 'SMS' && (
            <p className="text-sm text-muted-foreground">
              SMS reminders will be sent to <strong>{phone}</strong> when available.
            </p>
          )}
          {channel === 'NONE' && (
            <p className="text-sm text-muted-foreground">No reminders will be sent.</p>
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

  // ── STEP 2 — Reminder channel ─────────────────────────────────────────────
  if (step === 'reminders') {
    return (
      <div className="flex flex-col gap-5 pb-10">
        <div>
          <h2 className="text-lg font-semibold">How would you like to receive reminders?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            We&apos;ll remind you about upcoming appointments and when it&apos;s time for your next visit.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {CHANNEL_OPTIONS.map((opt) => {
            const selected = channel === opt.channel
            return (
              <button
                key={opt.channel}
                type="button"
                onClick={() => setChannel(opt.channel)}
                className={[
                  'flex flex-col items-center justify-center gap-2 min-h-[92px] rounded-xl border-2 px-3 py-4 text-center transition-colors',
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-foreground',
                ].join(' ')}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <div>
                  <p className="text-sm font-semibold leading-tight">{opt.label}</p>
                  <p className="text-xs text-muted-foreground leading-tight mt-0.5">{opt.sub}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Channel-specific info */}
        {channel === 'MESSENGER' && (
          <div className="flex flex-col items-center gap-4 rounded-xl border bg-background p-5 text-center">
            {messengerUrl ? (
              <>
                <div className="bg-white p-3 rounded-xl border shadow-sm">
                  <QRCode value={messengerUrl} size={220} />
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-sm">{clinicName}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Scan this with your phone and send us any message to activate Messenger reminders.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Or search <strong>&quot;{clinicName}&quot;</strong> on Messenger and send us a message.
                  </p>
                  {clinicFacebookPageUrl && (
                    <p className="text-xs text-muted-foreground/60 break-all">{clinicFacebookPageUrl}</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Messenger QR code will appear here once the clinic&apos;s Facebook Page ID is configured.
              </p>
            )}
          </div>
        )}

        {channel === 'EMAIL' && (
          <div className="rounded-xl border bg-background p-4 text-center">
            {email ? (
              <p className="text-sm text-muted-foreground">
                Reminders will be sent to <strong className="text-foreground">{email}</strong>
              </p>
            ) : (
              <p className="text-sm text-destructive">
                No email address on file. Go back and add one, or choose another option.
              </p>
            )}
          </div>
        )}

        {channel === 'SMS' && (
          <div className="rounded-xl border bg-background p-4 text-center space-y-1">
            <p className="text-sm text-muted-foreground">
              Reminders will be sent to <strong className="text-foreground">{phone}</strong>
            </p>
            <p className="text-xs text-muted-foreground">SMS reminders coming soon.</p>
          </div>
        )}

        {channel === 'NONE' && (
          <div className="rounded-xl border bg-background p-4 text-center">
            <p className="text-sm text-muted-foreground">No problem — we won&apos;t send you any reminders.</p>
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
            disabled={!channel || savingStep2 || (channel === 'EMAIL' && !email)}
            className="flex-1 min-h-[48px]"
            onClick={handleComplete}
          >
            {savingStep2 ? 'Saving…' : 'Complete Registration'}
          </Button>
        </div>
      </div>
    )
  }

  // ── STEP 1 — Patient details ──────────────────────────────────────────────
  return (
    <form onSubmit={handleContinue} className="flex flex-col gap-6 pb-10">

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
          <Label htmlFor="middleName">Middle Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input id="middleName" value={middleName} onChange={e => setMiddleName(e.target.value)} className="min-h-[48px]" placeholder="e.g. Santos" />
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
          <Label htmlFor="email">Email <span className="text-muted-foreground font-normal">(optional — leave blank if none)</span></Label>
          <Input id="email" type="text" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} className="min-h-[48px]" placeholder="patient@example.com" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="philsysId">
            PhilSys ID Number <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="philsysId"
            value={philsysId}
            onChange={e => setPhilsysId(e.target.value)}
            className="min-h-[48px]"
            placeholder="e.g. 1234-5678-9012-3"
            inputMode="numeric"
          />
          <p className="text-xs text-muted-foreground">Philippine Identification System number printed on the physical PhilSys card.</p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <input id="isMinor" type="checkbox" checked={isMinor} onChange={e => setIsMinor(e.target.checked)} className="h-5 w-5 rounded" />
          <Label htmlFor="isMinor">Patient is a minor (under 18)</Label>
        </div>

        {isMinor && (
          <div className="flex flex-col gap-3 pl-2 border-l-2 border-muted">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="guardianName">Guardian Full Name *</Label>
              <Input id="guardianName" value={guardianName} onChange={e => setGuardianName(e.target.value)} required={isMinor} className="min-h-[48px]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="guardianRel">Relationship *</Label>
              <select id="guardianRel" value={guardianRelationship} onChange={e => setGuardianRelationship(e.target.value)} required={isMinor} className="min-h-[48px] rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select relationship</option>
                {GUARDIAN_RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold border-b pb-2">Medical Information</h2>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="medHistory">Medical History</Label>
          <textarea id="medHistory" value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)} placeholder="e.g. diabetes, hypertension, heart condition..." rows={3} className="rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="medications">Current Medications</Label>
          <textarea id="medications" value={medications} onChange={e => setMedications(e.target.value)} placeholder="List any medications currently taking..." rows={2} className="rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="allergies">Known Allergies</Label>
          <textarea id="allergies" value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="e.g. penicillin, latex, aspirin..." rows={2} className="rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
        </div>
      </section>

      <section className="flex flex-col gap-3 bg-muted/50 rounded-xl p-4">
        <h2 className="text-base font-semibold">Data Privacy Consent</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          In compliance with the <strong>Data Privacy Act of 2012 (RA 10173)</strong>, {clinicName} collects your personal and medical information solely for the purpose of providing dental care. Your data is stored securely, will not be shared with third parties without your consent, and may be retained for up to 10 years as required by law.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If you choose to receive reminders, {clinicName} may contact you via <strong>Facebook Messenger, SMS, or email</strong> for appointment reminders and post-care follow-up messages. You may opt out at any time by informing the clinic.
        </p>
        <div className="flex items-start gap-3">
          <input id="consent" type="checkbox" checked={consentGiven} onChange={e => setConsentGiven(e.target.checked)} className="h-5 w-5 rounded mt-0.5 shrink-0" />
          <Label htmlFor="consent" className="text-sm leading-relaxed">
            I have read and understood the above. I consent to {clinicName} collecting and processing my personal and medical information for dental care purposes, and to being contacted via my chosen reminder channel.
          </Label>
        </div>
      </section>

      <Button type="submit" disabled={!consentGiven || savingStep1} className="w-full min-h-[56px] text-base">
        {savingStep1 ? 'Saving…' : 'Continue →'}
      </Button>
    </form>
  )
}
