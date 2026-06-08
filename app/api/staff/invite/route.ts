import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'

// POST /api/staff/invite — invite a secretary by email (CLINIC_OWNER only)
export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user?.clinicId || user.role !== 'CLINIC_OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email } = await request.json() as { email?: string }
  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const normalizedEmail = email.trim().toLowerCase()

  // Block inviting an existing CLINIC_OWNER or CPA
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing && existing.role !== 'SECRETARY') {
    return NextResponse.json({ error: 'That email is already registered with a different role' }, { status: 409 })
  }
  if (existing && existing.clinicId !== user.clinicId) {
    return NextResponse.json({ error: 'That email is already associated with another clinic' }, { status: 409 })
  }

  // Create the Prisma User record now so they appear in the staff list immediately
  await prisma.user.upsert({
    where: { email: normalizedEmail },
    create: { email: normalizedEmail, role: 'SECRETARY', clinicId: user.clinicId, isActive: true },
    update: { clinicId: user.clinicId, isActive: true },
  })

  // Send invite via Supabase — creates the auth user and emails a magic link
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
    data: { clinicId: user.clinicId, role: 'SECRETARY' },
    redirectTo: `${appUrl}/auth/confirm`,
  })

  if (error) {
    // Supabase returns an error if the user was already invited — that's OK, treat as success
    if (!error.message.toLowerCase().includes('already')) {
      console.error('Supabase invite error:', error)
      return NextResponse.json({ error: 'Failed to send invite email' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
