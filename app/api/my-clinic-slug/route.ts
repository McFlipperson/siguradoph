import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser?.email) return NextResponse.json({ slug: null }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { email: authUser.email },
    select: { clinic: { select: { slug: true } } },
  })

  return NextResponse.json({ slug: user?.clinic?.slug ?? null })
}
