import { Resend } from 'resend'

// Lazily initialized so build-time import never throws when env var is absent.
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export type ReceiptEmailData = {
  to: string
  clinicName: string
  clinicLogoUrl?: string | null
  clinicAddress: string
  clinicTin: string
  orNumber: string
  transactionDate: Date
  patientName: string
  serviceDescription: string
  toothNumber?: string
  netAmount: number
  vatAmount: number
  grossAmount: number
  discountAmount: number
  discountLabel?: string
  scPwdType?: 'SC' | 'PWD'
  scPwdIdNumber?: string
  loyaltyCardPurchased?: {
    cardNumber: string
    expiryDate: Date
    amount: number
  }
  paymentMethod: string
  notes?: string
}

// ─── Reminder emails ──────────────────────────────────────────────────────────
export async function sendReminderEmail(
  to: string,
  subject: string,
  patientName: string,
  body: string,
  clinicName: string
): Promise<{ ok: boolean; error?: string }> {
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 24px;">
      <h2 style="color: #1a1a1a;">${clinicName}</h2>
      <p style="font-size: 16px; color: #333;">${body}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #999;">
        You're receiving this because you chose email reminders at ${clinicName}.
        Contact the clinic to update your reminder preferences.
      </p>
    </div>
  `
  try {
    const { error } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@sigurado.xyz',
      to,
      subject,
      html,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown email error' }
  }
}

// ─── Receipt emails ───────────────────────────────────────────────────────────
export async function sendReceiptEmail(data: ReceiptEmailData): Promise<void> {
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@sigurado.xyz',
    to: data.to,
    subject: `Official Receipt #${data.orNumber} — ${data.clinicName}`,
    html: buildReceiptHtml(data),
  })
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(n)
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function buildReceiptHtml(data: ReceiptEmailData): string {
  const hasDiscount = data.discountAmount > 0
  const hasCard = !!data.loyaltyCardPurchased

  const scPwdRow = data.scPwdType
    ? `<tr>
        <td style="padding:4px 0;color:#374151;font-size:12px;">
          ${data.scPwdType === 'SC' ? 'Senior Citizen (RA 9994)' : 'PWD (RA 10754)'}
          ${data.scPwdIdNumber ? ` — ID: ${data.scPwdIdNumber}` : ''}
        </td>
        <td style="padding:4px 0;text-align:right;font-size:12px;color:#374151;">VAT-Exempt</td>
      </tr>`
    : ''

  const discountRow = hasDiscount
    ? `<tr>
        <td style="padding:4px 0;color:#374151;">
          Discount${data.discountLabel ? ` — ${data.discountLabel}` : ''}
        </td>
        <td style="padding:4px 0;text-align:right;color:#dc2626;">
          -₱${fmt(data.discountAmount)}
        </td>
      </tr>`
    : ''

  const cardRows = hasCard
    ? `<tr>
        <td style="padding:4px 0;color:#374151;">
          Loyalty Card — ${data.loyaltyCardPurchased!.cardNumber}
        </td>
        <td style="padding:4px 0;text-align:right;color:#374151;">
          ₱${fmt(data.loyaltyCardPurchased!.amount)}
        </td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:12px;color:#6b7280;">
          Valid until ${fmtDate(data.loyaltyCardPurchased!.expiryDate)}
        </td>
        <td></td>
      </tr>`
    : ''

  const notesRow = data.notes
    ? `<tr>
        <td colspan="2" style="padding:12px 0 0;font-size:13px;color:#6b7280;">
          Notes: ${data.notes}
        </td>
      </tr>`
    : ''

  const toothRow = data.toothNumber
    ? `<p style="margin:0 0 4px;font-size:13px;color:#6b7280;">
        Tooth: ${data.toothNumber}
      </p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:24px 28px;">
              ${data.clinicLogoUrl ? `<img src="${data.clinicLogoUrl}" alt="${data.clinicName}" style="max-height:56px;max-width:160px;width:auto;object-fit:contain;display:block;margin-bottom:12px;" />` : ''}
              <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">${data.clinicName}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">${data.clinicAddress}</p>
              <p style="margin:2px 0 0;font-size:13px;color:#94a3b8;">TIN: ${data.clinicTin}</p>
            </td>
          </tr>

          <!-- OR Badge -->
          <tr>
            <td style="background:#f0fdf4;padding:16px 28px;border-bottom:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:0.08em;">
                Official Receipt
              </p>
              <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#15803d;">
                #${data.orNumber}
              </p>
              <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">
                ${fmtDate(data.transactionDate)}
              </p>
            </td>
          </tr>

          <!-- Patient & Service -->
          <tr>
            <td style="padding:20px 28px;border-bottom:1px solid #e5e7eb;">
              <p style="margin:0 0 2px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;">Patient</p>
              <p style="margin:0 0 14px;font-size:16px;font-weight:600;color:#111827;">${data.patientName}</p>
              <p style="margin:0 0 2px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;">Service</p>
              <p style="margin:0 0 4px;font-size:15px;color:#111827;">${data.serviceDescription}</p>
              ${toothRow}
            </td>
          </tr>

          <!-- Breakdown -->
          <tr>
            <td style="padding:20px 28px;border-bottom:1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;color:#374151;">Service</td>
                  <td style="padding:4px 0;text-align:right;color:#374151;">₱${fmt(data.grossAmount + data.discountAmount)}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:12px;color:#16a34a;">VAT-Exempt (NIRC §109)</td>
                  <td style="padding:4px 0;text-align:right;font-size:12px;color:#16a34a;">₱0.00</td>
                </tr>
                ${scPwdRow}
                ${discountRow}
                ${cardRows}
                <tr>
                  <td colspan="2" style="padding:12px 0 0;">
                    <div style="border-top:2px solid #111827;margin-bottom:8px;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="font-size:16px;font-weight:700;color:#111827;">Total paid</td>
                  <td style="font-size:20px;font-weight:700;color:#111827;text-align:right;">
                    ₱${fmt(data.grossAmount)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:#6b7280;">
                    via ${data.paymentMethod}
                  </td>
                  <td></td>
                </tr>
                ${notesRow}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This is an official receipt issued by ${data.clinicName}.<br>
                Powered by Sigurado
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
