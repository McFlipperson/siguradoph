'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import type { WizardState } from '@/app/(onboarding)/onboarding/page'

interface Step9ReviewProps {
  clinicId: string
  allData: WizardState
  onJumpToStep: (step: number) => void
  onComplete: () => Promise<void>
  onBack: () => void
  isSaving: boolean
}

function fmt(n: number) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function Step9Review({ allData, onJumpToStep, onComplete, onBack, isSaving }: Step9ReviewProps) {
  const step1 = allData.step1
  const step2 = allData.step2
  const step3 = allData.step3
  const step4 = allData.step4
  const step5 = allData.step5
  const step6 = allData.step6
  const step7 = allData.step7
  const step8 = allData.step8

  const totalExpenses = step4.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const totalEquipmentValue = step5.reduce((sum, e) => sum + (Number(e.purchaseCost) || 0), 0)
  const activeServices = step7.filter(s => s.isActive).length

  const enrollmentDate = step1.enrollmentDate ?? new Date().toISOString().split('T')[0]

  async function handleComplete() {
    await onComplete()
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Review & Complete</h2>
        <p className="text-sm text-muted-foreground">Double-check your setup before going live.</p>
      </div>

      {/* Step 1: Clinic Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">1. Clinic Identity</CardTitle>
          <CardAction>
            <Button type="button" variant="ghost" size="sm" onClick={() => onJumpToStep(1)}>
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="text-sm flex flex-col gap-1">
          <p className="font-medium">{step1.clinicName || '—'}</p>
          <p className="text-muted-foreground">{step1.ownerName || '—'}</p>
          {step1.street && (
            <p className="text-muted-foreground">
              {step1.street}, {step1.city}, {step1.province} {step1.zip}
            </p>
          )}
          <p className="text-muted-foreground">{step1.phone || '—'}</p>
          <p className="text-muted-foreground">{step1.email || '—'}</p>
        </CardContent>
      </Card>

      {/* Step 2: BIR */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">2. BIR Information</CardTitle>
          <CardAction>
            <Button type="button" variant="ghost" size="sm" onClick={() => onJumpToStep(2)}>
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="text-sm flex flex-col gap-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">TIN</span>
            <span>{step2.tin || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entity Type</span>
            <span>{step2.entityType?.replace('_', ' ') || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT</span>
            <span>{step2.vatRegistered ? 'Registered' : 'Non-VAT'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Filing Method</span>
            <span>{step2.filingMethod || '—'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Employees */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">3. Employees</CardTitle>
          <CardAction>
            <Button type="button" variant="ghost" size="sm" onClick={() => onJumpToStep(3)}>
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="text-sm">
          {step3.hasEmployees
            ? <p>{step3.employees.filter(e => e.fullName).length} employee(s) set up</p>
            : <p className="text-muted-foreground">No employees</p>
          }
        </CardContent>
      </Card>

      {/* Step 4: Recurring Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">4. Recurring Expenses</CardTitle>
          <CardAction>
            <Button type="button" variant="ghost" size="sm" onClick={() => onJumpToStep(4)}>
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="text-sm flex flex-col gap-1">
          <p>{step4.length} expense(s)</p>
          <p className="text-muted-foreground">Total monthly: ₱{fmt(totalExpenses)}</p>
        </CardContent>
      </Card>

      {/* Step 5: Equipment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">5. Equipment</CardTitle>
          <CardAction>
            <Button type="button" variant="ghost" size="sm" onClick={() => onJumpToStep(5)}>
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="text-sm flex flex-col gap-1">
          <p>{step5.length} item(s)</p>
          <p className="text-muted-foreground">Total value: ₱{fmt(totalEquipmentValue)}</p>
        </CardContent>
      </Card>

      {/* Step 6: Suppliers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">6. Suppliers</CardTitle>
          <CardAction>
            <Button type="button" variant="ghost" size="sm" onClick={() => onJumpToStep(6)}>
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="text-sm">
          <p>{step6.length} supplier(s)</p>
        </CardContent>
      </Card>

      {/* Step 7: Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">7. Services</CardTitle>
          <CardAction>
            <Button type="button" variant="ghost" size="sm" onClick={() => onJumpToStep(7)}>
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="text-sm">
          <p>{activeServices} active service(s) of {step7.length} total</p>
        </CardContent>
      </Card>

      {/* Step 8: Loyalty */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">8. Loyalty Card</CardTitle>
          <CardAction>
            <Button type="button" variant="ghost" size="sm" onClick={() => onJumpToStep(8)}>
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="text-sm">
          <p>{step8.loyaltyCardEnabled ? 'Enabled — ₱500, 2-year validity' : 'Disabled'}</p>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1 min-h-[48px]">
          ← Back
        </Button>
        <Button
          type="button"
          onClick={handleComplete}
          disabled={isSaving}
          className="flex-1 min-h-[56px] text-base font-semibold"
        >
          {isSaving ? 'Setting up…' : 'Complete Setup ✓'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Records will be tracked starting from your enrollment date: {enrollmentDate}.
        You can update your settings at any time from the dashboard.
      </p>
    </div>
  )
}
