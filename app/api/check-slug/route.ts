import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,}[a-z0-9]$/

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') ?? ''

  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ available: false, reason: 'invalid' })
  }

  const existing = await prisma.clinic.findUnique({ where: { slug }, select: { id: true } })
  return NextResponse.json({ available: !existing })
}
