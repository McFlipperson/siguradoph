'use client'

import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress'

const STEP_NAMES: Record<number, string> = {
  1: 'Clinic Info',
  2: 'BIR (Tax) Details',
  3: 'Employees',
  4: 'Monthly Expenses',
  5: 'Equipment',
  6: 'Suppliers',
  7: 'Services Offered',
  8: 'Loyalty Cards',
  9: 'Review & Finish',
}

interface WizardProgressProps {
  currentStep: number
  totalSteps: number
}

export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  const pct = Math.round((currentStep / totalSteps) * 100)
  const stepName = STEP_NAMES[currentStep] ?? ''

  return (
    <div className="mb-6 flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="font-semibold">{stepName}</span>
          <span className="text-muted-foreground ml-2">Step {currentStep} of {totalSteps}</span>
        </div>
        <span className="text-muted-foreground">{pct}%</span>
      </div>
      <Progress value={pct}>
        <ProgressTrack>
          <ProgressIndicator style={{ width: `${pct}%` }} />
        </ProgressTrack>
      </Progress>
    </div>
  )
}
