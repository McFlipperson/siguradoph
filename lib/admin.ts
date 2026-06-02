/**
 * Sigurado-staff super-admin allowlist (separate from clinic users).
 * Set ADMIN_EMAILS in the environment as a comma-separated list, e.g.
 *   ADMIN_EMAILS="you@sigurado.xyz,ops@sigurado.xyz"
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allow = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return allow.includes(email.toLowerCase())
}
