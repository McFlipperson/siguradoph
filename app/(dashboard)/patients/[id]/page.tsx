import { getPatient } from '../actions'
import PatientProfile from './PatientProfile'

export default async function PatientProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const patient = await getPatient(params.id)
  return <PatientProfile patient={patient} />
}
