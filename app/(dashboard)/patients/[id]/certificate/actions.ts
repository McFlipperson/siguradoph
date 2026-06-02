'use server'

import { Resend } from 'resend'
import { getActor } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { renderCertificatePdf, type CertPdfData } from '@/lib/certificate-pdf'

export type EmailCertificateInput = CertPdfData & { to: string; patientId: string }

export async function emailCertificate(input: EmailCertificateInput): Promise<{ ok: boolean; error?: string }> {
  const { clinicId, userEmail } = await getActor()

  if (!input.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.to)) {
    return { ok: false, error: 'Please enter a valid email address' }
  }

  try {
    const pdf = await renderCertificatePdf(input)
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@sigurado.xyz',
      to: input.to,
      subject: `Dental Certificate — ${input.clinicName}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;">
        <p>Hi ${input.patientName},</p>
        <p>Please find your dental certificate from <strong>${input.clinicName}</strong> attached as a PDF.</p>
        <p style="font-size:13px;color:#555;">To verify this certificate, contact ${input.clinicName} at ${input.clinicPhone}.</p>
      </div>`,
      attachments: [{ filename: 'dental-certificate.pdf', content: pdf }],
    })
    if (error) return { ok: false, error: error.message }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to send' }
  }

  // RA 10173: emailing a certificate is a disclosure of patient data — log it.
  await writeAudit({
    clinicId,
    userEmail,
    action: 'VIEW_PATIENT',
    resourceType: 'PATIENT',
    resourceId: input.patientId,
    detail: `Emailed dental certificate to ${input.to}`,
  })

  return { ok: true }
}
