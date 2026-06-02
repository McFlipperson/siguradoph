/**
 * Subscription tiers & feature entitlements.
 *
 * This is the SINGLE source of truth for "who gets what". Both the UI (to hide /
 * lock features) and the server (to actually block actions) read from here.
 *
 * Mirrors the pricing on the landing page:
 *   FREE  — up to 30 patients; records, OR receipts, expenses
 *   BASIC — unlimited patients + scheduling, reminders, loyalty, SC/PWD,
 *           reports, data export, privacy/compliance tools
 *   PRO   — everything in Basic + employees, payroll, incident/breach tools
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
  'compliance',
]

const PLAN_FEATURES: Record<Plan, Feature[]> = {
  FREE: [],
  BASIC: BASIC_FEATURES,
  PRO: [...BASIC_FEATURES, 'employees', 'payroll', 'incidents'],
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
