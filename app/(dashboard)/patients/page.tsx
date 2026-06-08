import { getPatients } from './actions'
import PatientListClient from './PatientListClient'

export default async function PatientsPage() {
  const { patients, hasMore } = await getPatients(0)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold font-heading">Patients</h1>
      <PatientListClient initialPatients={patients} initialHasMore={hasMore} />
    </div>
  )
}
