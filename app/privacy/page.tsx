import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Sigurado',
  description:
    'How Sigurado collects, uses, and protects patient data under the Philippine Data Privacy Act (Republic Act 10173).',
}

const LAST_UPDATED = 'May 30, 2026'
const DPO_EMAIL = 'privacy@sigurado.xyz'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Nav */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link href="/landing" className="font-bold text-lg tracking-tight text-primary">
            Sigurado
          </Link>
          <span className="text-xs text-gray-400 hidden sm:block">Privacy Policy</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 space-y-10">

        {/* Hero */}
        <section className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm-1-7a1 1 0 00-1 1v3a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            RA 10173 Compliant
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
          <p className="text-base text-gray-700 leading-relaxed">
            Sigurado is built specifically for Philippine dental clinics. Patient health records are
            Sensitive Personal Information (SPI) under the{' '}
            <strong>Data Privacy Act of 2012 (Republic Act 10173)</strong>. We designed every part of
            this system around that reality — not as a compliance afterthought, but as a core feature.
          </p>
        </section>

        <Divider />

        {/* Roles */}
        <Section title="Who is responsible for your data?">
          <p>
            Under RA 10173, a <strong>Personal Information Controller (PIC)</strong> determines the
            purpose and means of processing personal data. A{' '}
            <strong>Personal Information Processor (PIP)</strong> processes data on behalf of a PIC.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <DefinitionItem
              term="Your clinic (the dental practice)"
              def="The PIC. Your clinic decides what data to collect about patients, why, and for how long. Your clinic bears primary legal responsibility to patients under RA 10173."
            />
            <DefinitionItem
              term="Sigurado (operated by AI Matters)"
              def="The PIP. We process patient data only on your clinic's documented instructions. We do not use patient records for any purpose beyond operating the software for your clinic."
            />
          </ul>
          <p className="mt-3 text-sm text-gray-600">
            This arrangement is formalized in our Data Processing Agreement, which every clinic accepts
            upon enrollment.
          </p>
        </Section>

        <Divider />

        {/* What we collect */}
        <Section title="What data we collect and why">
          <p className="text-sm text-gray-600 mb-3">
            We collect only what is necessary for the specific purpose stated. Under Section 11 of
            RA 10173, personal data must be collected for specified, explicit, and legitimate purposes.
          </p>
          <div className="space-y-4">
            <DataTable
              category="Patient identity"
              examples="Full name, date of birth, sex, contact number, address"
              purpose="Required to create and link patient records; BIR-required fields for official receipts"
              basis="Contract performance; legal obligation"
            />
            <DataTable
              category="Health records (SPI)"
              examples="Medical history, dental chart, diagnoses, procedures performed, prescriptions"
              purpose="Core clinical records — cannot operate as a dental practice without these"
              basis="Necessity for medical treatment under Section 12(c) of RA 10173"
            />
            <DataTable
              category="Payment records"
              examples="Invoice amounts, payment method, OR numbers"
              purpose="Billing, official receipts, BIR compliance, loyalty card management"
              basis="Contract performance; legal obligation (BIR, NIRC)"
            />
            <DataTable
              category="Messenger / contact identifiers"
              examples="Facebook Messenger PSID (if patient opts in for reminders)"
              purpose="Sending appointment and follow-up reminders via the channel the patient chose"
              basis="Consent — patient explicitly opts in"
            />
            <DataTable
              category="Clinic staff"
              examples="Full name, email, phone (admin and secretary accounts only)"
              purpose="Authentication, access control, audit logs"
              basis="Contract performance"
            />
          </div>
          <p className="mt-4 text-sm text-gray-600">
            <strong>We do not collect:</strong> government IDs, PhilHealth/SSS/TIN numbers (beyond what
            clinics choose to record), financial account numbers, or biometric data.
          </p>
        </Section>

        <Divider />

        {/* Sensitive PI callout */}
        <section className="rounded-2xl bg-amber-50 border border-amber-200 p-5 space-y-2">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-amber-800">Patient health records are Sensitive Personal Information</p>
              <p className="text-sm text-amber-700 mt-1">
                Section 3(l) of RA 10173 explicitly classifies health, medical, and dental information as
                Sensitive Personal Information. This triggers stricter processing standards, mandatory
                clinic registration with the NPC (if the clinic processes SPI of 1,000 or more individuals),
                and heightened security obligations for both the clinic and Sigurado.
              </p>
            </div>
          </div>
        </section>

        <Divider />

        {/* How we protect it */}
        <Section title="How we protect your data">
          <ul className="space-y-3 text-sm">
            <SecurityItem
              icon="🔒"
              title="Encryption in transit and at rest"
              detail="All data is transmitted over TLS 1.2+. Data at rest is encrypted by our infrastructure provider."
            />
            <SecurityItem
              icon="🏗️"
              title="Multi-tenant isolation"
              detail="Each clinic's data is logically isolated using Supabase Row-Level Security (RLS). A logged-in user for Clinic A cannot query, view, or modify any data belonging to Clinic B — enforced at the database layer, not just application code."
            />
            <SecurityItem
              icon="📋"
              title="Audit logs"
              detail="All write operations (visit records, payments, voided invoices, staff actions) are logged with a timestamp and the user who performed the action."
            />
            <SecurityItem
              icon="👤"
              title="Minimum access principle"
              detail="Staff roles are scoped: secretaries can manage patients and visits; CPA users have read-only access to financial reports only. No role has more access than it needs."
            />
            <SecurityItem
              icon="🌏"
              title="Data stored in the region"
              detail="Your clinic's data is stored in AWS ap-south-1 (Mumbai) via Supabase — the nearest compliant cloud region to the Philippines at time of writing. Data does not leave Asia-Pacific for storage."
            />
          </ul>
        </Section>

        <Divider />

        {/* Third-party processors */}
        <Section title="Third-party processors">
          <p className="text-sm text-gray-600 mb-4">
            Sigurado uses the following sub-processors to operate the service. Each processes only the
            data necessary for its specific function. Under RA 10173 and NPC Advisory 2024-01, cross-border
            transfers require that the receiving party provides comparable data protection.
          </p>
          <div className="space-y-3">
            <ProcessorRow
              name="Supabase (via Amazon Web Services)"
              location="AWS ap-south-1 — Mumbai, India"
              purpose="Database hosting, authentication, and file storage"
            />
            <ProcessorRow
              name="Vercel Inc."
              location="United States / global CDN"
              purpose="Application hosting and serverless compute. No patient data is stored on Vercel — it is a compute layer only."
            />
            <ProcessorRow
              name="Meta Platforms (Facebook Messenger)"
              location="United States"
              purpose="Delivering appointment reminders to patients who have opted in to receive them via Facebook Messenger. Only the patient's Messenger ID and the message text are transmitted. No health records are sent."
            />
            <ProcessorRow
              name="Resend"
              location="United States"
              purpose="Transactional email delivery (reminders, invoices). Only the patient's email address and the message content are transmitted."
            />
          </div>
          <p className="mt-4 text-sm text-gray-600">
            We do not sell, rent, or share patient data with advertising networks, data brokers, or
            any third party for their own commercial purposes.
          </p>
        </Section>

        <Divider />

        {/* Data subject rights */}
        <Section title="Your rights as a data subject">
          <p className="text-sm text-gray-600 mb-4">
            Section 16 of RA 10173 grants the following rights to every data subject (patient):
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <RightCard
              right="Right to be informed"
              detail="You have the right to know what personal data we hold about you, the purpose for collecting it, and how it is used."
            />
            <RightCard
              right="Right to access"
              detail="You may request a copy of your personal data held in the system at any time."
            />
            <RightCard
              right="Right to correction"
              detail="You may request that inaccurate, incomplete, or outdated personal data be corrected."
            />
            <RightCard
              right="Right to erasure / blocking"
              detail="You may request deletion of your personal data when it is no longer necessary for the purpose it was collected, subject to legal retention requirements."
            />
            <RightCard
              right="Right to data portability"
              detail="You may request your data in a structured, machine-readable format."
            />
            <RightCard
              right="Right to damages"
              detail="You are entitled to claim compensation for damages sustained due to inaccurate, incomplete, outdated, or unlawfully obtained personal information."
            />
            <RightCard
              right="Right to file a complaint"
              detail="You may lodge a complaint with the National Privacy Commission (NPC) at privacy.gov.ph if you believe your rights have been violated."
            />
            <RightCard
              right="Right to object"
              detail="You may object to the processing of your personal data, including processing for direct marketing purposes."
            />
          </div>
          <p className="mt-4 text-sm text-gray-600">
            To exercise any of these rights, contact your clinic directly (they are the PIC and can
            fulfill most requests), or contact our Data Protection Officer at{' '}
            <a href={`mailto:${DPO_EMAIL}`} className="text-primary underline">{DPO_EMAIL}</a>.
          </p>
        </Section>

        <Divider />

        {/* Breach notification */}
        <Section title="What happens if there is a data breach?">
          <p>
            In the event of a personal data breach that is likely to give rise to a real risk of serious
            harm to data subjects, we are required by NPC Circular 2016-03 to:
          </p>
          <ol className="mt-3 space-y-2 text-sm list-decimal list-inside text-gray-700">
            <li>Notify the National Privacy Commission <strong>within 72 hours</strong> of becoming aware of the breach.</li>
            <li>Notify affected data subjects without undue delay, so they can take steps to protect themselves.</li>
            <li>Document all breaches in our security incident log, regardless of whether notification is required.</li>
          </ol>
          <p className="mt-3 text-sm text-gray-600">
            Because patient health records are Sensitive Personal Information, the threshold for
            mandatory notification is lower than for ordinary personal data.
          </p>
        </Section>

        <Divider />

        {/* Retention */}
        <Section title="How long we keep your data">
          <p className="text-sm text-gray-600">
            Patient records are retained for as long as the clinic is actively using Sigurado, and for
            a reasonable transition period after account closure to allow data export. Clinics are
            responsible for their own retention schedules under the Medical Act of 1959 and BIR
            regulations, which generally require keeping records for a minimum of ten (10) years.
          </p>
          <p className="mt-3 text-sm text-gray-600">
            Messenger PSIDs and consent records are retained until the patient withdraws consent or
            requests deletion.
          </p>
        </Section>

        <Divider />

        {/* NPC */}
        <Section title="Filing a complaint with the NPC">
          <p className="text-sm text-gray-600">
            If you believe your data privacy rights under RA 10173 have been violated and your concern
            has not been resolved by contacting us or your clinic directly, you may file a complaint
            with the National Privacy Commission:
          </p>
          <div className="mt-3 rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm space-y-1">
            <p className="font-semibold">National Privacy Commission (NPC)</p>
            <p className="text-gray-600">Website: <a href="https://www.privacy.gov.ph" className="text-primary underline" target="_blank" rel="noopener noreferrer">www.privacy.gov.ph</a></p>
            <p className="text-gray-600">The NPC handles complaints, conducts investigations, and can impose penalties for violations of RA 10173.</p>
          </div>
        </Section>

        <Divider />

        {/* Contact */}
        <Section title="Contact our Data Protection Officer">
          <p className="text-sm text-gray-600">
            For any questions about this privacy policy, to exercise your data subject rights, or to
            report a concern:
          </p>
          <div className="mt-3 rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm space-y-1">
            <p className="font-semibold">Data Protection Officer — Sigurado (AI Matters)</p>
            <p className="text-gray-600">Email: <a href={`mailto:${DPO_EMAIL}`} className="text-primary underline">{DPO_EMAIL}</a></p>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            We will acknowledge your request within three (3) business days and respond substantively
            within fifteen (15) business days, consistent with NPC expectations.
          </p>
        </Section>

        <Divider />

        {/* Changes */}
        <Section title="Changes to this policy">
          <p className="text-sm text-gray-600">
            We will post any updates to this page and update the &ldquo;Last updated&rdquo; date at the top.
            Material changes — particularly any that expand data sharing or change the stated purpose
            of processing — will be communicated to clinic administrators by email before taking effect.
          </p>
        </Section>

        {/* Footer */}
        <footer className="pt-4 pb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-400 border-t border-gray-100">
          <span>© {new Date().getFullYear()} AI Matters · Sigurado</span>
          <div className="flex gap-4">
            <Link href="/landing" className="hover:text-gray-600 transition-colors">Home</Link>
            <a href={`mailto:${DPO_EMAIL}`} className="hover:text-gray-600 transition-colors">DPO Contact</a>
            <a href="https://www.privacy.gov.ph" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">NPC</a>
          </div>
        </footer>

      </main>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Divider() {
  return <hr className="border-gray-100" />
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <div className="text-gray-700 leading-relaxed space-y-3 text-sm">{children}</div>
    </section>
  )
}

function DefinitionItem({ term, def }: { term: string; def: string }) {
  return (
    <li className="flex gap-2">
      <span className="text-gray-400 mt-0.5">▸</span>
      <span><strong>{term}:</strong> {def}</span>
    </li>
  )
}

function DataTable({
  category,
  examples,
  purpose,
  basis,
}: {
  category: string
  examples: string
  purpose: string
  basis: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden text-sm">
      <div className="bg-gray-50 px-4 py-2.5 font-semibold border-b border-gray-200">{category}</div>
      <div className="px-4 py-3 space-y-2">
        <Row label="Examples" value={examples} />
        <Row label="Purpose" value={purpose} />
        <Row label="Legal basis" value={basis} />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-24 shrink-0">{label}</span>
      <span className="text-gray-700">{value}</span>
    </div>
  )
}

function SecurityItem({ icon, title, detail }: { icon: string; title: string; detail: string }) {
  return (
    <li className="flex gap-3">
      <span className="text-base mt-0.5">{icon}</span>
      <div>
        <p className="font-semibold text-gray-800">{title}</p>
        <p className="text-gray-600">{detail}</p>
      </div>
    </li>
  )
}

function ProcessorRow({
  name,
  location,
  purpose,
}: {
  name: string
  location: string
  purpose: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 space-y-1.5 text-sm">
      <p className="font-semibold">{name}</p>
      <p className="text-gray-500 text-xs">📍 {location}</p>
      <p className="text-gray-600">{purpose}</p>
    </div>
  )
}

function RightCard({ right, detail }: { right: string; detail: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 space-y-1 text-sm">
      <p className="font-semibold text-gray-800">{right}</p>
      <p className="text-gray-600">{detail}</p>
    </div>
  )
}
