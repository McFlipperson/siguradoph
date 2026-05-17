import { redirect } from 'next/navigation'
import { getVisitSetup } from '../actions'
import NewVisitForm from './NewVisitForm'

export default async function NewVisitPage({
  searchParams,
}: {
  searchParams: { patientId?: string; appointmentId?: string }
}) {
  const patientId = searchParams.patientId
  const appointmentId = searchParams.appointmentId

  if (!patientId) {
    redirect('/patients')
  }

  const setup = await getVisitSetup(patientId)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold font-heading">New Visit</h1>
      <NewVisitForm setup={setup} appointmentId={appointmentId} />
    </div>
  )
}
