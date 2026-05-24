/**
 * Dental services are VAT-EXEMPT under NIRC Section 109(1)(g).
 * Net amount = gross amount. No VAT is charged.
 *
 * We keep the same return shape so call-sites don't break,
 * but vat is always 0 and net equals gross.
 */
export function computeVat(grossAmount: number) {
  return {
    gross: grossAmount,
    net: grossAmount,
    vat: 0,
  }
}
