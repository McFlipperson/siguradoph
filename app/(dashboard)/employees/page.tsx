import { getSessionUser } from '@/lib/auth'
import { withClinicDb } from '@/lib/clinic-db'
import { redirect } from 'next/navigation'
import EmployeesClient from './EmployeesClient'
import { weekDateRange, computeThirteenthMonth, isSilEligible, SIL_DAYS_PER_YEAR } from '@/lib/payroll'
import { getHolidaysForDates, getHolidaysForYear } from '@/lib/ph-holidays'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
  const user = await getSessionUser()
  if (!user?.clinicId) redirect('/login')
  const clinicId = user.clinicId

  const now          = new Date()
  const currentWeek  = Math.min(Math.ceil(now.getDate() / 7), 4)
  const currentMonth = now.getMonth() + 1
  const currentYear  = now.getFullYear()

  const { start: weekStart, end: weekEnd, dates: weekDates } = weekDateRange(currentMonth, currentYear, currentWeek)

  const [employees, payrollRecords, attendanceRecords, payrollTotals, silAttendance, thirteenthPayments] =
    await withClinicDb(clinicId, (tx) => Promise.all([
    tx.employee.findMany({
      where: { clinicId },
      orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
      include: {
        salaryHistory: { orderBy: { effectiveDate: 'desc' }, take: 10 },
      },
    }),
    tx.payrollRecord.findMany({
      where: {
        clinicId,
        periodYear: currentYear,
        periodMonth: currentMonth,
        periodWeek: currentWeek,
      },
      include: { employee: { select: { fullName: true, dailyRate: true } } },
    }),
    tx.attendanceRecord.findMany({
      where: {
        clinicId,
        date: { gte: weekStart, lte: weekEnd },
      },
    }),
    // 13th month: sum basicSalary per employee for current year
    tx.payrollRecord.groupBy({
      by: ['employeeId'],
      where: { clinicId, periodYear: currentYear },
      _sum: { basicSalary: true },
    }),
    // SIL: count sick/vacation leave days for each employee this year
    tx.attendanceRecord.findMany({
      where: {
        clinicId,
        status: { in: ['SICK_LEAVE', 'VACATION_LEAVE'] },
        date: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31),
        },
      },
      select: { employeeId: true, status: true },
    }),
    // 13th month payment records
    tx.thirteenthMonthRecord.findMany({
      where: { clinicId, year: currentYear },
    }),
  ]))

  const weekHolidays = getHolidaysForDates(weekDates)
  const yearHolidays = getHolidaysForYear(currentYear)

  // Build 13th month map
  const payTotalsMap = new Map(payrollTotals.map(r => [r.employeeId, Number(r._sum.basicSalary ?? 0)]))
  const thirteenthPayMap = new Map(thirteenthPayments.map(r => [r.employeeId, r]))

  // Build SIL map: count used leave days per employee
  const silUsedMap = new Map<string, number>()
  for (const a of silAttendance) {
    silUsedMap.set(a.employeeId, (silUsedMap.get(a.employeeId) ?? 0) + 1)
  }

  return (
    <EmployeesClient
      initialEmployees={employees.map((e) => ({
        id: e.id,
        fullName: e.fullName,
        position: e.position,
        dateHired: e.dateHired.toISOString(),
        dailyRate: Number(e.dailyRate),
        sssNumber: e.sssNumber,
        philhealthNumber: e.philhealthNumber,
        pagibigNumber: e.pagibigNumber,
        tin: e.tin ?? null,
        isActive: e.isActive,
        salaryHistory: e.salaryHistory.map((h) => ({
          id: h.id,
          dailyRate: Number(h.dailyRate),
          effectiveDate: h.effectiveDate.toISOString(),
          notes: h.notes ?? null,
        })),
        silEligible: isSilEligible(e.dateHired),
        silUsed: silUsedMap.get(e.id) ?? 0,
        silEntitlement: SIL_DAYS_PER_YEAR,
        thirteenthMonthAccrued: computeThirteenthMonth(payTotalsMap.get(e.id) ?? 0),
        thirteenthMonthPaid: thirteenthPayMap.get(e.id)?.fullYearPaid ?? false,
        thirteenthMidYearPaid: thirteenthPayMap.get(e.id)?.midYearPaid ?? false,
      }))}
      initialPayroll={payrollRecords.map((r) => ({
        id: r.id,
        employeeId: r.employeeId,
        employeeName: r.employee.fullName,
        dailyRate: Number(r.employee.dailyRate),
        periodMonth: r.periodMonth,
        periodYear: r.periodYear,
        periodWeek: r.periodWeek,
        daysWorked: r.daysWorked,
        basicSalary: Number(r.basicSalary),
        regularHolidayDays: r.regularHolidayDays,
        specialHolidayDays: r.specialHolidayDays,
        holidayPay: Number(r.holidayPay),
        sssEmployee: Number(r.sssEmployee),
        sssEmployer: Number(r.sssEmployer),
        sssEc: Number(r.sssEc),
        philhealthEmployee: Number(r.philhealthEmployee),
        philhealthEmployer: Number(r.philhealthEmployer),
        pagibigEmployee: Number(r.pagibigEmployee),
        pagibigEmployer: Number(r.pagibigEmployer),
        withholdingTax: Number(r.withholdingTax),
        netPay: Number(r.netPay),
      }))}
      initialAttendance={attendanceRecords.map((a) => ({
        id: a.id,
        employeeId: a.employeeId,
        date: a.date.toISOString().slice(0, 10),
        status: a.status as 'PRESENT' | 'ABSENT' | 'SICK_LEAVE' | 'VACATION_LEAVE',
        coveredById: a.coveredById ?? null,
      }))}
      weekHolidays={weekHolidays}
      yearHolidays={yearHolidays}
      currentWeek={currentWeek}
      currentMonth={currentMonth}
      currentYear={currentYear}
    />
  )
}
