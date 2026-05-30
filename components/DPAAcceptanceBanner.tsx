'use client'

import { useState, useTransition } from 'react'
import { Shield, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { acceptDPA } from '@/app/(dashboard)/actions'

export function DPAAcceptanceBanner() {
  const [checked, setChecked] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleAccept() {
    if (!checked) return
    startTransition(async () => {
      await acceptDPA()
    })
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-screen-sm bg-background rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-emerald-600 px-5 py-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-white shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-white text-base">Action Required: Data Agreement</p>
            <p className="text-emerald-100 text-sm mt-0.5">
              We've updated our legal setup. Please accept the Data Processing Agreement to continue.
            </p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">

          {/* Expandable summary */}
          <div className="rounded-2xl border overflow-hidden">
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left active:bg-muted/50"
            >
              <span>What does this agreement cover?</span>
              {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {expanded && (
              <div className="px-4 pb-4 pt-1 space-y-2.5 text-sm text-muted-foreground border-t bg-muted/20">
                <p>
                  Under the Philippine Data Privacy Act (RA 10173), Sigurado is a{' '}
                  <strong>Personal Information Processor (PIP)</strong> — we process your patients'
                  health records on your clinic's instructions.
                </p>
                <p>
                  This agreement formalizes that relationship. It confirms we only process data for the
                  purpose of running Sigurado for your clinic, that your data is secured with
                  multi-tenant isolation and encryption, and that we will notify you within the required
                  timeframe if there is ever a breach.
                </p>
                <p>
                  Your clinic remains the{' '}
                  <strong>Personal Information Controller (PIC)</strong> — responsible to your patients
                  for how their data is used.
                </p>
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline block mt-1"
                >
                  Read the full Privacy Policy →
                </a>
              </div>
            )}
          </div>

          {/* Checkbox */}
          <button
            type="button"
            onClick={() => setChecked(v => !v)}
            className="w-full flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors"
            style={{ borderColor: checked ? 'var(--color-primary)' : undefined }}
          >
            <div className={`w-6 h-6 rounded-md border-2 shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
              checked ? 'bg-primary border-primary' : 'border-border bg-background'
            }`}>
              {checked && <CheckCircle2 className="w-4 h-4 text-white" />}
            </div>
            <p className="text-sm leading-relaxed">
              I am authorized to agree to the Data Processing Agreement on behalf of my clinic and
              accept our responsibilities as a Personal Information Controller under RA 10173.
            </p>
          </button>

          <Button
            onClick={handleAccept}
            disabled={!checked || isPending}
            className="w-full min-h-[48px] text-base font-semibold"
          >
            {isPending ? 'Saving…' : 'I Agree — Continue to Dashboard'}
          </Button>

        </div>
      </div>
    </div>
  )
}
