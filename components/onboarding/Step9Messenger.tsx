'use client'

import { Button } from '@/components/ui/button'

type Props = {
  hasMessengerToken: boolean
  onNext: () => void
  onBack: () => void
}

export function Step9Messenger({ hasMessengerToken, onNext, onBack }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold font-heading">Connect Facebook Messenger</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Let Sigurado send appointment reminders and care follow-ups directly to your patients via Messenger.
        </p>
      </div>

      {hasMessengerToken ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Facebook Page connected</p>
            <p className="text-xs text-emerald-700 mt-0.5">Your clinic can now send Messenger reminders to patients.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-muted/40 p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">💬</span>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">What you get</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Appointment reminders sent automatically via Messenger</li>
                  <li>• Warm care follow-ups after procedures (&ldquo;Hope you&apos;re healing well 🙏&rdquo;)</li>
                  <li>• Link each patient to their Facebook in seconds during intake</li>
                </ul>
              </div>
            </div>
          </div>

          {/* OAuth link — sets return cookie so callback comes back to onboarding */}
          <a
            href="/api/auth/facebook?return=onboarding"
            className="flex items-center justify-center gap-2 w-full min-h-[56px] rounded-xl bg-[#1877F2] text-white font-semibold text-base active:opacity-80"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Connect with Facebook
          </a>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1 min-h-[48px]">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1 min-h-[48px]">
          {hasMessengerToken ? 'Continue' : 'Skip for now'}
        </Button>
      </div>
    </div>
  )
}
