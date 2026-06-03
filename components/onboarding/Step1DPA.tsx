'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { SIGURADO_DPO } from '@/lib/dpo'

interface Step1DPAProps {
  onAccept: () => void
  isSaving: boolean
}

const PROMISES = [
  {
    emoji: '🔐',
    bg: 'bg-blue-600',
    title: 'Your data stays yours',
    body: 'Patient records are locked to your clinic only. No one else can ever see them.',
  },
  {
    emoji: '🛡️',
    bg: 'bg-emerald-600',
    title: 'RA 10173 compliant',
    body: "We handle your patients' sensitive data under the Philippine Data Privacy Act — consent, audit trails, and breach tools included.",
  },
  {
    emoji: '🙋',
    bg: 'bg-amber-500',
    title: 'You stay in control',
    body: 'You decide what happens to your data. We only process it on your instructions and never sell it.',
  },
]

const DPA_STYLES = `
  @keyframes cardPop {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes checkBounce {
    0%   { transform: scale(0) rotate(-180deg); }
    60%  { transform: scale(1.3) rotate(10deg); }
    80%  { transform: scale(0.9) rotate(-5deg); }
    100% { transform: scale(1)   rotate(0deg); }
  }
  @keyframes btnPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(29,78,216,0.5); }
    50%      { box-shadow: 0 0 0 12px rgba(29,78,216,0); }
  }
  .dpa-card-1 { animation: cardPop 0.4s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
  .dpa-card-2 { animation: cardPop 0.4s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
  .dpa-card-3 { animation: cardPop 0.4s cubic-bezier(0.22,1,0.36,1) 0.25s both; }
  .dpa-check-bounce { animation: checkBounce 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
  .dpa-btn-pulse { animation: btnPulse 2s ease-in-out infinite; }
`

export function Step1DPA({ onAccept, isSaving }: Step1DPAProps) {
  const [checked, setChecked] = useState(false)
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="space-y-4">
      <style>{DPA_STYLES}</style>

      {/* Promise cards */}
      {PROMISES.map(({ emoji, bg, title, body }, i) => (
        <div
          key={title}
          className={`dpa-card-${i + 1} rounded-3xl p-5 flex gap-4 items-start ${bg} text-white shadow-lg`}
        >
          <span className="text-5xl leading-none shrink-0 drop-shadow">{emoji}</span>
          <div>
            <p className="font-extrabold text-lg leading-tight">{title}</p>
            <p className="text-white/85 text-sm mt-1 leading-relaxed">{body}</p>
          </div>
        </div>
      ))}

      {/* Collapsible full agreement */}
      <div className="rounded-2xl border overflow-hidden">
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium active:bg-muted/50"
        >
          <span>Read the full Data Processing Agreement</span>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-3 text-xs text-muted-foreground leading-relaxed border-t bg-muted/20 max-h-64 overflow-y-auto">
            <p className="font-semibold text-foreground pt-3">
              Data Processing Agreement between your clinic (Personal Information Controller) and
              Sigurado operated by AI Matters (Personal Information Processor)
            </p>
            {[
              ['1. Roles and Responsibilities', "Your clinic is the Personal Information Controller (PIC) under Section 3(h) of RA 10173. You determine the purpose and means of processing your patients' personal data. Sigurado (AI Matters) is the Personal Information Processor (PIP) under Section 3(i). We process patient data only on your documented instructions."],
              ['2. What We Process on Your Behalf', 'Patient identity information, health and dental records (Sensitive Personal Information under Section 3(l)), payment records, appointment data, and contact identifiers used for appointment reminders. We process this data solely to operate the Sigurado platform for your clinic.'],
              ['3. Security Measures', "We implement: TLS encryption in transit; encryption at rest; multi-tenant Row-Level Security ensuring your clinic's data is isolated from all other clinics at the database layer; audit logging of all significant data operations; and role-based access control so staff access only what their role requires."],
              ['4. Sub-processors', 'We use the following sub-processors to operate the service: Supabase/AWS (database hosting, AWS ap-south-1 Mumbai); Vercel (application compute, US); Meta Platforms (Messenger reminders, US — only if your patients opt in); Resend (email delivery, US). We do not sell or share patient data with any party for advertising or commercial purposes.'],
              ['5. Your Obligations as PIC', "You are responsible for: appointing your own Data Protection Officer (DPO); obtaining valid consent or having a lawful basis for processing each patient's personal data; posting a privacy notice in your clinic; registering with the National Privacy Commission (NPC) if you process Sensitive Personal Information of 1,000 or more individuals; responding to data subject requests within 15 business days; and reporting any breach to the NPC within 72 hours of discovery."],
              ['6. Breach Notification', "We will notify you without undue delay upon becoming aware of a personal data breach involving your clinic's data, providing sufficient detail for you to meet your 72-hour NPC notification obligation under NPC Circular 2016-03."],
              ['7. Data Subject Rights Assistance', 'We will provide reasonable technical assistance to help you fulfill data subject requests (access, correction, deletion, portability) made by your patients under Section 16 of RA 10173.'],
              ['8. Termination and Return of Data', 'Upon closure of your account, you may export your data at any time using the built-in export tools. We will retain your data for 30 days after account closure to allow for recovery, after which it will be deleted from our systems.'],
              ['9. Governing Law', 'This agreement is governed by the laws of the Republic of the Philippines, including Republic Act 10173 (Data Privacy Act of 2012) and its implementing rules and regulations issued by the National Privacy Commission.'],
            ].map(([heading, text]) => (
              <section key={heading} className="space-y-0.5">
                <p className="font-medium text-foreground">{heading}</p>
                <p>{text}</p>
              </section>
            ))}
            <p className="text-xs pt-2 border-t">
              Questions? Contact {SIGURADO_DPO.name} ({SIGURADO_DPO.company}) at <strong>{SIGURADO_DPO.email}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Giant agree tap target */}
      <button
        type="button"
        onClick={() => setChecked(v => !v)}
        className={`w-full flex items-center gap-4 rounded-3xl border-4 p-5 text-left transition-all duration-200 active:scale-[0.98] ${
          checked
            ? 'border-blue-600 bg-blue-50'
            : 'border-dashed border-gray-300 bg-gray-50'
        }`}
      >
        <div className={`w-12 h-12 rounded-2xl border-4 shrink-0 flex items-center justify-center transition-colors duration-200 ${
          checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
        }`}>
          {checked && (
            <span className="dpa-check-bounce text-white text-2xl font-black leading-none">✓</span>
          )}
        </div>
        <p className="text-sm font-semibold leading-snug">
          I am authorised to agree to this Data Processing Agreement on behalf of my clinic, and I understand our obligations under RA 10173.
        </p>
      </button>

      <button
        onClick={onAccept}
        disabled={!checked || isSaving}
        className={`w-full min-h-[64px] rounded-3xl font-extrabold text-lg text-white transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
          checked ? 'bg-blue-700 dpa-btn-pulse' : 'bg-blue-700'
        }`}
      >
        {isSaving ? 'Saving…' : "✅ I Agree — Let's Go!"}
      </button>

      <p className="text-xs text-center text-muted-foreground">
        Your acceptance is timestamped and recorded as part of this agreement.
      </p>
    </div>
  )
}
