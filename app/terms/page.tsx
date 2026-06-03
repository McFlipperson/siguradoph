import type { Metadata } from 'next'
import Link from 'next/link'
import { SIGURADO_DPO } from '@/lib/dpo'

export const metadata: Metadata = {
  title: 'Terms of Service — Sigurado',
  description:
    'The terms governing use of Sigurado, the dental clinic practice-management software operated by AI Matters for clinics in the Philippines.',
}

const LAST_UPDATED = 'June 3, 2026'
const CONTACT_EMAIL = SIGURADO_DPO.email

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Nav */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link href="/landing" className="font-bold text-lg tracking-tight text-primary">
            Sigurado
          </Link>
          <span className="text-xs text-gray-400 hidden sm:block">Terms of Service</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10 space-y-10">

        {/* Hero */}
        <section className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
          <p className="text-base text-gray-700 leading-relaxed">
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of Sigurado, a
            dental clinic practice-management application operated by <strong>AI Matters</strong>
            (&ldquo;Sigurado,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;). By creating an account or using the
            service, you (&ldquo;the clinic,&rdquo; &ldquo;you&rdquo;) agree to these Terms. If you do not
            agree, do not use Sigurado.
          </p>
        </section>

        <Divider />

        <Section title="1. The service">
          <p>
            Sigurado provides software for managing dental-clinic operations — patient records, visits,
            payments and official receipts, appointment reminders, loyalty cards, and related
            compliance tooling for the Philippine market. We may add, change, or remove features over
            time to improve the service.
          </p>
        </Section>

        <Divider />

        <Section title="2. Eligibility and accounts">
          <ul className="space-y-2">
            <Bullet>You must be a licensed dental practitioner, or be authorized to act on behalf of one, to operate a clinic account.</Bullet>
            <Bullet>You are responsible for the accuracy of the information you provide at registration and for keeping it current.</Bullet>
            <Bullet>You are responsible for safeguarding your login credentials and for all activity that occurs under your account. Notify us promptly of any unauthorized use.</Bullet>
            <Bullet>You are responsible for the actions of staff (e.g. secretaries, accountants) you grant access to.</Bullet>
          </ul>
        </Section>

        <Divider />

        <Section title="3. Your responsibilities as a clinic">
          <p>
            Under the Data Privacy Act of 2012 (Republic Act 10173), your clinic is the{' '}
            <strong>Personal Information Controller (PIC)</strong> for your patients&rsquo; data, and
            Sigurado acts as your <strong>Personal Information Processor (PIP)</strong>. Accordingly,
            you agree to:
          </p>
          <ul className="mt-3 space-y-2">
            <Bullet>Obtain any patient consent required by law before recording or processing patient data.</Bullet>
            <Bullet>Appoint a Data Protection Officer and register with the National Privacy Commission where required.</Bullet>
            <Bullet>Use the service in compliance with all applicable laws, including BIR regulations on official receipts and record-keeping, and the Medical Act of 1959.</Bullet>
            <Bullet>Maintain accurate clinical and financial records. Sigurado is a tool to support your practice — it is not a substitute for professional, legal, tax, or accounting judgment.</Bullet>
          </ul>
        </Section>

        <Divider />

        <Section title="4. Acceptable use">
          <p>You agree not to:</p>
          <ul className="mt-3 space-y-2">
            <Bullet>Use the service for any unlawful purpose or to store data you have no legal right to process.</Bullet>
            <Bullet>Attempt to access another clinic&rsquo;s data, probe or breach security controls, or interfere with the service&rsquo;s operation.</Bullet>
            <Bullet>Reverse-engineer, resell, or sublicense the service except as expressly permitted.</Bullet>
            <Bullet>Upload malicious code or use the service to transmit spam or unsolicited messages.</Bullet>
          </ul>
        </Section>

        <Divider />

        <Section title="5. Plans, fees, and billing">
          <ul className="space-y-2">
            <Bullet>Sigurado offers a Free plan and paid plans (Basic and Pro). Current pricing is shown in the app.</Bullet>
            <Bullet>Paid plans are billed monthly. Payment is made via GCash using the reference code shown at checkout; access is activated on an honor-system basis and verified afterward.</Bullet>
            <Bullet>If payment for a paid plan cannot be verified, we may downgrade the account to Free after a reasonable period.</Bullet>
            <Bullet>Fees are stated inclusive of applicable taxes unless noted otherwise. Plan prices may change with notice to clinic administrators.</Bullet>
          </ul>
        </Section>

        <Divider />

        <Section title="6. Data and privacy">
          <p>
            Our handling of personal data is described in our{' '}
            <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>, which forms
            part of these Terms. You retain ownership of your clinic and patient data. You may export
            your data while your account is active, and for a reasonable transition period after closure.
          </p>
        </Section>

        <Divider />

        <Section title="7. Intellectual property">
          <p>
            The Sigurado software, design, and branding are owned by AI Matters. These Terms grant you a
            limited, non-exclusive, non-transferable right to use the service for operating your clinic
            while your account is in good standing. No other rights are granted.
          </p>
        </Section>

        <Divider />

        <Section title="8. Availability and changes">
          <p>
            We work to keep Sigurado available and reliable, but we do not guarantee uninterrupted or
            error-free operation. We may perform maintenance, modify features, or suspend the service
            where necessary. Where practical, we will give advance notice of material changes that
            affect your use.
          </p>
        </Section>

        <Divider />

        <Section title="9. Disclaimers">
          <p>
            The service is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; To the extent
            permitted by law, we disclaim implied warranties of merchantability, fitness for a
            particular purpose, and non-infringement. Sigurado does not provide medical, legal, tax, or
            accounting advice; you remain solely responsible for clinical decisions and regulatory
            filings.
          </p>
        </Section>

        <Divider />

        <Section title="10. Limitation of liability">
          <p>
            To the maximum extent permitted by Philippine law, AI Matters will not be liable for
            indirect, incidental, or consequential damages, or for loss of profits, data, or goodwill,
            arising from your use of the service. Our total liability for any claim relating to the
            service will not exceed the fees you paid for it in the three (3) months preceding the
            claim.
          </p>
        </Section>

        <Divider />

        <Section title="11. Termination">
          <ul className="space-y-2">
            <Bullet>You may stop using the service and close your account at any time.</Bullet>
            <Bullet>We may suspend or terminate access if you materially breach these Terms or use the service in a way that creates legal risk or harms other users.</Bullet>
            <Bullet>On termination, we will make your data available for export for a reasonable period before deletion, subject to legal retention requirements.</Bullet>
          </ul>
        </Section>

        <Divider />

        <Section title="12. Governing law">
          <p>
            These Terms are governed by the laws of the Republic of the Philippines. Any dispute will be
            subject to the exclusive jurisdiction of the competent courts of the Philippines.
          </p>
        </Section>

        <Divider />

        <Section title="13. Changes to these Terms">
          <p>
            We may update these Terms from time to time. We will post changes on this page and update
            the &ldquo;Last updated&rdquo; date. Material changes will be communicated to clinic
            administrators by email before they take effect. Continued use after changes take effect
            constitutes acceptance.
          </p>
        </Section>

        <Divider />

        <Section title="14. Contact">
          <p className="text-sm text-gray-600">For questions about these Terms:</p>
          <div className="mt-3 rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm space-y-1">
            <p className="font-semibold">Sigurado — AI Matters</p>
            <p className="text-gray-600">Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a></p>
          </div>
        </Section>

        {/* Footer */}
        <footer className="pt-4 pb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-400 border-t border-gray-100">
          <span>© {new Date().getFullYear()} AI Matters · Sigurado</span>
          <div className="flex gap-4">
            <Link href="/landing" className="hover:text-gray-600 transition-colors">Home</Link>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-gray-600 transition-colors">Contact</a>
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

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="text-gray-400 mt-0.5">▸</span>
      <span>{children}</span>
    </li>
  )
}
