'use client'

import { ProgressTrack, ProgressIndicator } from '@/components/ui/progress'

interface WizardProgressProps {
  currentStep: number
  totalSteps: number
}

export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  const pct = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className="mb-6 min-h-[48px] flex flex-col justify-center gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Step {currentStep} of {totalSteps}</span>
        <span className="text-muted-foreground">{pct}%</span>
      </div>
      <ProgressTrack>
        <ProgressIndicator style={{ width: `${pct}%` }} />
      </ProgressTrack>
    </div>
  )
}
