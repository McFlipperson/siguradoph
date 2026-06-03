'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { OnboardingShell } from '@/components/onboarding/OnboardingShell'
import { CelebrationStep } from '@/components/onboarding/CelebrationStep'
import { Step1DPA } from '@/components/onboarding/Step1DPA'
import { Step1Identity } from '@/components/onboarding/Step1Identity'
import { Step7Services } from '@/components/onboarding/Step7Services'
import { Step8Loyalty } from '@/components/onboarding/Step8Loyalty'
import { Step9Messenger } from '@/components/onboarding/Step9Messenger'
import {
  getClinicForCurrentUser,
  saveStep1,
  saveStep7,
  saveStep8,
  completeOnboarding,
} from './actions'
import type {
  Step1Data,
  Step2Data,
  Step8Data,
  ServiceData,
} from './actions'

// ─── Step config ──────────────────────────────────────────────────────────────
// Step 1: DPA
// Step 2: Clinic Identity
// Step 3: Services
// Step 4: Loyalty Cards
// Step 5: Messenger
// Step 6: Celebration (no shell)
const TOTAL_STEPS = 5 // shell steps only (celebration is fullscreen, no shell)

// ─── Types ────────────────────────────────────────────────────────────────────

export type WizardState = {
  tosAcceptedAt: Date | null
  step1: Partial<Step1Data>
  step2: Partial<Step2Data>  // kept for resume compat, not shown
  step7: ServiceData[]
  step8: Step8Data
}

const initialState: WizardState = {
  tosAcceptedAt: null,
  step1: {},
  step2: {},
  step7: [],
  step8: { loyaltyCardEnabled: true, loyaltyCardPrice: 500, loyaltyValidityMonths: 24, templates: [] },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()
  const [allData, setAllData] = useState<WizardState>(initialState)
  const [loading, setLoading] = useState(true)
  const [hasMessengerToken, setHasMessengerToken] = useState(false)
  const [clinicName, setClinicName] = useState('')

  // Facebook OAuth return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('messenger') === 'connected') {
      setHasMessengerToken(true)
      setCurrentStep(5)
      window.history.replaceState({}, '', '/onboarding')
    }
  }, [])

  // Resume from last completed step
  useEffect(() => {
    async function init() {
      try {
        const clinic = await getClinicForCurrentUser()
        if (clinic) {
          setClinicId(clinic.id)
          setClinicName(clinic.name)
          if (clinic.messengerToken) setHasMessengerToken(true)

          setAllData(prev => ({
            ...prev,
            step1: {
              slug: clinic.slug ?? '',
              logoUrl: clinic.logoUrl ?? null,
              signatureUrl: clinic.signatureUrl ?? null,
              clinicName: clinic.name,
              ownerName: clinic.ownerName,
              street: clinic.street,
              city: clinic.city,
              province: clinic.province,
              zip: clinic.zip,
              phone: clinic.phone,
              email: clinic.email,
              facebookPageUrl: clinic.facebookPageUrl ?? '',
              accountantEmail: clinic.accountantEmail ?? '',
              gcashNumber: clinic.gcashNumber ?? '',
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
                tier2Discount: t.tier2Discount != null ? Number(t.tier2Discount) : null,
              })),
            },
          }))

          // Resume at the right step
          let resume = 2
          if (clinic.serviceCatalog.length > 0) resume = 4
          if (clinic.loyaltyCardTemplates.length > 0) resume = 5
          if (clinic.messengerToken) resume = 6
          setCurrentStep(Math.min(resume, 6))
        } else {
          // Brand-new user: prefill clinic name captured at registration
          const pendingName = localStorage.getItem('sigurado_clinic_name')
          if (pendingName) {
            setClinicName(pendingName)
            setAllData(prev => ({ ...prev, step1: { ...prev.step1, clinicName: pendingName } }))
            localStorage.removeItem('sigurado_clinic_name')
          }
        }
      } catch {
        // Start fresh
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleAcceptDPA() {
    setAllData(prev => ({ ...prev, tosAcceptedAt: new Date() }))
    setCurrentStep(2)
  }

  function handleSaveIdentity(data: Step1Data): Promise<string> {
    return new Promise((resolve, reject) => {
      startSaving(async () => {
        try {
          const id = await saveStep1(data, allData.tosAcceptedAt ?? undefined)
          setClinicId(id)
          setClinicName(data.clinicName)
          setAllData(prev => ({ ...prev, step1: data }))
          setCurrentStep(3)
          resolve(id)
        } catch (err) { reject(err) }
      })
    })
  }

  function handleSaveServices(data: ServiceData[]): Promise<void> {
    return new Promise((resolve, reject) => {
      startSaving(async () => {
        try {
          if (!clinicId) throw new Error('No clinic ID')
          await saveStep7(clinicId, data)
          setAllData(prev => ({ ...prev, step7: data }))
          setCurrentStep(4)
          resolve()
        } catch (err) { reject(err) }
      })
    })
  }

  function handleSaveLoyalty(data: Step8Data): Promise<void> {
    return new Promise((resolve, reject) => {
      startSaving(async () => {
        try {
          if (!clinicId) throw new Error('No clinic ID')
          await saveStep8(clinicId, data)
          setAllData(prev => ({ ...prev, step8: data }))
          setCurrentStep(5)
          resolve()
        } catch (err) { reject(err) }
      })
    })
  }

  function handleComplete(): Promise<void> {
    return new Promise((resolve, reject) => {
      startSaving(async () => {
        try {
          if (!clinicId) throw new Error('No clinic ID')
          await completeOnboarding(clinicId)
          toast('Setup complete! Welcome to Sigurado. 🎉')
          const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'sigurado.xyz'
          const selectedPlan = localStorage.getItem('sigurado_selected_plan')
          localStorage.removeItem('sigurado_selected_plan')
          const dest = selectedPlan === 'basic' || selectedPlan === 'pro'
            ? `/billing?upgrade=${selectedPlan}`
            : '/patients/intake'
          const slugRes = await fetch('/api/my-clinic-slug')
          if (slugRes.ok) {
            const { slug } = await slugRes.json() as { slug: string | null }
            if (slug) {
              window.location.href = `https://${slug}.${rootDomain}${dest}`
              resolve()
              return
            }
          }
          window.location.href = dest
          resolve()
        } catch (err) {
          toast('Something went wrong. Please try again.')
          reject(err)
        }
      })
    })
  }

  function handleBack() {
    setCurrentStep(prev => Math.max(1, prev - 1))
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 to-blue-900">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-pulse">🏥</div>
          <p className="text-white/80 text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  // Celebration is full-screen, no shell
  if (currentStep === 6) {
    return (
      <CelebrationStep
        clinicName={clinicName}
        onComplete={handleComplete}
        isSaving={isSaving}
      />
    )
  }

  return (
    <OnboardingShell step={currentStep} totalSteps={TOTAL_STEPS}>

      {currentStep === 1 && (
        <Step1DPA onAccept={handleAcceptDPA} isSaving={isSaving} />
      )}

      {currentStep === 2 && (
        <Step1Identity
          initialData={allData.step1}
          onSave={handleSaveIdentity}
          isSaving={isSaving}
        />
      )}

      {currentStep === 3 && clinicId && (
        <Step7Services
          clinicId={clinicId}
          initialData={allData.step7}
          onSave={handleSaveServices}
          onBack={handleBack}
          isSaving={isSaving}
        />
      )}

      {currentStep === 4 && clinicId && (
        <Step8Loyalty
          initialData={allData.step8}
          onSave={handleSaveLoyalty}
          onBack={handleBack}
          isSaving={isSaving}
        />
      )}

      {currentStep === 5 && clinicId && (
        <Step9Messenger
          hasMessengerToken={hasMessengerToken}
          onNext={() => setCurrentStep(6)}
          onBack={handleBack}
        />
      )}

    </OnboardingShell>
  )
}
