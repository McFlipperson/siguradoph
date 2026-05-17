import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export async function getSessionUser() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, role: true, clinicId: true },
  })
  return user
}
