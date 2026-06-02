/**
 * Subscription tiers & feature entitlements.
 *
 * This is the SINGLE source of truth for "who gets what". Both the UI (to hide /
 * lock features) and the server (to actually block actions) read from here.
 *
 * Mirrors the pricing on the landing page:
 *   FREE  — up to 30 patients; records, OR receipts, expenses ("try it")
 *   BASIC — unlimited patients + scheduling, reminders, loyalty, SC/PWD,
 *           reports, data export ("run your clinic day-to-day")
 *   PRO   — everything in Basic + the full privacy/compliance suite
 *           (audit/consent dashboard, incident & breach/ASIR tools) +
 *           employees & payroll ("complete & compliant + staff")
 *
 * NOTE: consent capture at intake and background audit logging are NEVER gated —
 * they're legally required for any clinic collecting patient data. Pro unlocks
 * the tools to VIEW, export, and manage that compliance data.
 */

export type Plan = 'FREE' | 'BASIC' | 'PRO'

export type Feature =
  | 'unlimited_patients'
  | 'scheduling'
  | 'reminders'
  | 'loyalty'
  | 'scpwd'
  | 'reports'
  | 'data_export'
  | 'compliance'   // compliance dashboard: audit-log viewing, SC/PWD log, exports
  | 'employees'
  | 'payroll'
  | 'incidents'    // incident & breach register (ASIR / 72h clock)

/** Patient cap for the Free tier. Basic/Pro are unlimited. */
export const FREE_PATIENT_LIMIT = 30

const BASIC_FEATURES: Feature[] = [
  'unlimited_patients',
  'scheduling',
  'reminders',
  'loyalty',
  'scpwd',
  'reports',
  'data_export',
]

const PLAN_FEATURES: Record<Plan, Feature[]> = {
  FREE: [],
  BASIC: BASIC_FEATURES,
  // Pro adds the full privacy/compliance suite + staff/payroll.
  PRO: [...BASIC_FEATURES, 'compliance', 'employees', 'payroll', 'incidents'],
}

/** True if `plan` includes `feature`. */
export function planAllows(plan: Plan, feature: Feature): boolean {
  return PLAN_FEATURES[plan]?.includes(feature) ?? false
}

/** Patient cap for a plan (Infinity = unlimited). */
export function patientLimit(plan: Plan): number {
  return plan === 'FREE' ? FREE_PATIENT_LIMIT : Infinity
}

export const PLAN_LABELS: Record<Plan, string> = {
  FREE: 'Free',
  BASIC: 'Basic',
  PRO: 'Pro',
}

/** Minimum plan that unlocks a feature — handy for "Upgrade to X" prompts. */
export function requiredPlanFor(feature: Feature): Plan {
  if (planAllows('BASIC', feature)) return 'BASIC'
  return 'PRO'
}
