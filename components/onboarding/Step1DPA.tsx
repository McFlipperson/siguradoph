'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Shield, CheckCircle2 } from 'lucide-react'

interface Step1DPAProps {
  onAccept: () => void
  isSaving: boolean
}

export function Step1DPA({ onAccept, isSaving }: Step1DPAProps) {
  const [checked, setChecked] = useState(false)

  return (
    <div className="space-y-6">

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
          <Shield className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Data Processing Agreement</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Required under the Philippine Data Privacy Act (RA 10173)
          </p>
        </div>
      </div>

      {/* Agreement body */}
      <div className="rounded-2xl border bg-muted/30 p-4 space-y-4 text-sm text-muted-foreground max-h-[52vh] overflow-y-auto leading-relaxed">

        <p className="font-semibold text-foreground">
          Data Processing Agreement between your clinic (Personal Information Controller) and
          Sigurado operated by AI Matters (Personal Information Processor)
        </p>

        <section className="space-y-1">
          <p className="font-medium text-foreground">1. Roles and Responsibilities</p>
          <p>
            Your clinic is the <strong>Personal Information Controller (PIC)</strong> under Section 3(h)
            of RA 10173. You determine the purpose and means of processing your patients' personal data.
            Sigurado (AI Matters) is the <strong>Personal Information Processor (PIP)</strong> under
            Section 3(i). We process patient data only on your documented instructions.
          </p>
        </section>

        <section className="space-y-1">
          <p className="font-medium text-foreground">2. What We Process on Your Behalf</p>
          <p>
            Patient identity information, health and dental records (Sensitive Personal Information under
            Section 3(l)), payment records, appointment data, and contact identifiers used for
            appointment reminders. We process this data solely to operate the Sigurado platform for
            your clinic.
          </p>
        </section>

        <section className="space-y-1">
          <p className="font-medium text-foreground">3. Security Measures</p>
          <p>
            We implement: TLS encryption in transit; encryption at rest; multi-tenant Row-Level Security
            ensuring your clinic's data is isolated from all other clinics at the database layer;
            audit logging of all significant data operations; and role-based access control so staff
            access only what their role requires.
          </p>
        </section>

        <section className="space-y-1">
          <p className="font-medium text-foreground">4. Sub-processors</p>
          <p>
            We use the following sub-processors to operate the service: Supabase/AWS (database hosting,
            AWS ap-south-1 Mumbai); Vercel (application compute, US); Meta Platforms (Messenger
            reminders, US — only if your patients opt in); Resend (email delivery, US). We do not sell
            or share patient data with any party for advertising or commercial purposes.
          </p>
        </section>

        <section className="space-y-1">
          <p className="font-medium text-foreground">5. Your Obligations as PIC</p>
          <p>
            You are responsible for: obtaining valid consent or having a lawful basis for processing
            each patient's personal data; posting a privacy notice in your clinic; registering with the
            National Privacy Commission (NPC) if you process Sensitive Personal Information of 1,000 or
            more individuals; responding to data subject requests within 15 business days; and reporting
            any breach to the NPC within 72 hours of discovery.
          </p>
        </section>

        <section className="space-y-1">
          <p className="font-medium text-foreground">6. Breach Notification</p>
          <p>
            We will notify you without undue delay upon becoming aware of a personal data breach
            involving your clinic's data, providing sufficient detail for you to meet your 72-hour
            NPC notification obligation under NPC Circular 2016-03.
          </p>
        </section>

        <section className="space-y-1">
          <p className="font-medium text-foreground">7. Data Subject Rights Assistance</p>
          <p>
            We will provide reasonable technical assistance to help you fulfill data subject requests
            (access, correction, deletion, portability) made by your patients under Section 16 of
            RA 10173.
          </p>
        </section>

        <section className="space-y-1">
          <p className="font-medium text-foreground">8. Termination and Return of Data</p>
          <p>
            Upon closure of your account, you may export your data at any time using the built-in
            export tools. We will retain your data for 30 days after account closure to allow for
            recovery, after which it will be deleted from our systems.
          </p>
        </section>

        <section className="space-y-1">
          <p className="font-medium text-foreground">9. Governing Law</p>
          <p>
            This agreement is governed by the laws of the Republic of the Philippines, including
            Republic Act 10173 (Data Privacy Act of 2012) and its implementing rules and regulations
            issued by the National Privacy Commission.
          </p>
        </section>

        <p className="text-xs pt-2 border-t">
          Questions? Contact our Data Protection Officer at{' '}
          <strong>privacy@sigurado.xyz</strong> before accepting.
        </p>
      </div>

      {/* Checkbox */}
      <button
        type="button"
        onClick={() => setChecked(v => !v)}
        className="w-full flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors active:bg-muted/50"
        style={{ borderColor: checked ? 'var(--color-primary)' : undefined }}
      >
        <div className={`w-6 h-6 rounded-md border-2 shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
          checked ? 'bg-primary border-primary' : 'border-border bg-background'
        }`}>
          {checked && <CheckCircle2 className="w-4 h-4 text-white" />}
        </div>
        <p className="text-sm leading-relaxed">
          I am authorized to agree to this Data Processing Agreement on behalf of my clinic. I have read
          and understood our obligations as a Personal Information Controller under RA 10173, and I
          accept the terms above.
        </p>
      </button>

      <Button
        onClick={onAccept}
        disabled={!checked || isSaving}
        className="w-full min-h-[48px] text-base font-semibold"
      >
        {isSaving ? 'Saving…' : 'I Agree — Continue Setup'}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        The date and time of your acceptance will be recorded as part of this agreement.
      </p>
    </div>
  )
}
