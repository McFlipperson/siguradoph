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

export type AuditResourceType = 'PATIENT' | 'VISIT' | 'INVOICE'

/**
 * Write an immutable audit log entry for RA 10173 compliance.
 * Fire-and-forget: errors are silently swallowed so a logging failure
 * never breaks the main operation.
 */
export async function writeAudit(params: {
  clinicId: string
  userEmail: string
  action: AuditAction
  resourceType: AuditResourceType
  resourceId: string
  detail?: string
}): Promise<void> {
  try {
    await prisma.auditLog.create({ data: params })
  } catch {
    // Never let audit logging break the main flow
  }
}
