'use client'

import { Progress, ProgressTrack, ProgressIndicator } from '@/components/ui/progress'

const STEP_NAMES: Record<number, string> = {
  1:  'Data Agreement',
  2:  'Clinic Info',
  3:  'BIR (Tax) Details',
  4:  'Employees',
  5:  'Monthly Expenses',
  6:  'Equipment',
  7:  'Suppliers',
  8:  'Services Offered',
  9:  'Loyalty Cards',
  10: 'Review & Finish',
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
