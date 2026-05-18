import { prisma } from '@/lib/prisma'

const DEFAULT_SERVICES = [
  { name: 'Check-up / Consultation',    category: 'CHECKUP',    sortOrder: 1  },
  { name: 'Cleaning (Prophylaxis)',      category: 'CLEANING',   sortOrder: 2  },
  { name: 'Tooth Filling (Composite)',   category: 'FILLING',    sortOrder: 3  },
  { name: 'Tooth Extraction (Simple)',   category: 'EXTRACTION', sortOrder: 4  },
  { name: 'Tooth Extraction (Surgical)', category: 'EXTRACTION', sortOrder: 5  },
  { name: 'Wisdom Tooth Extraction',     category: 'EXTRACTION', sortOrder: 6  },
  { name: 'Root Canal Treatment (RCT)',  category: 'RCT',        sortOrder: 7  },
  { name: 'Jacket Crown',               category: 'CROWN',      sortOrder: 8  },
  { name: 'Fixed Bridge',               category: 'BRIDGE',     sortOrder: 9  },
  { name: 'Dentures (Full)',             category: 'DENTURES',   sortOrder: 10 },
  { name: 'Dentures (Partial)',          category: 'DENTURES',   sortOrder: 11 },
  { name: 'Braces',                     category: 'BRACES',     sortOrder: 12 },
  { name: 'Retainer',                   category: 'RETAINER',   sortOrder: 13 },
]

export async function seedServiceCatalog(clinicId: string) {
  await prisma.serviceCatalog.createMany({
    data: DEFAULT_SERVICES.map(s => ({ ...s, clinicId })),
    skipDuplicates: true,
  })
}
