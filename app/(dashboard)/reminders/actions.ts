'use server'

import { prisma } from '@/lib/prisma'
import { getActorDb } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

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
