import "server-only";
import { prisma } from "@/lib/prisma";

export async function getSessionByCode(code: string) {
  const participant = await prisma.participant.findUnique({
    where: { accessCode: code },
    include: {
      sessions: {
        include: {
          survey: { include: { translations: true } },
          sessionPatients: {
            orderBy: { displayOrder: "asc" },
            include: { patient: true },
          },
        },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
  });
  if (!participant) return null;
  const session = participant.sessions[0];
  if (!session) return null;
  return { participant, session };
}

export async function getQuestionsByTag(surveyId: string, tag: string) {
  return prisma.question.findMany({
    where: {
      surveyId,
      active: true,
      tags: { some: { tag: { name: tag } } },
    },
    orderBy: { displayOrder: "asc" },
    include: {
      translations: true,
      answers: {
        orderBy: { displayOrder: "asc" },
        include: { translations: true },
      },
    },
  });
}

export type LoadedQuestion = Awaited<ReturnType<typeof getQuestionsByTag>>[number];

export async function getExistingResponses(
  sessionId: string,
  questionIds: string[],
  scope?: {
    patientId?: string | null;
    modality?: import("@/lib/generated/prisma/client").Modality | null;
  },
) {
  if (questionIds.length === 0) return [];
  return prisma.response.findMany({
    where: {
      sessionId,
      questionId: { in: questionIds },
      patientId: scope?.patientId ?? null,
      modality: scope?.modality ?? null,
    },
    include: { selectedAnswers: true },
  });
}

export async function getExplanationsForPatient(
  patientId: string,
  modality: import("@/lib/generated/prisma/client").Modality,
  methods: string[],
) {
  if (methods.length === 0) return [];
  return prisma.explanation.findMany({
    where: {
      patientId,
      modality,
      method: { in: methods },
    },
    orderBy: [{ method: "asc" }, { timeHorizon: "asc" }],
  });
}

export async function getSessionPatient(
  sessionId: string,
  modality: import("@/lib/generated/prisma/client").Modality,
  modelType: string,
) {
  return prisma.sessionPatient.findUnique({
    where: {
      sessionId_modality_modelType: {
        sessionId,
        modality,
        modelType,
      },
    },
    include: { patient: true },
  });
}

export async function getSurveyMethod(
  surveyId: string,
  modelType: string,
  modality: import("@/lib/generated/prisma/client").Modality,
) {
  return prisma.surveyMethod.findUnique({
    where: {
      surveyId_modelType_modality: { surveyId, modelType, modality },
    },
  });
}

export type GlossaryEntry = {
  label: string;
  definition: string;
};

export async function getGlossary(
  locale: string = "en",
): Promise<Record<string, GlossaryEntry>> {
  const terms = await prisma.glossaryTerm.findMany({
    include: { translations: true },
  });

  const out: Record<string, GlossaryEntry> = {};
  for (const term of terms) {
    const tr =
      term.translations.find((t) => t.localeId === locale) ??
      term.translations[0];
    if (!tr) continue;
    out[term.term] = { label: tr.label, definition: tr.definition };
  }
  return out;
}