'use server'

import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { seedServiceCatalog } from '@/prisma/seed-catalog'
import { computeSSS, computePhilHealth, computePagIbig, computeWithholdingTax } from '@/lib/contributions'
import { EntityType, FilingMethod, ExpenseCategory } from '@prisma/client'

export type Step1Data = {
  slug: string
  clinicName: string
  ownerName: string
  street: string
  city: string
  province: string
  zip: string
  phone: string
  email: string
  facebookPageUrl?: string
  enrollmentDate: string
}

export type Step2Data = {
  tin: string
  rdoCode: string
  corNumber: string
  entityType: EntityType
  vatRegistered: boolean
  vatRegistrationDate?: string
  orSeriesStart: string
  filingMethod: FilingMethod
}

export type EmployeeData = {
  fullName: string
  position: string
  dateHired: string
  monthlySalary: number
  sssNumber: string
  philhealthNumber: string
  pagibigNumber: string
  tin?: string
}

export type Step3Data = {
  hasEmployees: boolean
  sssEmployerNumber?: string
  philhealthEmployerNumber?: string
  pagibigEmployerNumber?: string
  employees: EmployeeData[]
}

export type RecurringExpenseData = {
  description: string
  category: ExpenseCategory
  amount: number
  payeeName?: string
  vatRegistered: boolean
}

export type EquipmentData = {
  name: string
  purchaseDate: string
  purchaseCost: number
  usefulLifeYears: number
}

export type SupplierData = {
  name: string
  category: ExpenseCategory
  vatRegistered: boolean
  address?: string
  tin?: string
}

export type ServiceData = {
  id?: string
  name: string
  category: string
  isActive: boolean
  sortOrder: number
}

export type LoyaltyTemplateRow = {
  serviceName: string
  isFree: boolean
  tier1Uses: number
  tier1Discount: number
  tier2Uses?: number | null
  tier2Discount?: number | null
}

export type Step8Data = {
  loyaltyCardEnabled: boolean
  loyaltyCardPrice: number
  loyaltyValidityMonths: number
  templates: LoyaltyTemplateRow[]
}

export async function getClinicForCurrentUser() {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.email) return null

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        clinic: {
          include: {
            employees: true,
            recurringExpenses: true,
            equipment: true,
            suppliers: true,
            serviceCatalog: { orderBy: { sortOrder: 'asc' } },
          loyaltyCardTemplates: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    })
    return user?.clinic ?? null
  } catch {
    return null
  }
}

export async function saveStep1(data: Step1Data): Promise<string> {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.email) throw new Error('Not authenticated')

  const email = session.user.email

  // Find existing user/clinic
  const user = await prisma.user.findUnique({
    where: { email },
    include: { clinic: true },
  })

  let clinicId: string

  if (user?.clinic) {
    // Update existing clinic
    await prisma.clinic.update({
      where: { id: user.clinic.id },
      data: {
        // slug is immutable once set
        ...(!user.clinic.slug && data.slug ? { slug: data.slug } : {}),
        name: data.clinicName,
        ownerName: data.ownerName,
        street: data.street,
        city: data.city,
        province: data.province,
        zip: data.zip,
        phone: data.phone,
        email: data.email,
        facebookPageUrl: data.facebookPageUrl || null,
        enrollmentDate: new Date(data.enrollmentDate),
      },
    })
    clinicId = user.clinic.id
  } else {
    // Create clinic + user
    const clinic = await prisma.clinic.create({
      data: {
        slug: data.slug || null,
        name: data.clinicName,
        ownerName: data.ownerName,
        street: data.street,
        city: data.city,
        province: data.province,
        zip: data.zip,
        phone: data.phone,
        email: data.email,
        facebookPageUrl: data.facebookPageUrl || null,
        enrollmentDate: new Date(data.enrollmentDate),
        // Required fields with defaults until step 2
        tin: '',
        rdoCode: '',
        corNumber: '',
        entityType: 'SOLE_PROPRIETOR',
        vatRegistered: true,
        orSeriesStart: '0001',
        filingMethod: 'EBIRFORMS',
      },
    })
    clinicId = clinic.id

    if (user) {
      await prisma.user.update({
        where: { email },
        data: { clinicId },
      })
    } else {
      await prisma.user.create({
        data: {
          email,
          role: 'CLINIC_OWNER',
          clinicId,
        },
      })
    }
  }

  return clinicId
}

export async function saveStep2(clinicId: string, data: Step2Data): Promise<void> {
  await prisma.clinic.update({
    where: { id: clinicId },
    data: {
      tin: data.tin,
      rdoCode: data.rdoCode,
      corNumber: data.corNumber,
      entityType: data.entityType,
      vatRegistered: data.vatRegistered,
      vatRegistrationDate: data.vatRegistrationDate ? new Date(data.vatRegistrationDate) : null,
      orSeriesStart: data.orSeriesStart,
      filingMethod: data.filingMethod,
    },
  })
}

export async function saveStep3(clinicId: string, data: Step3Data): Promise<void> {
  await prisma.clinic.update({
    where: { id: clinicId },
    data: {
      hasEmployees: data.hasEmployees,
      sssEmployerNumber: data.sssEmployerNumber || null,
      philhealthEmployerNumber: data.philhealthEmployerNumber || null,
      pagibigEmployerNumber: data.pagibigEmployerNumber || null,
    },
  })

  // Delete existing employees and re-insert
  await prisma.employee.deleteMany({ where: { clinicId } })

  if (data.hasEmployees && data.employees.length > 0) {
    await prisma.employee.createMany({
      data: data.employees.map(emp => ({
        clinicId,
        fullName: emp.fullName,
        position: emp.position,
        dateHired: new Date(emp.dateHired),
        monthlySalary: emp.monthlySalary,
        sssNumber: emp.sssNumber,
        philhealthNumber: emp.philhealthNumber,
        pagibigNumber: emp.pagibigNumber,
        tin: emp.tin || null,
      })),
    })
  }
}

export async function saveStep4(clinicId: string, expenses: RecurringExpenseData[]): Promise<void> {
  await prisma.recurringExpense.deleteMany({ where: { clinicId } })
  if (expenses.length > 0) {
    await prisma.recurringExpense.createMany({
      data: expenses.map(e => ({
        clinicId,
        description: e.description,
        amount: e.amount,
        category: e.category,
        isActive: true,
      })),
    })
  }
}

export async function saveStep5(clinicId: string, equipment: EquipmentData[]): Promise<void> {
  await prisma.equipment.deleteMany({ where: { clinicId } })
  if (equipment.length > 0) {
    await prisma.equipment.createMany({
      data: equipment.map(eq => ({
        clinicId,
        name: eq.name,
        purchaseDate: new Date(eq.purchaseDate),
        purchaseCost: eq.purchaseCost,
        usefulLifeYears: eq.usefulLifeYears,
        isActive: true,
      })),
    })
  }
}

export async function saveStep6(clinicId: string, suppliers: SupplierData[]): Promise<void> {
  await prisma.supplier.deleteMany({ where: { clinicId } })
  if (suppliers.length > 0) {
    await prisma.supplier.createMany({
      data: suppliers.map(s => ({
        clinicId,
        name: s.name,
        category: s.category,
        vatRegistered: s.vatRegistered,
        address: s.address || null,
        tin: s.tin || null,
      })),
    })
  }
}

export async function saveStep7(clinicId: string, services: ServiceData[]): Promise<void> {
  for (const svc of services) {
    if (svc.id) {
      await prisma.serviceCatalog.update({
        where: { id: svc.id },
        data: {
          name: svc.name,
          category: svc.category,
          isActive: svc.isActive,
          sortOrder: svc.sortOrder,
        },
      })
    } else {
      await prisma.serviceCatalog.create({
        data: {
          clinicId,
          name: svc.name,
          category: svc.category,
          isActive: svc.isActive,
          sortOrder: svc.sortOrder,
        },
      })
    }
  }
}

export async function saveStep8(clinicId: string, data: Step8Data): Promise<void> {
  await prisma.clinic.update({
    where: { id: clinicId },
    data: {
      loyaltyCardEnabled: data.loyaltyCardEnabled,
      loyaltyCardPrice: data.loyaltyCardPrice,
      loyaltyValidityMonths: data.loyaltyValidityMonths,
    },
  })
  await prisma.loyaltyCardTemplate.deleteMany({ where: { clinicId } })
  if (data.loyaltyCardEnabled && data.templates.length > 0) {
    await prisma.loyaltyCardTemplate.createMany({
      data: data.templates.map((t, i) => ({
        clinicId,
        serviceName: t.serviceName,
        isFree: t.isFree,
        tier1Uses: t.tier1Uses,
        tier1Discount: t.tier1Discount,
        tier2Uses: t.tier2Uses ?? null,
        tier2Discount: t.tier2Discount ?? null,
        sortOrder: i,
      })),
    })
  }
}

export async function completeOnboarding(clinicId: string): Promise<{ success: true }> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: { employees: true, serviceCatalog: true },
  })
  if (!clinic) throw new Error('Clinic not found')

  await prisma.clinic.update({
    where: { id: clinicId },
    data: {
      onboardingComplete: true,
      enrollmentDate: clinic.enrollmentDate ?? new Date(),
    },
  })

  // Seed services if none exist
  if (clinic.serviceCatalog.length === 0) {
    await seedServiceCatalog(clinicId)
  }

  // Generate first payroll record for each employee if hasEmployees
  if (clinic.hasEmployees && clinic.employees.length > 0) {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    for (const emp of clinic.employees) {
      const salary = Number(emp.monthlySalary)
      const sss = computeSSS(salary)
      const ph = computePhilHealth(salary)
      const pi = computePagIbig(salary)
      const wt = computeWithholdingTax(salary)
      const netPay = salary - sss.employee - ph.employee - pi.employee - wt

      const existing = await prisma.payrollRecord.findFirst({
        where: { employeeId: emp.id, periodMonth: month, periodYear: year },
      })
      if (!existing) {
        await prisma.payrollRecord.create({
          data: {
            employeeId: emp.id,
            clinicId,
            periodMonth: month,
            periodYear: year,
            basicSalary: salary,
            sssEmployee: sss.employee,
            sssEmployer: sss.employer,
            philhealthEmployee: ph.employee,
            philhealthEmployer: ph.employer,
            pagibigEmployee: pi.employee,
            pagibigEmployer: pi.employer,
            withholdingTax: wt,
            netPay,
          },
        })
      }
    }
  }

  return { success: true }
}
