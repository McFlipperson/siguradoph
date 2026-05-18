import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import EmployeesClient from './EmployeesClient'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
  const user = await getSessionUser()
  if (!user?.clinicId) redirect('/login')

  const employees = await prisma.employee.findMany({
    where: { clinicId: user.clinicId },
    orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
  })

  const now = new Date()
  const currentWeek = Math.min(Math.ceil(now.getDate() / 7), 4)
  const payrollRecords = await prisma.payrollRecord.findMany({
    where: {
      clinicId: user.clinicId,
      periodYear: now.getFullYear(),
      periodMonth: now.getMonth() + 1,
      periodWeek: currentWeek,
    },
    include: { employee: { select: { fullName: true } } },
  })

  return (
    <EmployeesClient
      initialEmployees={employees.map((e) => ({
        id: e.id,
        fullName: e.fullName,
        position: e.position,
        dateHired: e.dateHired.toISOString(),
        monthlySalary: Number(e.monthlySalary),
        sssNumber: e.sssNumber,
        philhealthNumber: e.philhealthNumber,
        pagibigNumber: e.pagibigNumber,
        tin: e.tin ?? null,
        isActive: e.isActive,
      }))}
      initialPayroll={payrollRecords.map((r) => ({
        id: r.id,
        employeeId: r.employeeId,
        employeeName: r.employee.fullName,
        periodMonth: r.periodMonth,
        periodYear: r.periodYear,
        periodWeek: r.periodWeek,
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
    />
  )
}
