import { prisma } from './prisma'

export type AuditAction =
  | 'CREATE_PATIENT'
  | 'VIEW_PATIENT'
  | 'EDIT_PATIENT_MEDICAL'
  | 'EDIT_PATIENT_SCPWD'
  | 'CREATE_VISIT'
  | 'UPDATE_VISIT'
  | 'CONFIRM_PAYMENT'
  | 'VOID_INVOICE'
  | 'DELETE_PATIENT'
  | 'EXPORT_PATIENTS'
  | 'EXPORT_INVOICES'

export type AuditResourceType = 'PATIENT' | 'VISIT' | 'INVOICE'

/**
 * Write an audit log entry for RA 10173 access accountability.
 *
 * Non-throwing: a logging failure must never break the underlying clinical or
 * financial operation. But it is NOT silent — failures are logged to the server
 * console (Vercel runtime logs) so a gap in the access trail is observable, and
 * the function returns false so callers can react if they choose. A silently
 * dropped audit entry would mean SPI access with no record, which defeats the
 * purpose of the log for compliance proof.
 */
export async function writeAudit(params: {
  clinicId: string
  userEmail: string
  action: AuditAction
  resourceType: AuditResourceType
  resourceId: string
  detail?: string
}): Promise<boolean> {
  try {
    await prisma.auditLog.create({ data: params })
    return true
  } catch (err) {
    // Surface the failure (do not throw) — an unlogged SPI access is a
    // compliance gap that must be visible in the logs, not swallowed.
    console.error('[audit] FAILED to write audit entry', {
      clinicId: params.clinicId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      error: err instanceof Error ? err.message : String(err),
    })
    return false
  }
}
