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
import { InfoSheet } from '@/components/InfoSheet'

const GUARDIAN_RELATIONSHIPS = [
  'Mother', 'Father', 'Legal Guardian', 'Grandparent', 'Sibling (18+)', 'Other',
]

const CONSENT_NOTICE_VERSION = '2026-06-01'

type ChannelOption = {
  channel: ReminderChannel
  emoji: string
  label: string
  sub: string
}

const ALL_CHANNEL_OPTIONS: ChannelOption[] = [
  { channel: 'MESSENGER', emoji: '📱', label: 'Messenger',    sub: 'Via Facebook Messenger' },
  { channel: 'EMAIL',     emoji: '📧', label: 'Email',        sub: 'To your email address' },
  { channel: 'NONE',      emoji: '🔕',  label: 'No reminders', sub: 'Skip reminders' },
]

function StepHeader({ step, total, label }: { step: number; total: number; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-black shrink-0">
        {step}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-blue-600 leading-tight">{label}</p>
      </div>
      <span className="text-sm text-muted-foreground font-medium shrink-0">Step {step} of {total}</span>
    </div>
  )
}

function SectionHeading({ emoji, title }: { emoji: string; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b-2 border-blue-100 pb-3 mb-1">
      <span className="text-2xl">{emoji}</span>
      <h2 className="text-lg font-black text-foreground">{title}</h2>
    </div>
  )
}

export function IntakeForm({
  clinicName,
  clinicFacebookPageUrl,
  clinicMessengerPageId,
}: {
  clinicName: string
  clinicFacebookPageUrl?: string | null
  clinicMessengerPageId?: string | null
}) {
  const router = useRouter()
  type Step = 'form' | 'reminders' | 'done'
  const [step, setStep] = useState<Step>('form')

  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [address, setAddress] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [philsysId, setPhilsysId] = useState('')
  const [sex, setSex] = useState('')
  const [civilStatus, setCivilStatus] = useState('')
  const [occupation, setOccupation] = useState('')
  const [isSeniorCitizen, setIsSeniorCitizen] = useState(false)
  const [scIdNumber, setScIdNumber] = useState('')
  const [isPwd, setIsPwd] = useState(false)
  const [pwdIdNumber, setPwdIdNumber] = useState('')
  const [medicalHistory, setMedicalHistory] = useState('')
  const [medications, setMedications] = useState('')
  const [allergies, setAllergies] = useState('')
  const [isMinor, setIsMinor] = useState(false)
  const [guardianName, setGuardianName] = useState('')
  const [guardianRelationship, setGuardianRelationship] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)

  const CHANNEL_OPTIONS = clinicMessengerPageId
    ? ALL_CHANNEL_OPTIONS
    : ALL_CHANNEL_OPTIONS.filter((o) => o.channel !== 'MESSENGER')

  const [patientId, setPatientId] = useState<string | null>(null)
  const [channel, setChannel] = useState<ReminderChannel | null>(null)
  const [savingStep1, setSavingStep1] = useState(false)
  const [savingStep2, setSavingStep2] = useState(false)

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    if (!consentGiven) {
      toast.error('Patient must consent before continuing.')
      return
    }
    setSavingStep1(true)
    const data: IntakeStep1Data = {
      firstName, middleName: middleName || undefined, lastName, dateOfBirth, address,
      addressLine2: addressLine2 || undefined,
      phone,
      email: email || undefined,
      philsysId: philsysId || undefined,
      sex: sex || undefined,
      civilStatus: civilStatus || undefined,
      occupation: occupation || undefined,
      isSeniorCitizen,
      scIdNumber: isSeniorCitizen ? (scIdNumber || undefined) : undefined,
      isPwd,
      pwdIdNumber: isPwd ? (pwdIdNumber || undefined) : undefined,
      medicalHistory, medications, allergies,
      isMinor,
      guardianName: isMinor ? guardianName : undefined,
      guardianRelationship: isMinor ? guardianRelationship : undefined,
      consentGiven,
      noticeVersion: CONSENT_NOTICE_VERSION,
    }
    const result = await submitIntakeStep1(data)
    setSavingStep1(false)

    if (!result.success) {
      if (result.error === 'patient_limit') {
        toast.error('You\'ve reached the 30-patient limit on the Free plan. Upgrade to Basic for unlimited patients.')
      } else if (result.error === 'consent_required') {
        toast.error('Patient consent is required before saving.')
      } else {
        toast.error('Something went wrong. Please try again.')
      }
      return
    }
    setPatientId(result.patientId)
    setStep('reminders')
    scrollTop()
  }

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
    setFirstName(''); setMiddleName(''); setLastName(''); setDateOfBirth(''); setAddress(''); setAddressLine2('')
    setPhone(''); setEmail(''); setPhilsysId('')
    setIsSeniorCitizen(false); setScIdNumber(''); setIsPwd(false); setPwdIdNumber('')
    setMedicalHistory(''); setMedications('')
    setAllergies(''); setIsMinor(false); setGuardianName('')
    setGuardianRelationship(''); setConsentGiven(false)
    setPatientId(null); setChannel(null); setStep('form')
    scrollTop()
  }

  const messengerUrl = clinicMessengerPageId && patientId
    ? `https://m.me/${clinicMessengerPageId}?ref=patient_${patientId}`
    : null

  // ── DONE ────────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
        <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
          <span className="text-5xl">✓</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-foreground">You&apos;re all set, {firstName}! 🎉</h2>
          <p className="text-lg text-muted-foreground">Welcome to {clinicName}.</p>
          {channel === 'MESSENGER' && (
            <p className="text-base text-muted-foreground mt-1">
              Message our Facebook Page and we&apos;ll activate your Messenger reminders.
            </p>
          )}
          {channel === 'EMAIL' && email && (
            <p className="text-base text-muted-foreground mt-1">
              We&apos;ll send reminders to <strong className="text-foreground">{email}</strong>.
            </p>
          )}
          {channel === 'NONE' && (
            <p className="text-base text-muted-foreground mt-1">No reminders — got it.</p>
          )}
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <Button variant="outline" className="flex-1 min-h-[56px] text-base" onClick={() => router.push('/patients')}>
            View Patients
          </Button>
          <Button className="flex-1 min-h-[56px] text-base" onClick={handleReset}>
            New Patient
          </Button>
        </div>
      </div>
    )
  }

  // ── STEP 2 — Reminder channel ────────────────────────────────────────────────
  if (step === 'reminders') {
    return (
      <div className="flex flex-col gap-5 pb-10">

        {/* Welcome back banner */}
        <div className="rounded-2xl bg-blue-50 border border-blue-100 px-5 py-4">
          <p className="text-xl font-black text-blue-800">Almost done, {firstName}! 👏</p>
          <p className="text-base text-blue-700 mt-1">Just one last thing — how should we remind you about your appointments?</p>
        </div>

        <StepHeader step={2} total={2} label="Reminder Preference" />

        <div className="flex items-center gap-2">
          <InfoSheet title="Reminder channels">
            <p><strong>Messenger</strong> — sends via Facebook Messenger. Best for patients who use Messenger daily.</p>
            <p><strong>Email</strong> — works immediately, no setup needed.</p>
            <p>💡 If unsure, choose <strong>Email</strong> — it works right away.</p>
          </InfoSheet>
          <p className="text-base text-muted-foreground">We&apos;ll remind you about upcoming appointments.</p>
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
                  'flex flex-col items-center justify-center gap-2 min-h-[100px] rounded-2xl border-2 px-3 py-4 text-center transition-colors',
                  selected
                    ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-md'
                    : 'border-border bg-background text-foreground',
                ].join(' ')}
              >
                <span className="text-3xl">{opt.emoji}</span>
                <div>
                  <p className="text-base font-bold leading-tight">{opt.label}</p>
                  <p className="text-sm text-muted-foreground leading-tight mt-0.5">{opt.sub}</p>
                </div>
              </button>
            )
          })}
        </div>

        {channel === 'MESSENGER' && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border bg-background p-5 text-center">
            {messengerUrl ? (
              <>
                <div className="bg-white p-3 rounded-xl border shadow-sm">
                  <QRCode value={messengerUrl} size={220} />
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-base">{clinicName}</p>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Scan this with your phone and send us any message to activate Messenger reminders.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Or search <strong>&quot;{clinicName}&quot;</strong> on Messenger.
                  </p>
                  {clinicFacebookPageUrl && (
                    <p className="text-xs text-muted-foreground/60 break-all">{clinicFacebookPageUrl}</p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}

        {channel === 'EMAIL' && (
          <div className="rounded-2xl border bg-background p-4 text-center">
            {email ? (
              <p className="text-base text-muted-foreground">
                Reminders will be sent to <strong className="text-foreground">{email}</strong>
              </p>
            ) : (
              <p className="text-base text-destructive">
                No email address on file. Go back and add one, or choose another option.
              </p>
            )}
          </div>
        )}

        {channel === 'NONE' && (
          <div className="rounded-2xl border bg-background p-4 text-center">
            <p className="text-base text-muted-foreground">No problem — we won&apos;t send you any reminders.</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 min-h-[56px] text-base"
            onClick={() => setStep('form')}
          >
            ← Back
          </Button>
          <Button
            type="button"
            disabled={!channel || savingStep2 || (channel === 'EMAIL' && !email)}
            className="flex-1 min-h-[56px] text-base font-bold"
            onClick={handleComplete}
          >
            {savingStep2 ? 'Saving…' : 'Complete ✓'}
          </Button>
        </div>
      </div>
    )
  }

  // ── STEP 1 — Patient details ─────────────────────────────────────────────────
  return (
    <form onSubmit={handleContinue} className="flex flex-col gap-6 pb-10">

      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-5 shadow-md">
        <p className="text-2xl font-black leading-tight">Welcome! 👋</p>
        <p className="text-base opacity-90 mt-1">Fill this out once and we&apos;ll take care of the rest.</p>
        <p className="text-sm opacity-75 mt-0.5">{clinicName}</p>
      </div>

      <StepHeader step={1} total={2} label="Your Details" />

      {/* ── Personal Information ── */}
      <section className="flex flex-col gap-4">
        <SectionHeading emoji="👤" title="Personal Information" />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="firstName" className="text-base font-semibold">First Name *</Label>
            <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required className="min-h-[52px] text-base" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lastName" className="text-base font-semibold">Last Name *</Label>
            <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} required className="min-h-[52px] text-base" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="middleName" className="text-base font-semibold">
            Middle Name <span className="text-muted-foreground font-normal text-sm">(optional)</span>
          </Label>
          <Input id="middleName" value={middleName} onChange={e => setMiddleName(e.target.value)} className="min-h-[52px] text-base" placeholder="e.g. Santos" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dob" className="text-base font-semibold">Date of Birth *</Label>
          <Input id="dob" type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required className="min-h-[52px] text-base" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address" className="text-base font-semibold">Address *</Label>
          <Input id="address" value={address} onChange={e => setAddress(e.target.value)} required className="min-h-[52px] text-base" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="addressLine2" className="text-base font-semibold">
            Address Line 2 <span className="text-muted-foreground font-normal text-sm">(optional)</span>
          </Label>
          <Input id="addressLine2" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} className="min-h-[52px] text-base" placeholder="Unit / building / barangay" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone" className="text-base font-semibold">Phone Number *</Label>
          <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="min-h-[52px] text-base" placeholder="+63 912 345 6789" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-base font-semibold">
            Email <span className="text-muted-foreground font-normal text-sm">(optional)</span>
          </Label>
          <Input id="email" type="text" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} className="min-h-[52px] text-base" placeholder="patient@example.com" />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="sex" className="text-base font-semibold">
              Sex <span className="text-muted-foreground font-normal text-sm">(optional)</span>
            </Label>
            <select id="sex" value={sex} onChange={e => setSex(e.target.value)}
              className="min-h-[52px] rounded-xl border border-input bg-background px-3 text-base">
              <option value="">— select —</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <Label htmlFor="civilStatus" className="text-base font-semibold">
              Civil Status <span className="text-muted-foreground font-normal text-sm">(optional)</span>
            </Label>
            <select id="civilStatus" value={civilStatus} onChange={e => setCivilStatus(e.target.value)}
              className="min-h-[52px] rounded-xl border border-input bg-background px-3 text-base">
              <option value="">— select —</option>
              <option value="SINGLE">Single</option>
              <option value="MARRIED">Married</option>
              <option value="WIDOWED">Widowed</option>
              <option value="SEPARATED">Separated</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="occupation" className="text-base font-semibold">
            Occupation <span className="text-muted-foreground font-normal text-sm">(optional)</span>
          </Label>
          <Input id="occupation" value={occupation} onChange={e => setOccupation(e.target.value)}
            className="min-h-[52px] text-base" placeholder="e.g. Teacher, Nurse, Self-employed" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="philsysId" className="text-base font-semibold">
            PhilSys ID <span className="text-muted-foreground font-normal text-sm">(optional)</span>
          </Label>
          <Input
            id="philsysId"
            value={philsysId}
            onChange={e => setPhilsysId(e.target.value)}
            className="min-h-[52px] text-base"
            placeholder="e.g. 1234-5678-9012-3"
            inputMode="numeric"
          />
          <p className="text-sm text-muted-foreground">Philippine Identification System number on the PhilSys card.</p>
        </div>

        {/* Senior Citizen */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-border bg-background px-4 py-3 active:bg-muted/40 transition-colors">
            <input id="isSC" type="checkbox" checked={isSeniorCitizen}
              onChange={e => { setIsSeniorCitizen(e.target.checked); if (!e.target.checked) setScIdNumber('') }}
              className="h-6 w-6 rounded shrink-0" />
            <span className="text-base font-semibold">Senior Citizen (60+) — RA 9994</span>
          </label>
          {isSeniorCitizen && (
            <div className="flex flex-col gap-1.5 pl-4 border-l-4 border-blue-200">
              <Label htmlFor="scId" className="text-base font-semibold">SC ID Number *</Label>
              <Input id="scId" value={scIdNumber} onChange={e => setScIdNumber(e.target.value)}
                required={isSeniorCitizen} className="min-h-[52px] text-base" placeholder="e.g. 123-456-789" />
            </div>
          )}
        </div>

        {/* PWD */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-border bg-background px-4 py-3 active:bg-muted/40 transition-colors">
            <input id="isPWD" type="checkbox" checked={isPwd}
              onChange={e => { setIsPwd(e.target.checked); if (!e.target.checked) setPwdIdNumber('') }}
              className="h-6 w-6 rounded shrink-0" />
            <span className="text-base font-semibold">Person with Disability (PWD) — RA 10754</span>
          </label>
          {isPwd && (
            <div className="flex flex-col gap-1.5 pl-4 border-l-4 border-blue-200">
              <Label htmlFor="pwdId" className="text-base font-semibold">PWD ID Number *</Label>
              <Input id="pwdId" value={pwdIdNumber} onChange={e => setPwdIdNumber(e.target.value)}
                required={isPwd} className="min-h-[52px] text-base" placeholder="e.g. PWD-123-456" />
            </div>
          )}
        </div>
      </section>

      {/* ── Minor ── */}
      <section className="flex flex-col gap-3">
        <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-border bg-background px-4 py-3 active:bg-muted/40 transition-colors">
          <input id="isMinor" type="checkbox" checked={isMinor} onChange={e => setIsMinor(e.target.checked)} className="h-6 w-6 rounded shrink-0" />
          <span className="text-base font-semibold">Patient is a minor (under 18)</span>
        </label>

        {isMinor && (
          <div className="flex flex-col gap-3 pl-4 border-l-4 border-blue-200">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="guardianName" className="text-base font-semibold">Guardian Full Name *</Label>
              <Input id="guardianName" value={guardianName} onChange={e => setGuardianName(e.target.value)} required={isMinor} className="min-h-[52px] text-base" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="guardianRel" className="text-base font-semibold">Relationship *</Label>
              <select id="guardianRel" value={guardianRelationship} onChange={e => setGuardianRelationship(e.target.value)} required={isMinor}
                className="min-h-[52px] rounded-xl border border-input bg-background px-3 py-2 text-base">
                <option value="">Select relationship</option>
                {GUARDIAN_RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        )}
      </section>

      {/* ── Medical ── */}
      <section className="flex flex-col gap-4">
        <SectionHeading emoji="🏥" title="Medical Information" />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="medHistory" className="text-base font-semibold">Medical History</Label>
          <textarea id="medHistory" value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)}
            placeholder="e.g. diabetes, hypertension, heart condition…" rows={3}
            className="rounded-xl border border-input bg-background px-4 py-3 text-base resize-none" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="medications" className="text-base font-semibold">Current Medications</Label>
          <textarea id="medications" value={medications} onChange={e => setMedications(e.target.value)}
            placeholder="List any medications currently taking…" rows={2}
            className="rounded-xl border border-input bg-background px-4 py-3 text-base resize-none" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="allergies" className="text-base font-semibold">Known Allergies</Label>
          <textarea id="allergies" value={allergies} onChange={e => setAllergies(e.target.value)}
            placeholder="e.g. penicillin, latex, aspirin…" rows={2}
            className="rounded-xl border border-input bg-background px-4 py-3 text-base resize-none" />
        </div>
      </section>

      {/* ── Privacy Consent ── */}
      <section className="flex flex-col gap-3 rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">
        <SectionHeading emoji="🔒" title="Data Privacy Consent" />
        <p className="text-base text-foreground leading-relaxed">
          Under the <strong>Data Privacy Act of 2012 (RA 10173)</strong>, {clinicName} collects your personal and medical information solely to provide dental care. Your data is stored securely, will not be shared without your consent, and may be retained for up to 10 years as required by law.
        </p>
        <p className="text-base text-foreground leading-relaxed">
          If you choose reminders, {clinicName} may contact you via <strong>Facebook Messenger or email</strong> for appointment reminders and follow-up messages. You may opt out at any time.
        </p>
        <label className="flex items-start gap-3 cursor-pointer rounded-xl bg-white border border-blue-200 px-4 py-4">
          <input id="consent" type="checkbox" checked={consentGiven} onChange={e => setConsentGiven(e.target.checked)} className="h-6 w-6 rounded mt-0.5 shrink-0" />
          <span className="text-base leading-relaxed font-medium">
            I have read and understood the above. I consent to {clinicName} collecting and processing my information for dental care, and confirm the details I provided are true and accurate.
          </span>
        </label>
      </section>

      <Button type="submit" disabled={!consentGiven || savingStep1} className="w-full min-h-[60px] text-lg font-bold rounded-2xl">
        {savingStep1 ? 'Saving…' : 'Continue →'}
      </Button>
    </form>
  )
}
