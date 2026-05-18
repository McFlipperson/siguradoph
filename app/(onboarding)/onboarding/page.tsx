'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { WizardProgress } from '@/components/onboarding/WizardProgress'
import { Step1Identity } from '@/components/onboarding/Step1Identity'
import { Step2BIR } from '@/components/onboarding/Step2BIR'
import { Step3Employees } from '@/components/onboarding/Step3Employees'
import { Step4Expenses } from '@/components/onboarding/Step4Expenses'
import { Step5Equipment } from '@/components/onboarding/Step5Equipment'
import { Step6Suppliers } from '@/components/onboarding/Step6Suppliers'
import { Step7Services } from '@/components/onboarding/Step7Services'
import { Step8Loyalty } from '@/components/onboarding/Step8Loyalty'
import { Step9Review } from '@/components/onboarding/Step9Review'
import {
  getClinicForCurrentUser,
  saveStep1,
  saveStep2,
  saveStep3,
  saveStep4,
  saveStep5,
  saveStep6,
  saveStep7,
  saveStep8,
  completeOnboarding,
} from './actions'
import type {
  Step1Data,
  Step2Data,
  Step3Data,
  RecurringExpenseData,
  EquipmentData,
  SupplierData,
  ServiceData,
  Step8Data,
} from './actions'

export type WizardState = {
  step1: Partial<Step1Data>
  step2: Partial<Step2Data>
  step3: Step3Data
  step4: RecurringExpenseData[]
  step5: EquipmentData[]
  step6: SupplierData[]
  step7: ServiceData[]
  step8: Step8Data
}

const TOTAL_STEPS = 9

const initialState: WizardState = {
  step1: {},
  step2: {},
  step3: { hasEmployees: false, employees: [] },
  step4: [],
  step5: [],
  step6: [],
  step7: [],
  step8: { loyaltyCardEnabled: true, loyaltyCardPrice: 500, loyaltyValidityMonths: 24, templates: [] },
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()
  const [allData, setAllData] = useState<WizardState>(initialState)
  const [loading, setLoading] = useState(true)

  // On mount: resume from last completed step
  useEffect(() => {
    async function init() {
      try {
        const clinic = await getClinicForCurrentUser()
        if (clinic) {
          setClinicId(clinic.id)

          // Populate state from clinic
          const s: WizardState = {
            step1: {
              slug: clinic.slug ?? '',
              logoUrl: clinic.logoUrl ?? null,
              clinicName: clinic.name,
              ownerName: clinic.ownerName,
              street: clinic.street,
              city: clinic.city,
              province: clinic.province,
              zip: clinic.zip,
              phone: clinic.phone,
              email: clinic.email,
              facebookPageUrl: clinic.facebookPageUrl ?? '',
              enrollmentDate: clinic.enrollmentDate
                ? new Date(clinic.enrollmentDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
            },
            step2: {
              tin: clinic.tin,
              rdoCode: clinic.rdoCode,
              corNumber: clinic.corNumber,
              entityType: clinic.entityType,
              vatRegistered: clinic.vatRegistered,
              vatRegistrationDate: clinic.vatRegistrationDate
                ? new Date(clinic.vatRegistrationDate).toISOString().split('T')[0]
                : '',
              orSeriesStart: clinic.orSeriesStart,
              filingMethod: clinic.filingMethod,
            },
            step3: {
              hasEmployees: clinic.hasEmployees,
              sssEmployerNumber: clinic.sssEmployerNumber ?? '',
              philhealthEmployerNumber: clinic.philhealthEmployerNumber ?? '',
              pagibigEmployerNumber: clinic.pagibigEmployerNumber ?? '',
              employees: clinic.employees.map(emp => ({
                fullName: emp.fullName,
                position: emp.position,
                dateHired: new Date(emp.dateHired).toISOString().split('T')[0],
                monthlySalary: Number(emp.monthlySalary),
                sssNumber: emp.sssNumber,
                philhealthNumber: emp.philhealthNumber,
                pagibigNumber: emp.pagibigNumber,
                tin: emp.tin ?? '',
              })),
            },
            step4: clinic.recurringExpenses.map(e => ({
              description: e.description,
              category: e.category,
              amount: Number(e.amount),
              payeeName: '',
              vatRegistered: false,
            })),
            step5: clinic.equipment.map(eq => ({
              name: eq.name,
              purchaseDate: new Date(eq.purchaseDate).toISOString().split('T')[0],
              purchaseCost: Number(eq.purchaseCost),
              usefulLifeYears: eq.usefulLifeYears,
            })),
            step6: clinic.suppliers.map(s => ({
              name: s.name,
              category: s.category,
              vatRegistered: s.vatRegistered,
              address: s.address ?? '',
              tin: s.tin ?? '',
            })),
            step7: clinic.serviceCatalog.map(sc => ({
              id: sc.id,
              name: sc.name,
              category: sc.category,
              isActive: sc.isActive,
              sortOrder: sc.sortOrder,
            })),
            step8: {
              loyaltyCardEnabled: clinic.loyaltyCardEnabled,
              loyaltyCardPrice: Number(clinic.loyaltyCardPrice),
              loyaltyValidityMonths: clinic.loyaltyValidityMonths,
              templates: clinic.loyaltyCardTemplates.map(t => ({
                serviceName: t.serviceName,
                isFree: t.isFree,
                tier1Uses: t.tier1Uses,
                tier1Discount: Number(t.tier1Discount),
                tier2Uses: t.tier2Uses ?? null,
                tier2Discount: t.tier2Discount !== null && t.tier2Discount !== undefined ? Number(t.tier2Discount) : null,
              })),
            },
          }
          setAllData(s)

          // Determine furthest step
          let resumeStep = 1
          if (clinic.tin) resumeStep = 2
          if (clinic.tin && (clinic.hasEmployees !== undefined)) resumeStep = 3
          if (clinic.recurringExpenses.length > 0) resumeStep = 4
          if (clinic.equipment.length > 0) resumeStep = 5
          if (clinic.suppliers.length > 0) resumeStep = 6
          if (clinic.serviceCatalog.length > 0) resumeStep = 7
          // step8 & 9 always reachable after step7
          setCurrentStep(Math.min(resumeStep, TOTAL_STEPS))
        }
      } catch {
        // Start fresh
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  function handleBack() {
    setCurrentStep(prev => Math.max(1, prev - 1))
  }

  function handleJumpToStep(step: number) {
    setCurrentStep(step)
  }

  // Step 1
  function handleSaveStep1(data: Step1Data): Promise<string> {
    return new Promise((resolve, reject) => {
      startSaving(async () => {
        try {
          const id = await saveStep1(data)
          setClinicId(id)
          setAllData(prev => ({ ...prev, step1: data }))
          setCurrentStep(2)
          resolve(id)
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  // Step 2
  function handleSaveStep2(data: Step2Data): Promise<void> {
    return new Promise((resolve, reject) => {
      startSaving(async () => {
        try {
          if (!clinicId) throw new Error('No clinic ID')
          await saveStep2(clinicId, data)
          setAllData(prev => ({ ...prev, step2: data }))
          setCurrentStep(3)
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  // Step 3
  function handleSaveStep3(data: Step3Data): Promise<void> {
    return new Promise((resolve, reject) => {
      startSaving(async () => {
        try {
          if (!clinicId) throw new Error('No clinic ID')
          await saveStep3(clinicId, data)
          setAllData(prev => ({ ...prev, step3: data }))
          setCurrentStep(4)
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  // Step 4
  function handleSaveStep4(data: RecurringExpenseData[]): Promise<void> {
    return new Promise((resolve, reject) => {
      startSaving(async () => {
        try {
          if (!clinicId) throw new Error('No clinic ID')
          await saveStep4(clinicId, data)
          setAllData(prev => ({ ...prev, step4: data }))
          setCurrentStep(5)
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  // Step 5
  function handleSaveStep5(data: EquipmentData[]): Promise<void> {
    return new Promise((resolve, reject) => {
      startSaving(async () => {
        try {
          if (!clinicId) throw new Error('No clinic ID')
          await saveStep5(clinicId, data)
          setAllData(prev => ({ ...prev, step5: data }))
          setCurrentStep(6)
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  // Step 6
  function handleSaveStep6(data: SupplierData[]): Promise<void> {
    return new Promise((resolve, reject) => {
      startSaving(async () => {
        try {
          if (!clinicId) throw new Error('No clinic ID')
          await saveStep6(clinicId, data)
          setAllData(prev => ({ ...prev, step6: data }))
          setCurrentStep(7)
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  // Step 7
  function handleSaveStep7(data: ServiceData[]): Promise<void> {
    return new Promise((resolve, reject) => {
      startSaving(async () => {
        try {
          if (!clinicId) throw new Error('No clinic ID')
          await saveStep7(clinicId, data)
          setAllData(prev => ({ ...prev, step7: data }))
          setCurrentStep(8)
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  // Step 8
  function handleSaveStep8(data: Step8Data): Promise<void> {
    return new Promise((resolve, reject) => {
      startSaving(async () => {
        try {
          if (!clinicId) throw new Error('No clinic ID')
          await saveStep8(clinicId, data)
          setAllData(prev => ({ ...prev, step8: data }))
          setCurrentStep(9)
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  // Complete
  function handleComplete(): Promise<void> {
    return new Promise((resolve, reject) => {
      startSaving(async () => {
        try {
          if (!clinicId) throw new Error('No clinic ID')
          await completeOnboarding(clinicId)
          toast('Setup complete! Welcome to Sigurado.')
          // Redirect to their clinic subdomain dashboard
          const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'sigurado.xyz'
          const slugRes = await fetch('/api/my-clinic-slug')
          if (slugRes.ok) {
            const { slug } = await slugRes.json() as { slug: string | null }
            if (slug) {
              window.location.href = `https://${slug}.${rootDomain}/`
              resolve()
              return
            }
          }
          window.location.href = '/'
          resolve()
        } catch (err) {
          toast('Something went wrong. Please try again.')
          reject(err)
        }
      })
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <WizardProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {currentStep === 1 && (
        <Step1Identity
          initialData={allData.step1}
          onSave={handleSaveStep1}
          isSaving={isSaving}
        />
      )}

      {currentStep === 2 && clinicId && (
        <Step2BIR
          clinicId={clinicId}
          initialData={allData.step2}
          onSave={handleSaveStep2}
          onBack={handleBack}
          isSaving={isSaving}
        />
      )}

      {currentStep === 3 && clinicId && (
        <Step3Employees
          initialData={allData.step3}
          onSave={handleSaveStep3}
          onBack={handleBack}
          isSaving={isSaving}
        />
      )}

      {currentStep === 4 && clinicId && (
        <Step4Expenses
          clinicId={clinicId}
          initialData={allData.step4}
          onSave={handleSaveStep4}
          onBack={handleBack}
          isSaving={isSaving}
        />
      )}

      {currentStep === 5 && clinicId && (
        <Step5Equipment
          clinicId={clinicId}
          initialData={allData.step5}
          onSave={handleSaveStep5}
          onBack={handleBack}
          isSaving={isSaving}
        />
      )}

      {currentStep === 6 && clinicId && (
        <Step6Suppliers
          clinicId={clinicId}
          initialData={allData.step6}
          onSave={handleSaveStep6}
          onBack={handleBack}
          isSaving={isSaving}
        />
      )}

      {currentStep === 7 && clinicId && (
        <Step7Services
          clinicId={clinicId}
          initialData={allData.step7}
          onSave={handleSaveStep7}
          onBack={handleBack}
          isSaving={isSaving}
        />
      )}

      {currentStep === 8 && clinicId && (
        <Step8Loyalty
          initialData={allData.step8}
          onSave={handleSaveStep8}
          onBack={handleBack}
          isSaving={isSaving}
        />
      )}

      {currentStep === 9 && clinicId && (
        <Step9Review
          clinicId={clinicId}
          allData={allData}
          onJumpToStep={handleJumpToStep}
          onComplete={handleComplete}
          onBack={handleBack}
          isSaving={isSaving}
        />
      )}
    </div>
  )
}
