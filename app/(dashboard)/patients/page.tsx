import Link from 'next/link'
import { getPatients } from './actions'
import PatientListClient from './PatientListClient'

export default async function PatientsPage() {
  const { patients, hasMore } = await getPatients(0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold font-heading">Patients</h1>
        <Link
          href="/patients/intake"
          className="flex items-center gap-1.5 min-h-[48px] px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-sm active:opacity-90"
        >
          + New Patient
        </Link>
      </div>
      <PatientListClient initialPatients={patients} initialHasMore={hasMore} />
    </div>
  )
}
