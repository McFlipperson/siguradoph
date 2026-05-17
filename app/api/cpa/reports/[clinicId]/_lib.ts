import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export function parsePeriod(period: string): { start: Date; end: Date; label: string } {
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [y, m] = period.split('-').map(Number)
    return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0, 23, 59, 59, 999), label: period }
  }
  if (/^\d{4}-Q[1-4]$/.test(period)) {
    const y = Number(period.slice(0, 4))
    const q = Number(period.slice(6))
    const sm = (q - 1) * 3
    return { start: new Date(y, sm, 1), end: new Date(y, sm + 3, 0, 23, 59, 59, 999), label: period }
  }
  if (/^\d{4}$/.test(period)) {
    const y = Number(period)
    return { start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59, 999), label: period }
  }
  // Default: current month (handles 'now' or any invalid string)
  const now = new Date()
  return parsePeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
}

export async function getReportData(clinicId: string) {
  return prisma.clinic.findUnique({ where: { id: clinicId } })
}

export async function verifyCpaAccess(clinicId: string): Promise<boolean> {
  const user = await getSessionUser()
  if (!user || user.role !== 'CPA') return false
  const assignment = await prisma.cpaClinicAssignment.findFirst({
    where: { cpaUserId: user.id, clinicId },
  })
  return !!assignment
}
