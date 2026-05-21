import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { getPatients } from './actions'
import PatientListClient from './PatientListClient'

export default async function PatientsPage() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const patients = await getPatients()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold font-heading">Patients</h1>
      <PatientListClient initialPatients={patients} />
    </div>
  )
}
