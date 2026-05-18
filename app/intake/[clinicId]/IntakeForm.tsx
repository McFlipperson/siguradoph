'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { submitIntake, type IntakeFormData } from './actions'

type Clinic = { id: string; name: string; logoUrl?: string | null }

const GUARDIAN_RELATIONSHIPS = [
  'Mother',
  'Father',
  'Legal Guardian',
  'Grandparent',
  'Sibling (18+)',
  'Other',
]

export function IntakeForm({ clinic }: { clinic: Clinic }) {
  // Personal info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  // Medical info
  const [medicalHistory, setMedicalHistory] = useState('')
  const [medications, setMedications] = useState('')
  const [allergies, setAllergies] = useState('')

  // Consent
  const consentRef = useRef<HTMLDivElement>(null)
  const [hasScrolledConsent, setHasScrolledConsent] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)

  // Minor
  const [isMinor, setIsMinor] = useState(false)
  const [guardianName, setGuardianName] = useState('')
  const [guardianRelationship, setGuardianRelationship] = useState('')

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submittedName, setSubmittedName] = useState('')

  function handleConsentScroll() {
    const el = consentRef.current
    if (!el || hasScrolledConsent) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 16) {
      setHasScrolledConsent(true)
    }
  }

  const guardianComplete =
    !isMinor || (guardianName.trim() !== '' && guardianRelationship !== '')

  const canSubmit =
    firstName.trim() &&
    lastName.trim() &&
    dateOfBirth &&
    address.trim() &&
    phone.trim() &&
    medicalHistory.trim() &&
    medications.trim() &&
    allergies.trim() &&
    consentChecked &&
    guardianComplete

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setSubmitError(null)

    const data: IntakeFormData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth,
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      medicalHistory: medicalHistory.trim(),
      medications: medications.trim(),
      allergies: allergies.trim(),
      isMinor,
      guardianName: isMinor ? guardianName.trim() : undefined,
      guardianRelationship: isMinor ? guardianRelationship : undefined,
    }

    const result = await submitIntake(clinic.id, data)
    setSubmitting(false)

    if (!result.success) {
      if (result.error === 'day_one') {
        setSubmitError(
          'This clinic is not yet accepting digital records. Please ask the front desk for assistance.'
        )
      } else {
        setSubmitError(
          'Something went wrong. Please try again or ask the front desk for help.'
        )
      }
      return
    }

    setSubmittedName(result.firstName)
    setSubmitted(true)
  }

  // Thank you screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Thank you, {submittedName}!
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Your information has been submitted. Please let the front desk know
            you are done.
          </p>
        </div>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8 text-center">
          {clinic.logoUrl && (
            <div className="flex justify-center mb-4">
              <Image
                src={clinic.logoUrl}
                alt={clinic.name}
                width={80}
                height={80}
                className="h-20 w-auto object-contain"
                unoptimized
              />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{clinic.name}</h1>
          <p className="text-lg font-semibold text-gray-700 mt-1">
            Patient Intake Form
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Please fill out all sections completely. Your information is kept
            private and secure.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* Section 1 — Personal Information */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Personal Information
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  max={today}
                  onChange={e => setDateOfBirth(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complete address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                  autoComplete="street-address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  autoComplete="tel"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="email"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional — used to send appointment reminders via Facebook
                  Messenger
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 — Medical Information */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-1 pb-2 border-b border-gray-200">
              Medical Background
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              This helps your dentist provide safe and appropriate care.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Existing medical conditions{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={medicalHistory}
                  onChange={e => setMedicalHistory(e.target.value)}
                  rows={3}
                  placeholder="e.g. diabetes, hypertension, heart condition, asthma — write None if not applicable"
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current medications <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={medications}
                  onChange={e => setMedications(e.target.value)}
                  rows={3}
                  placeholder="List all medications including vitamins and supplements. Write None if not applicable"
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Known allergies <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={allergies}
                  onChange={e => setAllergies(e.target.value)}
                  rows={2}
                  placeholder="e.g. penicillin, latex, aspirin. Write None if not applicable"
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-gray-400"
                  required
                />
              </div>
            </div>
          </section>

          {/* Section 3 — Consent */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Patient Consent Form
            </h2>

            {/* Scrollable consent card */}
            <div className="relative">
              <div
                ref={consentRef}
                onScroll={handleConsentScroll}
                className="border-2 border-gray-200 rounded-xl bg-gray-50 p-4 h-64 overflow-y-auto text-sm text-gray-700 leading-relaxed space-y-4"
              >
                <p>
                  I, the undersigned, voluntarily provide the information in
                  this form for the purpose of receiving dental care at{' '}
                  <strong>{clinic.name}</strong>.
                </p>

                <div>
                  <p className="font-semibold mb-1">DATA PRIVACY</p>
                  <p>
                    I consent to {clinic.name} collecting, storing, and using
                    my personal information and health records to provide dental
                    services. I understand my information is classified as
                    Sensitive Personal Information under Republic Act 10173
                    (Data Privacy Act of 2012) and will be kept strictly
                    confidential. It will not be shared with third parties
                    without my consent except as required by law. I may request
                    access, correction, or deletion of my records at any time by
                    contacting the clinic.
                  </p>
                </div>

                <div>
                  <p className="font-semibold mb-1">ACCURACY OF INFORMATION</p>
                  <p>
                    I declare that all information I have provided in this form
                    is true, accurate, and complete to the best of my knowledge.
                    I understand that withholding or misrepresenting medical
                    information may affect the safety and quality of my
                    treatment.
                  </p>
                </div>

                <div>
                  <p className="font-semibold mb-1">
                    TREATMENT AND ANESTHESIA
                  </p>
                  <p>
                    I consent to dental examination, diagnosis, and treatment as
                    recommended by the attending dentist. I understand that some
                    procedures may require local anesthesia and/or minor
                    surgery. I acknowledge the associated risks including
                    allergic reactions, bleeding, swelling, infection, and
                    anesthesia-related complications. The dentist will explain
                    any procedure before performing it and I retain the right to
                    ask questions or refuse treatment at any time.
                  </p>
                </div>

                <div>
                  <p className="font-semibold mb-1">
                    FOR PATIENTS UNDER 18 YEARS OF AGE
                  </p>
                  <p>
                    If the patient is a minor, a parent or legal guardian must
                    provide consent on their behalf by completing the section
                    below.
                  </p>
                </div>
              </div>

              {/* Scroll prompt — fades out once scrolled */}
              {!hasScrolledConsent && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 to-transparent rounded-b-xl pointer-events-none flex items-end justify-center pb-1">
                  <span className="text-xs text-gray-400 animate-bounce">
                    ↓ Scroll to read
                  </span>
                </div>
              )}
            </div>

            {/* Consent checkbox */}
            <label
              className={`flex items-start gap-3 mt-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                hasScrolledConsent
                  ? 'border-gray-300 bg-white'
                  : 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
              }`}
            >
              <input
                type="checkbox"
                checked={consentChecked}
                disabled={!hasScrolledConsent}
                onChange={e => setConsentChecked(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded accent-blue-600 flex-shrink-0"
              />
              <span className="text-sm text-gray-700 leading-snug">
                {isMinor
                  ? 'I am the parent or legal guardian of the patient named above. I have read and fully understood this consent form and I give consent on their behalf for all terms above.'
                  : 'I have read and fully understood this consent form and I agree to all terms above.'}
              </span>
            </label>
            {!hasScrolledConsent && (
              <p className="text-xs text-gray-400 mt-1 text-center">
                Please scroll through the consent text above to enable this
                checkbox.
              </p>
            )}

            {/* Minor toggle */}
            <div className="mt-4 p-4 border border-gray-200 rounded-xl">
              <label className="flex items-center justify-between min-h-[48px] cursor-pointer">
                <span className="text-sm font-medium text-gray-700">
                  Is this patient under 18 years old?
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isMinor}
                  onClick={() => {
                    setIsMinor(v => !v)
                    if (isMinor) {
                      setGuardianName('')
                      setGuardianRelationship('')
                    }
                  }}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isMinor ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      isMinor ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              {isMinor && (
                <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guardian full name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={guardianName}
                      onChange={e => setGuardianName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship to patient{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={guardianRelationship}
                      onChange={e => setGuardianRelationship(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    >
                      <option value="">Select relationship</option>
                      {GUARDIAN_RELATIONSHIPS.map(r => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Error message */}
          {submitError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {submitError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full min-h-[56px] bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg
                  className="animate-spin w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Submitting…
              </>
            ) : (
              'Submit'
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            Your information is protected under RA 10173 (Data Privacy Act of
            2012).
          </p>
        </form>
      </div>
    </div>
  )
}
