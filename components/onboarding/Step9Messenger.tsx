'use client'

import { Button } from '@/components/ui/button'

type Props = {
  hasMessengerToken: boolean
  onNext: () => void
  onBack: () => void
}

const MESSENGER_STYLES = `
  @keyframes fbPop {
    0%   { transform: scale(0.4) rotate(-15deg); opacity: 0; }
    60%  { transform: scale(1.15) rotate(5deg);  opacity: 1; }
    80%  { transform: scale(0.95) rotate(-2deg); }
    100% { transform: scale(1)    rotate(0deg);  }
  }
  @keyframes benefitSlide {
    from { opacity: 0; transform: translateX(-20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes connectedBounce {
    0%   { transform: scale(0.5); }
    60%  { transform: scale(1.2); }
    80%  { transform: scale(0.95); }
    100% { transform: scale(1); }
  }
  .fb-pop          { animation: fbPop 0.55s cubic-bezier(0.34,1.56,0.64,1) both; }
  .benefit-1       { animation: benefitSlide 0.35s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
  .benefit-2       { animation: benefitSlide 0.35s cubic-bezier(0.22,1,0.36,1) 0.2s both; }
  .benefit-3       { animation: benefitSlide 0.35s cubic-bezier(0.22,1,0.36,1) 0.3s both; }
  .connected-bounce { animation: connectedBounce 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
`

const BENEFITS = [
  { emoji: '⏰', label: 'Auto reminders', body: 'Sigurado texts patients the day before — no more no-shows.' },
  { emoji: '💝', label: 'Care follow-ups', body: '"Hope you\'re healing well 🙏" sent automatically after procedures.' },
  { emoji: '⚡', label: 'One tap at intake', body: 'Link each patient to their Facebook in seconds.' },
]

export function Step9Messenger({ hasMessengerToken, onNext, onBack }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <style>{MESSENGER_STYLES}</style>

      {hasMessengerToken ? (
        /* ── Connected state ─────────────────────────────────── */
        <div className="flex flex-col items-center gap-5 py-4">
          <span className="connected-bounce inline-block text-8xl leading-none drop-shadow-lg">✅</span>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-emerald-700">Facebook connected!</p>
            <p className="text-sm text-muted-foreground mt-1">Your clinic can now send Messenger reminders to patients.</p>
          </div>

          <div className="w-full rounded-3xl bg-emerald-50 border-2 border-emerald-200 p-5 space-y-3">
            {BENEFITS.map(({ emoji, label, body }) => (
              <div key={label} className="flex items-start gap-3">
                <span className="text-3xl leading-none shrink-0">{emoji}</span>
                <div>
                  <p className="font-bold text-sm text-emerald-900">{label}</p>
                  <p className="text-xs text-emerald-700">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Not yet connected ───────────────────────────────── */
        <>
          {/* Giant Facebook logo */}
          <div className="flex justify-center py-2">
            <div className="fb-pop w-28 h-28 rounded-[2rem] bg-[#1877F2] flex items-center justify-center shadow-2xl">
              <svg viewBox="0 0 24 24" fill="white" className="w-16 h-16">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            {BENEFITS.map(({ emoji, label, body }, i) => (
              <div
                key={label}
                className={`benefit-${i + 1} flex items-start gap-4 rounded-2xl bg-gray-50 border border-gray-100 p-4`}
              >
                <span className="text-4xl leading-none shrink-0">{emoji}</span>
                <div>
                  <p className="font-extrabold text-base">{label}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Big connect button */}
          <a
            href="/api/auth/facebook?return=onboarding"
            className="flex items-center justify-center gap-3 w-full min-h-[64px] rounded-3xl bg-[#1877F2] text-white font-extrabold text-lg shadow-xl active:scale-[0.97] transition-transform"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 shrink-0">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Connect with Facebook
          </a>
        </>
      )}

      {/* Nav */}
      <div className="flex gap-3 pt-1">
        <Button variant="outline" onClick={onBack} className="flex-1 min-h-[52px] rounded-2xl font-bold text-base">
          ← Back
        </Button>
        <Button onClick={onNext} className="flex-1 min-h-[52px] rounded-2xl font-bold text-base">
          {hasMessengerToken ? 'Continue →' : 'Skip for now →'}
        </Button>
      </div>
    </div>
  )
}
