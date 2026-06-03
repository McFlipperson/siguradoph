'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, ShieldCheck, Lock, Users } from 'lucide-react'
import { SIGURADO_DPO } from '@/lib/dpo'

interface Step1DPAProps {
  onAccept: () => void
  isSaving: boolean
}

const PROMISES = [
  {
    icon: Lock,
    color: 'bg-blue-100 text-blue-700',
    title: 'Your data stays yours',
    body: 'Patient records are encrypted and locked to your clinic only. No other clinic can ever see your data.',
  },
  {
    icon: ShieldCheck,
    color: 'bg-emerald-100 text-emerald-700',
    title: 'RA 10173 compliant',
    body: "We handle your patients' sensitive data under the Philippine Data Privacy Act — consent, audit trails, breach tools included.",
  },
  {
    icon: Users,
    color: 'bg-amber-100 text-amber-700',
    title: 'You stay in control',
    body: 'You are the Personal Information Controller. We only process data on your instructions, never sell it.',
  },
]

export function Step1DPA({ onAccept, isSaving }: Step1DPAProps) {
  const [checked, setChecked] = useState(false)
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="space-y-5">

      {/* Promise cards */}
      <div className="space-y-3">
        {PROMISES.map(({ icon: Icon, color, title, body }) => (
          <div key={title} className="flex items-start gap-3 rounded-2xl border bg-background p-4">
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Collapsible full agreement */}
      <div className="rounded-2xl border overflow-hidden">
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium active:bg-muted/50"
        >
          <span>Read the full Data Processing Agreement</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
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
              ['6. Breach Notification', 'We will notify you without undue delay upon becoming aware of a personal data breach involving your clinic\'s data, providing sufficient detail for you to meet your 72-hour NPC notification obligation under NPC Circular 2016-03.'],
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

      {/* Agree checkbox */}
      <button
        type="button"
        onClick={() => setChecked(v => !v)}
        className={`w-full flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all active:opacity-80 ${
          checked ? 'border-blue-600 bg-blue-50' : 'border-border bg-background'
        }`}
      >
        <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
          checked ? 'bg-blue-600 border-blue-600' : 'border-border bg-background'
        }`}>
          {checked && <CheckCircle2 className="w-4 h-4 text-white" />}
        </div>
        <p className="text-sm leading-relaxed">
          I am authorised to agree to this Data Processing Agreement on behalf of my clinic, and I understand our obligations under RA 10173.
        </p>
      </button>

      <button
        onClick={onAccept}
        disabled={!checked || isSaving}
        className="w-full min-h-[52px] rounded-2xl bg-blue-700 text-white font-bold text-base disabled:opacity-40 active:opacity-90 transition-opacity"
      >
        {isSaving ? 'Saving…' : "I Agree — Let's Go! 🚀"}
      </button>

      <p className="text-xs text-center text-muted-foreground">
        Your acceptance is timestamped and recorded as part of this agreement.
      </p>
    </div>
  )
}
