import NewPatientForm from './NewPatientForm'

export default function NewPatientPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold font-heading">Add Patient</h1>
      <NewPatientForm />
    </div>
  )
}
