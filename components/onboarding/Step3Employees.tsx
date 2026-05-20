'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Step3Data, EmployeeData } from '@/app/(onboarding)/onboarding/actions'

interface Step3EmployeesProps {
  initialData: Partial<Step3Data>
  onSave: (data: Step3Data) => Promise<void>
  onBack: () => void
  isSaving: boolean
}

const emptyEmployee = (): EmployeeData => ({
  fullName: '',
  position: '',
  dateHired: new Date().toISOString().split('T')[0],
  monthlySalary: 0,
  sssNumber: '',
  philhealthNumber: '',
  pagibigNumber: '',
  tin: '',
})

export function Step3Employees({ initialData, onSave, onBack, isSaving }: Step3EmployeesProps) {
  const [employees, setEmployees] = useState<EmployeeData[]>(
    initialData.employees && initialData.employees.length > 0
      ? initialData.employees
      : []
  )
  const [error, setError] = useState<string | null>(null)

  function updateEmployee(index: number, field: keyof EmployeeData, value: string | number) {
    setEmployees(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function addEmployee() {
    setEmployees(prev => [...prev, emptyEmployee()])
  }

  function removeEmployee(index: number) {
    setEmployees(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const valid = employees.filter(e => e.fullName.trim() !== '')
      await onSave({
        hasEmployees: valid.length > 0,
        sssEmployerNumber: initialData.sssEmployerNumber ?? '',
        philhealthEmployerNumber: initialData.philhealthEmployerNumber ?? '',
        pagibigEmployerNumber: initialData.pagibigEmployerNumber ?? '',
        employees: valid,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Employees</h2>
        <p className="text-sm text-muted-foreground">Add staff who will be on payroll. You can skip this and add them later.</p>
      </div>

      {employees.length === 0 ? (
        <Card className="bg-muted/40">
          <CardContent className="pt-5 pb-5 text-center">
            <p className="text-sm text-muted-foreground">No employees added — that&apos;s fine. Add them later in the dashboard.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {employees.map((emp, idx) => (
            <Card key={idx}>
              <CardContent className="pt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Employee {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeEmployee(idx)}
                    className="text-muted-foreground hover:text-destructive text-lg leading-none"
                    aria-label="Remove employee"
                  >
                    ×
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Name</Label>
                  <Input
                    value={emp.fullName}
                    onChange={e => updateEmployee(idx, 'fullName', e.target.value)}
                    placeholder="Juan dela Cruz"
                    className="min-h-[48px]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Position</Label>
                  <Input
                    value={emp.position}
                    onChange={e => updateEmployee(idx, 'position', e.target.value)}
                    placeholder="Dental Assistant"
                    className="min-h-[48px]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Monthly Salary (₱)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={emp.monthlySalary || ''}
                    onChange={e => updateEmployee(idx, 'monthlySalary', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="min-h-[48px]"
                  />
                  <p className="text-xs text-muted-foreground">Daily-paid? Daily rate × 26 days (e.g. ₱500/day = ₱13,000/month)</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Date Hired</Label>
                  <Input
                    type="date"
                    value={emp.dateHired}
                    onChange={e => updateEmployee(idx, 'dateHired', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="min-h-[48px]"
                  />
                </div>
                <div className="rounded-lg bg-muted/50 border border-border px-3 py-2.5">
                  <p className="text-xs font-medium mb-1">Government numbers — where to find them</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">These are on the employee&apos;s <strong>UMID card</strong> (the unified government ID), or on their individual SSS, PhilHealth, and Pag-IBIG ID cards. You can also ask the employee directly — they should know their own numbers. All fields are optional; you can add them later.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>SSS (Social Security System) Number <span className="text-muted-foreground">(optional)</span></Label>
                  <Input
                    value={emp.sssNumber}
                    onChange={e => updateEmployee(idx, 'sssNumber', e.target.value)}
                    placeholder="XX-XXXXXXX-X"
                    className="min-h-[48px]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>PhilHealth (Philippine Health Insurance) Number <span className="text-muted-foreground">(optional)</span></Label>
                  <Input
                    value={emp.philhealthNumber}
                    onChange={e => updateEmployee(idx, 'philhealthNumber', e.target.value)}
                    placeholder="XX-XXXXXXXXX-X"
                    className="min-h-[48px]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Pag-IBIG (Home Development Mutual Fund) Number <span className="text-muted-foreground">(optional)</span></Label>
                  <Input
                    value={emp.pagibigNumber}
                    onChange={e => updateEmployee(idx, 'pagibigNumber', e.target.value)}
                    placeholder="XXXX-XXXX-XXXX"
                    className="min-h-[48px]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>TIN (Tax Identification Number) <span className="text-muted-foreground">(optional)</span></Label>
                  <Input
                    value={emp.tin}
                    onChange={e => updateEmployee(idx, 'tin', e.target.value)}
                    placeholder="XXX-XXX-XXX-XXX"
                    className="min-h-[48px]"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" onClick={addEmployee} className="min-h-[48px]">
        + Add Employee
      </Button>

      <p className="text-xs text-muted-foreground">
        You can add, edit, or remove employees anytime from the Employees section in your dashboard.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1 min-h-[48px]">
          ← Back
        </Button>
        <Button type="submit" disabled={isSaving} className="flex-1 min-h-[48px]">
          {isSaving ? 'Saving…' : 'Next →'}
        </Button>
      </div>
    </form>
  )
}
