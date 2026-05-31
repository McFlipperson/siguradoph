'use server'

import { prisma } from '@/lib/prisma'
import { getActorDb } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export type RecallRuleRow = {
  id: string
  serviceName: string
  serviceCategory: string
  daysAfter: number
  messageTemplate: string
  isActive: boolean
}

export async function getRecallRules(): Promise<RecallRuleRow[]> {
  const { db } = await getActorDb()
  const rules = await db((tx) => tx.recallRule.findMany({ orderBy: { serviceCategory: 'asc' } }))
  return rules.map(r => ({ id: r.id, serviceName: r.serviceName, serviceCategory: r.serviceCategory, daysAfter: r.daysAfter, messageTemplate: r.messageTemplate, isActive: r.isActive }))
}

export async function saveRecallRules(rules: Array<{ id?: string; serviceName: string; serviceCategory: string; daysAfter: number; messageTemplate: string; isActive: boolean }>): Promise<void> {
  const { clinicId, db } = await getActorDb()
  await Promise.all(rules.map(r =>
    r.id
      ? db((tx) => tx.recallRule.updateMany({ where: { id: r.id, clinicId }, data: { daysAfter: r.daysAfter, messageTemplate: r.messageTemplate, isActive: r.isActive } }))
      : db((tx) => tx.recallRule.create({ data: { clinicId, serviceName: r.serviceName, serviceCategory: r.serviceCategory, daysAfter: r.daysAfter, messageTemplate: r.messageTemplate, isActive: r.isActive } }))
  ))
  revalidatePath('/reminders')
}

export async function saveMessengerConfig(data: {
  messengerToken: string   // '___keep___' means don't overwrite existing
  messengerPageId: string
  facebookPageUrl: string
}) {
  const { clinicId } = await getActorDb()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {
    messengerPageId: data.messengerPageId.trim() || null,
    facebookPageUrl: data.facebookPageUrl.trim() || null,
  }

  if (data.messengerToken !== '___keep___') {
    update.messengerToken = data.messengerToken.trim() || null
  }

  await prisma.clinic.update({ where: { id: clinicId }, data: update })
  revalidatePath('/reminders')
}
