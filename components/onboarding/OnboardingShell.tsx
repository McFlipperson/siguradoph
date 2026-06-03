'use client'

import Image from 'next/image'

type Theme = 'blue' | 'gold' | 'red' | 'purple'

const GRADIENTS: Record<Theme, string> = {
  blue:   'from-blue-700 via-blue-800 to-blue-900',
  gold:   'from-amber-400 via-amber-500 to-yellow-600',
  red:    'from-red-600 via-red-700 to-red-800',
  purple: 'from-blue-700 via-purple-700 to-red-700',
}

const BAR_COLOR: Record<Theme, string> = {
  blue:   'bg-white',
  gold:   'bg-blue-800',
  red:    'bg-white',
  purple: 'bg-white',
}

export type StepConfig = {
  theme: Theme
  emoji: string
  title: string
  subtitle: string
}

export const STEP_CONFIGS: Record<number, StepConfig> = {
  1: { theme: 'blue',   emoji: '🔒', title: 'Your patients are protected',  subtitle: 'Quick privacy setup — takes 30 seconds'    },
  2: { theme: 'gold',   emoji: '🏥', title: "Let's build your clinic",      subtitle: 'Tell us about your practice'               },
  3: { theme: 'red',    emoji: '🦷', title: 'What do you offer?',           subtitle: 'Tap to select — you can edit anytime'      },
  4: { theme: 'blue',   emoji: '💳', title: 'Keep patients coming back',    subtitle: 'Set up your loyalty card program'          },
  5: { theme: 'purple', emoji: '💬', title: 'Never miss a reminder',        subtitle: 'Connect Messenger for automatic reminders' },
}

const SHELL_STYLES = `
  @keyframes emojiPop {
    0%   { transform: scale(0.2) rotate(-15deg); opacity: 0; }
    55%  { transform: scale(1.25) rotate(6deg);  opacity: 1; }
    75%  { transform: scale(0.92) rotate(-3deg); }
    90%  { transform: scale(1.05) rotate(1deg);  }
    100% { transform: scale(1)    rotate(0deg);  opacity: 1; }
  }
  @keyframes emojiFloat {
    0%, 100% { transform: translateY(0px) scale(1); }
    50%      { transform: translateY(-14px) scale(1.06); }
  }
  @keyframes progressGrow {
    from { width: 0%; }
  }
  @keyframes slideUpIn {
    from { opacity: 0; transform: translateY(36px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  .ob-emoji-pop   { animation: emojiPop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
  .ob-emoji-float { animation: emojiFloat 2.8s ease-in-out 0.65s infinite; }
  .ob-progress    { animation: progressGrow 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .ob-slide-up    { animation: slideUpIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
`

export function OnboardingShell({
  step,
  totalSteps,
  children,
}: {
  step: number
  totalSteps: number
  children: React.ReactNode
}) {
  const config = STEP_CONFIGS[step]
  if (!config) return <>{children}</>

  const gradient  = GRADIENTS[config.theme]
  const barColor  = BAR_COLOR[config.theme]
  const pct       = Math.round((step / totalSteps) * 100)

  return (
    <div className="min-h-screen flex flex-col">
      <style>{SHELL_STYLES}</style>

      {/* ── Gradient hero ─────────────────────────────────────────── */}
      <div className={`bg-gradient-to-br ${gradient} px-5 pt-6 pb-20 relative`}>

        {/* Logo + step counter */}
        <div className="flex items-center justify-between mb-5">
          <Image src="/images/s-logo-ph.png" alt="Sigurado" width={38} height={38} className="drop-shadow-lg" />
          <span className="text-white/80 text-sm font-bold tracking-wide">
            {step} <span className="opacity-50">/</span> {totalSteps}
          </span>
        </div>

        {/* Fat progress bar */}
        <div className="w-full h-4 rounded-full bg-white/20 overflow-hidden mb-8 shadow-inner">
          <div
            key={`bar-${step}`}
            className={`h-full rounded-full ob-progress ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Giant bouncing emoji */}
        <div className="flex flex-col items-center text-center gap-3">
          <div key={`emoji-${step}`} className="leading-none select-none">
            <span className="ob-emoji-pop ob-emoji-float inline-block text-[96px] drop-shadow-2xl">
              {config.emoji}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white leading-tight tracking-tight">
            {config.title}
          </h1>
          <p className="text-white/80 text-sm px-6 leading-relaxed">
            {config.subtitle}
          </p>
        </div>
      </div>

      {/* ── White content card slides up ──────────────────────────── */}
      <div
        key={`content-${step}`}
        className="flex-1 bg-background rounded-t-[2rem] -mt-10 px-5 pt-7 pb-28 shadow-[0_-8px_40px_rgba(0,0,0,0.18)] ob-slide-up"
      >
        {children}
      </div>
    </div>
  )
}
