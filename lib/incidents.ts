/** Shared incident helpers used by clinic + platform (Sigurado) breach tools. */

export const INCIDENT_TYPE_LABELS: Record<string, string> = {
  UNAUTHORIZED_ACCESS: 'Unauthorized access',
  LOSS: 'Loss of data',
  UNAUTHORIZED_DISCLOSURE: 'Unauthorized disclosure',
  SYSTEM_BREACH: 'System breach',
  RANSOMWARE: 'Ransomware',
  OTHER: 'Other',
}

/** RA 10173 / NPC Circular 16-03: notify NPC + subjects within 72h of discovery. */
export function breachClock(discoveryIso: string) {
  const deadline = new Date(discoveryIso)
  deadline.setHours(deadline.getHours() + 72)
  const ms = deadline.getTime() - Date.now()
  return { deadline, overdue: ms < 0, hoursLeft: Math.round(ms / 3_600_000) }
}
