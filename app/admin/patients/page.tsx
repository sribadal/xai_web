import { getPatients } from "./actions"
import { PatientList } from "./patient-list"

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ model?: string }>
}) {
  const params = await searchParams
  const modelType = params.model || undefined
  const patients = await getPatients(modelType)

  return <PatientList patients={patients} currentModel={modelType} />
}