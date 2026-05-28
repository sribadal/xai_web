"use server"

import { prisma } from "@/lib/prisma"

export type GlossaryEntry = {
  label: string
  definition?: string
  value_labels?: Record<string, string>
}

export async function getPatients(modelType?: string) {
  return prisma.patient.findMany({
    where: modelType ? { modelType } : undefined,
    select: {
      id: true,
      externalId: true,
      modelType: true,
      prediction: true,
      notes: true,
      createdAt: true,
      _count: {
        select: { explanations: true },
      },
    },
    orderBy: { externalId: "asc" },
  })
}

export async function getPatient(id: string) {
  return prisma.patient.findUnique({
    where: { id },
    include: {
      explanations: {
        orderBy: [{ modality: "asc" }, { method: "asc" }],
      },
    },
  })
}

export async function updatePatientNotes(id: string, notes: string | null) {
  await prisma.patient.update({
    where: { id },
    data: { notes },
  })
}

export async function getGlossaryMap(
  locale: string = "en",
): Promise<Record<string, GlossaryEntry>> {
  const terms = await prisma.glossaryTerm.findMany({
    include: {
      translations: {
        where: { localeId: { in: [locale, "en"] } },
      },
    },
  })

  const map: Record<string, GlossaryEntry> = {}

  for (const term of terms) {
    const translation =
      term.translations.find((t) => t.localeId === locale) ??
      term.translations.find((t) => t.localeId === "en")

    if (translation) {
      map[term.term] = {
        label: translation.label,
        definition: translation.definition,
      }
    }
  }

  return map
}