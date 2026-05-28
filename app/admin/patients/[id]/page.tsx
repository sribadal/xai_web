import { notFound } from "next/navigation"
import { getPatient, getGlossaryMap } from "../actions"
import { PatientDetail } from "./patient-detail"

export default async function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [patient, glossary] = await Promise.all([
    getPatient(id),
    getGlossaryMap("en"),
  ])
  if (!patient) notFound()

  return <PatientDetail patient={patient} glossary={glossary} />
}