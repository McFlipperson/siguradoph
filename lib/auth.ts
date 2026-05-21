import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export async function getSessionUser() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser?.email) return null
  const user = await prisma.user.findUnique({
    where: { email: authUser.email },
    select: { id: true, email: true, role: true, clinicId: true },
  })
  return user
}
