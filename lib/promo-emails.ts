import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Sigurado <hello@sigurado.xyz>'

function html(body: string) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111">${body}<hr style="margin-top:40px;border:none;border-top:1px solid #eee"/><p style="font-size:12px;color:#999">Sigurado · sigurado.xyz · For Philippine dental clinics</p></body></html>`
}

export async function sendPromoWelcome(to: string, clinicName: string, expiresAt: Date) {
  const expiry = expiresAt.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
  await resend.emails.send({
    from: FROM, to,
    subject: `Welcome to Sigurado PRO, ${clinicName}! 🎉`,
    html: html(`
      <h2>Your PRO trial is active!</h2>
      <p>Hi ${clinicName},</p>
      <p>Your 3-month PRO trial is now live. Your trial ends on <strong>${expiry}</strong>.</p>
      <h3>What you can do right now:</h3>
      <ul>
        <li><strong>Scheduling</strong> — book and manage patient appointments with reminders</li>
        <li><strong>Automated reminders</strong> — send appointment, cleaning recall, and braces alignment reminders via Messenger or email</li>
        <li><strong>Unlimited patients</strong> — no 30-patient cap during your trial</li>
        <li><strong>Full compliance suite</strong> — audit logs, consent dashboard, incident register</li>
      </ul>
      <p><a href="https://sigurado.xyz" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:8px">Open my clinic →</a></p>
    `),
  })
}

export async function sendPromoDay5(to: string, clinicName: string) {
  await resend.emails.send({
    from: FROM, to,
    subject: `Loyalty cards + SC/PWD discounts — ${clinicName}`,
    html: html(`
      <h2>Reward your patients with loyalty cards</h2>
      <p>Hi ${clinicName},</p>
      <p>Did you know Sigurado PRO includes a built-in <strong>loyalty card system</strong>?</p>
      <ul>
        <li>Sell loyalty cards to patients at a price you set</li>
        <li>Cardholders get automatic discounts on procedures — cleaning, fillings, extractions, and more</li>
        <li>You configure the discount tiers (e.g. 50% off for the first 2 cleanings, then 25% off the next 2)</li>
        <li>Free check-ups included for cardholders — tracked automatically per patient</li>
      </ul>
      <p>Go to <strong>Menu → Loyalty Cards</strong> to set it up.</p>
      <p><a href="https://sigurado.xyz/loyalty" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:8px">Set up loyalty cards →</a></p>
    `),
  })
}

export async function sendPromoDay10(to: string, clinicName: string) {
  await resend.emails.send({
    from: FROM, to,
    subject: `Payroll made easy for ${clinicName}`,
    html: html(`
      <h2>Manage your staff payroll inside Sigurado</h2>
      <p>Hi ${clinicName},</p>
      <p>If you have employees, Sigurado PRO handles <strong>payroll</strong> for you:</p>
      <ul>
        <li>Compute semi-monthly payroll with SSS, PhilHealth, and Pag-IBIG deductions</li>
        <li>13th month pay calculator</li>
        <li>Payslip generation ready to print or send</li>
        <li>Government contribution numbers stored once in Settings</li>
      </ul>
      <p>Enable it in <strong>Settings → Clinic → "Clinic has employees"</strong>.</p>
      <p><a href="https://sigurado.xyz/payroll" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:8px">View payroll →</a></p>
    `),
  })
}

export async function sendPromoExpiry7Days(to: string, clinicName: string, expiresAt: Date) {
  const expiry = expiresAt.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
  await resend.emails.send({
    from: FROM, to,
    subject: `Your Sigurado PRO trial ends in 7 days`,
    html: html(`
      <h2>7 days left on your PRO trial</h2>
      <p>Hi ${clinicName},</p>
      <p>Your PRO trial expires on <strong>${expiry}</strong>.</p>
      <p>After that, your clinic reverts to the Free plan (30 patients). Upgrade now to keep everything — unlimited patients, scheduling, reminders, loyalty cards, payroll, and compliance tools.</p>
      <p><strong>PRO: ₱999/month</strong></p>
      <p><a href="https://sigurado.xyz/billing" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:8px">Upgrade to PRO →</a></p>
    `),
  })
}

export async function sendPromoExpiry3Days(to: string, clinicName: string, expiresAt: Date) {
  const expiry = expiresAt.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
  await resend.emails.send({
    from: FROM, to,
    subject: `⚠️ 3 days left — upgrade ${clinicName} to keep your data`,
    html: html(`
      <h2>Only 3 days left on your PRO trial</h2>
      <p>Hi ${clinicName},</p>
      <p>Your trial expires <strong>${expiry}</strong>. In 3 days, your clinic will revert to Free and patients beyond 30 will be archived (not deleted — but hidden until you upgrade).</p>
      <p>Upgrade now to keep full access with no disruption.</p>
      <p><a href="https://sigurado.xyz/billing" style="background:#dc2626;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:8px">Upgrade now — ₱999/month →</a></p>
    `),
  })
}

export async function sendPromoExpiredToday(to: string, clinicName: string, keptCount: number, archivedCount: number) {
  await resend.emails.send({
    from: FROM, to,
    subject: `Your Sigurado PRO trial has ended`,
    html: html(`
      <h2>Your trial has ended, ${clinicName}</h2>
      <p>Your PRO trial has expired. Your clinic is now on the <strong>Free plan</strong>.</p>
      <p>We kept your <strong>${keptCount} oldest patient records</strong> active. ${archivedCount > 0 ? `<strong>${archivedCount} patients</strong> have been archived — their data is safe and will be fully restored the moment you upgrade.` : ''}</p>
      <p>Upgrade anytime to restore full access instantly.</p>
      <p><a href="https://sigurado.xyz/billing" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:8px">Upgrade to PRO →</a></p>
    `),
  })
}

export async function sendDeletionConfirmation(to: string, clinicName: string, deletionDate: Date) {
  const date = deletionDate.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
  await resend.emails.send({
    from: FROM, to,
    subject: `Account deletion requested — ${clinicName}`,
    html: html(`
      <h2>Account deletion scheduled</h2>
      <p>Hi ${clinicName},</p>
      <p>We received your request to delete your Sigurado account. All clinic data will be <strong>permanently deleted on ${date}</strong> (30 days from now), in accordance with RA 10173 (Data Privacy Act).</p>
      <p>If you change your mind, simply log in before ${date} and cancel the deletion.</p>
      <p>If you have questions, reply to this email.</p>
    `),
  })
}

export async function sendDeletionComplete(to: string, clinicName: string) {
  await resend.emails.send({
    from: FROM, to,
    subject: `Your Sigurado data has been deleted`,
    html: html(`
      <h2>Data deletion complete</h2>
      <p>Hi ${clinicName},</p>
      <p>All data associated with your Sigurado account — patients, visits, invoices, payments, and all related records — has been permanently deleted as requested.</p>
      <p>This deletion was performed in accordance with the Philippine Data Privacy Act (RA 10173).</p>
      <p>Thank you for using Sigurado. If you ever start a new clinic, you're welcome to register again at <a href="https://sigurado.xyz">sigurado.xyz</a>.</p>
    `),
  })
}
