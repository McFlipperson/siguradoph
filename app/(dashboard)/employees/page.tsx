import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import EmployeesClient from './EmployeesClient'
import { weekDateRange } from '@/lib/payroll'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
  const user = await getSessionUser()
  if (!user?.clinicId) redirect('/login')

  const now = new Date()
  const currentWeek = Math.min(Math.ceil(now.getDate() / 7), 4)
  const currentMonth = now.getMonth() + 1
  const currentYear  = now.getFullYear()

  const { start: weekStart, end: weekEnd } = weekDateRange(currentMonth, currentYear, currentWeek)

  const [employees, payrollRecords, attendanceRecords] = await Promise.all([
    prisma.employee.findMany({
      where: { clinicId: user.clinicId },
      orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
      include: {
        salaryHistory: { orderBy: { effectiveDate: 'desc' }, take: 10 },
      },
    }),
    prisma.payrollRecord.findMany({
      where: {
        clinicId: user.clinicId,
        periodYear: currentYear,
        periodMonth: currentMonth,
        periodWeek: currentWeek,
      },
      include: { employee: { select: { fullName: true, dailyRate: true } } },
    }),
    prisma.attendanceRecord.findMany({
      where: {
        clinicId: user.clinicId,
        date: { gte: weekStart, lte: weekEnd },
      },
    }),
  ])

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
        sssEmployee: Number(r.sssEmployee),
        sssEmployer: Number(r.sssEmployer),
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
      currentWeek={currentWeek}
      currentMonth={currentMonth}
      currentYear={currentYear}
    />
  )
}
