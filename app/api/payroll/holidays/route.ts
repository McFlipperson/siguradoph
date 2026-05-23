import { NextRequest, NextResponse } from 'next/server'
import { getHolidaysForDates, getHolidaysForYear } from '@/lib/ph-holidays'

// GET /api/payroll/holidays?year=2026
// GET /api/payroll/holidays?dates=2026-05-01,2026-05-02,...
export async function GET(req: NextRequest) {
  const year  = req.nextUrl.searchParams.get('year')
  const dates = req.nextUrl.searchParams.get('dates')

  if (dates) {
    const dateList = dates.split(',').map(d => d.trim()).filter(Boolean)
    return NextResponse.json(getHolidaysForDates(dateList))
  }

  if (year) {
    return NextResponse.json(getHolidaysForYear(Number(year)))
  }

  // Default: current year
  return NextResponse.json(getHolidaysForYear(new Date().getFullYear()))
}
