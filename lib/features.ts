/**
 * Feature flags — flip a value here to show/hide a module.
 * No code deletion needed: everything is conditionally rendered.
 *
 * TAX_MODULE covers: BIR/VAT settings, CPA portal, payroll,
 * quarterly reports, and accountant email auto-delivery.
 * Set to `true` to re-enable as a paid add-on.
 */
export const FEATURES = {
  TAX_MODULE: false,
} as const
