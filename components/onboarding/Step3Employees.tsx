'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { computeSSS, computePhilHealth, computePagIbig, computeWithholdingTax } from '@/lib/contributions'
import type { Step3Data, EmployeeData } from '@/app/(onboarding)/onboarding/actions'

interface Step3EmployeesProps {
  clinicId: string
  initialData: Partial<Step3Data>
  onSave: (data: Step3Data) => Promise<void>
  onBack: () => void
  isSaving: boolean
}

const emptyEmployee = (): EmployeeData => ({
  fullName: '',
  position: '',
  dateHired: '',
  monthlySalary: 0,
  sssNumber: '',
  philhealthNumber: '',
  pagibigNumber: '',
  tin: '',
})

function fmt(n: number) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function Step3Employees({ initialData, onSave, onBack, isSaving }: Step3EmployeesProps) {
  const [hasEmployees, setHasEmployees] = useState(initialData.hasEmployees ?? false)
  const [sssEmployerNumber, setSssEmployerNumber] = useState(initialData.sssEmployerNumber ?? '')
  const [philhealthEmployerNumber, setPhilhealthEmployerNumber] = useState(initialData.philhealthEmployerNumber ?? '')
  const [pagibigEmployerNumber, setPagibigEmployerNumber] = useState(initialData.pagibigEmployerNumber ?? '')
  const [employees, setEmployees] = useState<EmployeeData[]>(
    initialData.employees && initialData.employees.length > 0
      ? initialData.employees
      : [emptyEmployee(), emptyEmployee()]
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
      const validEmployees = hasEmployees
        ? employees.filter(emp => emp.fullName.trim() !== '')
        : []
      await onSave({
        hasEmployees,
        sssEmployerNumber: hasEmployees ? sssEmployerNumber : undefined,
        philhealthEmployerNumber: hasEmployees ? philhealthEmployerNumber : undefined,
        pagibigEmployerNumber: hasEmployees ? pagibigEmployerNumber : undefined,
        employees: validEmployees,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Employees</h2>
        <p className="text-sm text-muted-foreground">Set up payroll and contribution tracking.</p>
      </div>

      {/* Large toggle */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between min-h-[48px]">
            <div>
              <p className="font-medium">
                {hasEmployees ? 'Yes, I have employees' : 'No employees yet'}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasEmployees
                  ? 'Payroll and contributions will be tracked.'
                  : 'You can add employees later in Settings.'}
              </p>
            </div>
            <Switch
              checked={hasEmployees}
              onCheckedChange={setHasEmployees}
            />
          </div>
        </CardContent>
      </Card>

      {hasEmployees && (
        <>
          {/* Employer numbers */}
          <div>
            <h3 className="font-medium mb-3">Employer Numbers</h3>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="sssEmployer">SSS Employer Number</Label>
                <Input
                  id="sssEmployer"
                  value={sssEmployerNumber}
                  onChange={e => setSssEmployerNumber(e.target.value)}
                  className="min-h-[48px]"
                  placeholder="03-XXXXXXX-X"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phEmployer">PhilHealth Employer Number</Label>
                <Input
                  id="phEmployer"
                  value={philhealthEmployerNumber}
                  onChange={e => setPhilhealthEmployerNumber(e.target.value)}
                  className="min-h-[48px]"
                  placeholder="XX-XXXXXXXX-X"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="piEmployer">Pag-IBIG Employer Number</Label>
                <Input
                  id="piEmployer"
                  value={pagibigEmployerNumber}
                  onChange={e => setPagibigEmployerNumber(e.target.value)}
                  className="min-h-[48px]"
                  placeholder="XXXX-XXXX-XXXX"
                />
              </div>
            </div>
          </div>

          {/* Employee rows */}
          <div className="flex flex-col gap-4">
            <h3 className="font-medium">Employees</h3>
            {employees.map((emp, idx) => {
              const salary = Number(emp.monthlySalary) || 0
              const sss = computeSSS(salary)
              const ph = computePhilHealth(salary)
              const pi = computePagIbig(salary)
              const wt = computeWithholdingTax(salary)
              const net = salary - sss.employee - ph.employee - pi.employee - wt

              return (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      Employee {idx + 1}
                      {employees.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeEmployee(idx)}
                        >
                          Remove
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                      <Label>Full Name *</Label>
                      <Input
                        value={emp.fullName}
                        onChange={e => updateEmployee(idx, 'fullName', e.target.value)}
                        className="min-h-[48px]"
                        placeholder="Juan dela Cruz"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Position *</Label>
                      <Input
                        value={emp.position}
                        onChange={e => updateEmployee(idx, 'position', e.target.value)}
                        className="min-h-[48px]"
                        placeholder="Dental Assistant"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Date Hired *</Label>
                      <Input
                        type="date"
                        value={emp.dateHired}
                        onChange={e => updateEmployee(idx, 'dateHired', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="min-h-[48px]"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Monthly Salary (₱) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={emp.monthlySalary || ''}
                        onChange={e => updateEmployee(idx, 'monthlySalary', parseFloat(e.target.value) || 0)}
                        className="min-h-[48px]"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>SSS Number *</Label>
                      <Input
                        value={emp.sssNumber}
                        onChange={e => updateEmployee(idx, 'sssNumber', e.target.value)}
                        className="min-h-[48px]"
                        placeholder="XX-XXXXXXX-X"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>PhilHealth Number *</Label>
                      <Input
                        value={emp.philhealthNumber}
                        onChange={e => updateEmployee(idx, 'philhealthNumber', e.target.value)}
                        className="min-h-[48px]"
                        placeholder="XX-XXXXXXXXX-X"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Pag-IBIG Number *</Label>
                      <Input
                        value={emp.pagibigNumber}
                        onChange={e => updateEmployee(idx, 'pagibigNumber', e.target.value)}
                        className="min-h-[48px]"
                        placeholder="XXXX-XXXX-XXXX"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>TIN (optional)</Label>
                      <Input
                        value={emp.tin}
                        onChange={e => updateEmployee(idx, 'tin', e.target.value)}
                        className="min-h-[48px]"
                        placeholder="XXX-XXX-XXX-XXX"
                      />
                    </div>

                    {salary > 0 && (
                      <Card className="bg-muted/40">
                        <CardHeader>
                          <CardTitle className="text-xs">Auto-computed contributions</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>SSS (employee)</span>
                            <span>₱{fmt(sss.employee)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>SSS (employer)</span>
                            <span>₱{fmt(sss.employer)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>PhilHealth (employee)</span>
                            <span>₱{fmt(ph.employee)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>PhilHealth (employer)</span>
                            <span>₱{fmt(ph.employer)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pag-IBIG (employee)</span>
                            <span>₱{fmt(pi.employee)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Pag-IBIG (employer)</span>
                            <span>₱{fmt(pi.employer)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Withholding Tax</span>
                            <span>₱{fmt(wt)}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                            <span>Net Pay</span>
                            <span>₱{fmt(net)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              )
            })}

            <Button
              type="button"
              variant="outline"
              onClick={addEmployee}
              className="min-h-[48px]"
            >
              + Add Employee
            </Button>
          </div>
        </>
      )}

      {!hasEmployees && (
        <Card className="bg-muted/40">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              No payroll tracking will be set up. You can add employees later in the Employees section of your dashboard.
            </p>
          </CardContent>
        </Card>
      )}

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
