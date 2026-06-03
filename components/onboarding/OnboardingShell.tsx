'use client'

import Image from 'next/image'

// ─── Theme definitions ────────────────────────────────────────────────────────

type Theme = 'blue' | 'gold' | 'red' | 'purple'

const GRADIENTS: Record<Theme, string> = {
  blue:   'from-blue-700 via-blue-800 to-blue-900',
  gold:   'from-amber-400 via-amber-500 to-yellow-600',
  red:    'from-red-600 via-red-700 to-red-800',
  purple: 'from-blue-700 via-purple-700 to-red-700',
}

// ─── Step config ─────────────────────────────────────────────────────────────

export type StepConfig = {
  theme: Theme
  emoji: string
  title: string
  subtitle: string
}

export const STEP_CONFIGS: Record<number, StepConfig> = {
  1: { theme: 'blue',   emoji: '🔒', title: 'Your patients are protected',  subtitle: 'Quick privacy setup — takes 30 seconds'       },
  2: { theme: 'gold',   emoji: '🏥', title: "Let’s build your clinic", subtitle: 'Tell us about your practice'                  },
  3: { theme: 'red',    emoji: '🦷', title: 'What do you offer?',           subtitle: 'Tap to select — you can edit anytime'         },
  4: { theme: 'blue',   emoji: '💳', title: 'Keep patients coming back',    subtitle: 'Set up your loyalty card program'              },
  5: { theme: 'purple', emoji: '💬', title: 'Never miss a reminder',        subtitle: 'Connect Messenger for automatic reminders'    },
}

// ─── Milestone dots ───────────────────────────────────────────────────────────

function MilestoneDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div
            key={step}
            className={`transition-all duration-300 rounded-full flex items-center justify-center text-[10px] font-bold
              ${active  ? 'w-7 h-7 bg-white text-blue-800 shadow-lg scale-110' : ''}
              ${done    ? 'w-5 h-5 bg-white/70 text-blue-800' : ''}
              ${!active && !done ? 'w-4 h-4 bg-white/30 text-white/60' : ''}
            `}
          >
            {done ? '✓' : step}
          </div>
        )
      })}
    </div>
  )
}

// ─── OnboardingShell ──────────────────────────────────────────────────────────

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
  const gradient = GRADIENTS[config.theme]

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Gradient hero header ── */}
      <div className={`bg-gradient-to-br ${gradient} px-5 pt-5 pb-14 relative`}>
        {/* Top bar: logo + milestone dots */}
        <div className="flex items-center justify-between mb-8">
          <Image
            src="/images/s-logo-ph.png"
            alt="Sigurado"
            width={36}
            height={36}
            className="drop-shadow-md"
          />
          <MilestoneDots current={step} total={totalSteps} />
          <span className="text-xs text-white/70 font-medium">{step}/{totalSteps}</span>
        </div>

        {/* Hero content */}
        <div className="text-center pb-2">
          <div className="text-6xl mb-3 drop-shadow-sm">{config.emoji}</div>
          <h1 className="text-2xl font-bold text-white leading-tight">{config.title}</h1>
          <p className="text-white/75 mt-1.5 text-sm">{config.subtitle}</p>
        </div>
      </div>

      {/* ── White content card — slides up over header ── */}
      <div className="flex-1 bg-background rounded-t-3xl -mt-7 px-5 pt-6 pb-28 shadow-[0_-4px_24px_rgba(0,0,0,0.12)]">
        {children}
      </div>
    </div>
  )
}
