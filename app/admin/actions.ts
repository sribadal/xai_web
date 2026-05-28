"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSurveys() {
  return prisma.survey.findMany({
    include: {
      translations: true,
      questions: {
        include: { translations: true },
        orderBy: { displayOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSurvey(id: string) {
  return prisma.survey.findUnique({
    where: { id },
    include: {
      translations: true,
      methods: true,
      participants: {
        include: { sessions: true },
        orderBy: { createdAt: "desc" },
      },
      questions: {
        where: { active: true },
        include: {
          translations: true,
          answers: {
            include: { translations: true },
            orderBy: { displayOrder: "asc" },
          },
          tags: { include: { tag: { include: { group: true } } } },
          _count: { select: { responses: true } },
        },
        orderBy: { displayOrder: "asc" },
      },
    },
  });
}

export async function getMethodsByModality(modelType: string) {
  const rows = await prisma.explanation.findMany({
    where: {
      patient: { modelType },
      error: null,
    },
    select: { modality: true, method: true },
    distinct: ["modality", "method"],
  });

  const grouped: Record<string, string[]> = {
    ATTRIBUTION: [],
    COUNTERFACTUAL: [],
    CASE_BASED: [],
    RULE_BASED: [],
  };

  for (const row of rows) {
    if (!grouped[row.modality]) grouped[row.modality] = [];
    if (!grouped[row.modality].includes(row.method)) {
      grouped[row.modality].push(row.method);
    }
  }

  for (const k of Object.keys(grouped)) grouped[k].sort();
  return grouped;
}

export async function createSurvey(data: {
  translations: { localeId: string; title: string; description?: string }[];
}) {
  const survey = await prisma.survey.create({
    data: {
      translations: { create: data.translations },
    },
    include: { translations: true },
  });
  revalidatePath("/admin/surveys");
  return survey;
}

export async function updateSurvey(
  id: string,
  data: {
    translations: { localeId: string; title: string; description?: string }[];
    rsfVignettePatientIds?: string[];
    condorVignettePatientIds?: string[];
    methods?: {
      modelType: "rsf" | "condor";
      modality: "ATTRIBUTION" | "COUNTERFACTUAL" | "CASE_BASED" | "RULE_BASED";
      method: string;
    }[];
  },
) {
  await prisma.$transaction(async (tx) => {
    // Replace translations.
    await tx.surveyTranslation.deleteMany({ where: { surveyId: id } });
    await tx.survey.update({
      where: { id },
      data: {
        translations: { create: data.translations },
        ...(data.rsfVignettePatientIds !== undefined
          ? { rsfVignettePatientIds: data.rsfVignettePatientIds }
          : {}),
        ...(data.condorVignettePatientIds !== undefined
          ? { condorVignettePatientIds: data.condorVignettePatientIds }
          : {}),
      },
    });

    // Replace methods if provided.
    if (data.methods !== undefined) {
      await tx.surveyMethod.deleteMany({ where: { surveyId: id } });
      if (data.methods.length > 0) {
        await tx.surveyMethod.createMany({
          data: data.methods.map((m) => ({
            surveyId: id,
            modelType: m.modelType,
            modality: m.modality,
            method: m.method,
          })),
        });
      }
    }
  });

  revalidatePath("/admin/surveys");
  const survey = await prisma.survey.findUnique({
    where: { id },
    include: { translations: true, methods: true },
  });
  return survey;
}

export async function deleteSurvey(id: string) {
  await prisma.survey.delete({ where: { id } });
  revalidatePath("/admin/surveys");
}

export async function publishSurvey(id: string) {
  const survey = await prisma.survey.findUnique({
    where: { id },
    include: { methods: true },
  });
  if (!survey) throw new Error("Survey not found");

  const missing: string[] = [];

  // Methods: need one per (model, modality) cell = 8 total.
  const MODALITIES = [
    "ATTRIBUTION",
    "COUNTERFACTUAL",
    "CASE_BASED",
    "RULE_BASED",
  ] as const;
  const MODELS = ["rsf", "condor"] as const;

  for (const model of MODELS) {
    for (const mod of MODALITIES) {
      const has = survey.methods.some(
        (m) => m.modelType === model && m.modality === mod,
      );
      if (!has) missing.push(`${model} / ${mod.toLowerCase()} method`);
    }
  }

  // Vignettes: need 4 per model (one per modality).
  if (survey.rsfVignettePatientIds.length !== 4) {
    missing.push(
      `4 RSF vignette patients (have ${survey.rsfVignettePatientIds.length})`,
    );
  }
  if (survey.condorVignettePatientIds.length !== 4) {
    missing.push(
      `4 ConDOR vignette patients (have ${survey.condorVignettePatientIds.length})`,
    );
  }

  if (missing.length > 0) {
    throw new Error(`Cannot publish: missing ${missing.join(", ")}.`);
  }

  await prisma.survey.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
  revalidatePath("/admin/surveys");
}

export async function closeSurvey(id: string) {
  await prisma.survey.update({
    where: { id },
    data: { status: "CLOSED" },
  });
  revalidatePath("/admin/surveys");
}

export async function unpublishSurvey(id: string) {
  await prisma.survey.update({
    where: { id },
    data: { status: "DRAFT", publishedAt: null },
  });
  revalidatePath("/admin/surveys");
}

export async function reopenSurvey(id: string) {
  await prisma.survey.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });
  revalidatePath("/admin/surveys");
}

export async function createQuestion(data: {
  surveyId: string;
  type: "LIKERT" | "RADIO" | "CHECKBOX" | "OPEN" | "RANKING";
  isRequired: boolean;
  displayOrder: number;
  translations: {
    localeId: string;
    text: string;
    description?: string;
    helperText?: string;
  }[];
  answers?: {
    value: number;
    displayOrder: number;
    translations: { localeId: string; label: string }[];
  }[];
  tagIds?: string[];
}) {
  const question = await prisma.question.create({
    data: {
      surveyId: data.surveyId,
      type: data.type,
      isRequired: data.isRequired,
      displayOrder: data.displayOrder,
      translations: {
        create: data.translations,
      },
      answers: data.answers
        ? {
            create: data.answers.map((a) => ({
              value: a.value,
              displayOrder: a.displayOrder,
              translations: { create: a.translations },
            })),
          }
        : undefined,
      tags: data.tagIds
        ? { create: data.tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
    include: {
      translations: true,
      answers: { include: { translations: true } },
      tags: { include: { tag: true } },
    },
  });
  revalidatePath("/admin/surveys");
  return question;
}

export async function updateQuestion(
  id: string,
  data: {
    type?: "LIKERT" | "RADIO" | "CHECKBOX" | "OPEN" | "RANKING";
    isRequired?: boolean;
    displayOrder?: number;
    translations?: {
      localeId: string;
      text: string;
      description?: string;
      helperText?: string;
    }[];
    tagIds?: string[];
  },
) {
  if (data.translations) {
    await prisma.questionTranslation.deleteMany({ where: { questionId: id } });
  }
  if (data.tagIds !== undefined) {
    await prisma.questionTag.deleteMany({ where: { questionId: id } });
  }

  const question = await prisma.question.update({
    where: { id },
    data: {
      type: data.type,
      isRequired: data.isRequired,
      displayOrder: data.displayOrder,
      translations: data.translations
        ? { create: data.translations }
        : undefined,
      tags:
        data.tagIds !== undefined
          ? { create: data.tagIds.map((tagId) => ({ tagId })) }
          : undefined,
    },
    include: {
      translations: true,
      tags: { include: { tag: { include: { group: true } } } },
    },
  });
  revalidatePath("/admin/surveys");
  return question;
}

export async function retireAndReplaceQuestion(
  oldQuestionId: string,
  data: {
    surveyId: string;
    type: "LIKERT" | "RADIO" | "CHECKBOX" | "OPEN" | "RANKING";
    isRequired: boolean;
    displayOrder: number;
    translations: {
      localeId: string;
      text: string;
      description?: string;
      helperText?: string;
    }[];
    answers?: {
      value: number;
      displayOrder: number;
      translations: { localeId: string; label: string }[];
    }[];
    tagIds?: string[];
  },
) {
  // Retire old question (keeps it + responses intact)
  await prisma.question.update({
    where: { id: oldQuestionId },
    data: { active: false },
  });

  // Create replacement at the same displayOrder
  const question = await prisma.question.create({
    data: {
      surveyId: data.surveyId,
      type: data.type,
      isRequired: data.isRequired,
      displayOrder: data.displayOrder,
      translations: { create: data.translations },
      answers: data.answers
        ? {
            create: data.answers.map((a) => ({
              value: a.value,
              displayOrder: a.displayOrder,
              translations: { create: a.translations },
            })),
          }
        : undefined,
      tags: data.tagIds
        ? { create: data.tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
    include: {
      translations: true,
      answers: { include: { translations: true } },
      tags: { include: { tag: { include: { group: true } } } },
    },
  });

  revalidatePath("/admin/surveys");
  return question;
}

export async function updateAnswer(
  id: string,
  data: {
    value?: number;
    translations?: { localeId: string; label: string }[];
  },
) {
  if (data.translations) {
    await prisma.answerTranslation.deleteMany({ where: { answerId: id } });
  }
  const answer = await prisma.answer.update({
    where: { id },
    data: {
      value: data.value,
      translations: data.translations
        ? { create: data.translations }
        : undefined,
    },
    include: { translations: true },
  });
  revalidatePath("/admin/surveys");
  return answer;
}

export async function deleteQuestion(id: string) {
  await prisma.question.delete({ where: { id } });
  revalidatePath("/admin/surveys");
}

export async function createAnswer(data: {
  questionId: string;
  value: number;
  displayOrder: number;
  translations: { localeId: string; label: string }[];
}) {
  const answer = await prisma.answer.create({
    data: {
      questionId: data.questionId,
      value: data.value,
      displayOrder: data.displayOrder,
      translations: { create: data.translations },
    },
    include: { translations: true },
  });
  revalidatePath("/admin/surveys");
  return answer;
}

export async function deleteAnswer(id: string) {
  await prisma.answer.delete({ where: { id } });
  revalidatePath("/admin/surveys");
}

export async function getGlossaryTerms() {
  return prisma.glossaryTerm.findMany({
    include: { translations: true },
    orderBy: { term: "asc" },
  });
}

export async function createGlossaryTerm(data: {
  term: string;
  translations: { localeId: string; label: string; definition: string }[];
}) {
  const glossaryTerm = await prisma.glossaryTerm.create({
    data: {
      term: data.term,
      translations: { create: data.translations },
    },
    include: { translations: true },
  });
  revalidatePath("/admin/glossary");
  return glossaryTerm;
}


export async function updateGlossaryTerm(
  id: string,
  data: {
    term?: string;
    translations?: { localeId: string; label: string; definition: string }[];
  },
) {
  if (data.translations) {
    await prisma.glossaryTermTranslation.deleteMany({
      where: { glossaryTermId: id },
    });
  }
  const glossaryTerm = await prisma.glossaryTerm.update({
    where: { id },
    data: {
      term: data.term,
      translations: data.translations
        ? { create: data.translations }
        : undefined,
    },
    include: { translations: true },
  });
  revalidatePath("/admin/glossary");
  return glossaryTerm;
}

export async function deleteGlossaryTerm(id: string) {
  await prisma.glossaryTerm.delete({ where: { id } });
  revalidatePath("/admin/glossary");
}

export async function getTagGroups() {
  return prisma.tagGroup.findMany({
    include: { tags: true },
    orderBy: { name: "asc" },
  });
}

export async function createTagGroup(data: {
  name: string;
  description?: string;
}) {
  const tagGroup = await prisma.tagGroup.create({ data });
  revalidatePath("/admin/taxonomy");
  return tagGroup;
}

export async function createTag(data: { groupId: string; name: string }) {
  const tag = await prisma.tag.create({ data });
  revalidatePath("/admin/taxonomy");
  return tag;
}

export async function deleteTag(id: string) {
  await prisma.tag.delete({ where: { id } });
  revalidatePath("/admin/taxonomy");
}

export async function deleteTagGroup(id: string) {
  await prisma.tagGroup.delete({ where: { id } });
  revalidatePath("/admin/taxonomy");
}

export async function getLocales() {
  return prisma.locale.findMany({ orderBy: { id: "asc" } });
}

export async function createLocale(data: { id: string; name: string }) {
  const locale = await prisma.locale.create({ data });
  revalidatePath("/admin");
  return locale;
}

export async function getParticipants(surveyId?: string) {
  return prisma.participant.findMany({
    where: surveyId ? { surveyId } : undefined,
    include: {
      survey: { include: { translations: true } },
      sessions: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createParticipant(data: {
  accessCode: string;
  surveyId: string;
}) {
  const participant = await prisma.participant.create({ data });
  revalidatePath("/admin/participants");
  revalidatePath(`/admin/surveys/${data.surveyId}`);
  return participant;
}

export async function deleteParticipant(id: string) {
  await prisma.participant.delete({ where: { id } });
  revalidatePath("/admin/participants");
}

export async function getPatientsForSurvey(modelType: string) {
  return prisma.patient.findMany({
    where: { modelType },
    select: {
      id: true,
      externalId: true,
      notes: true,
      prediction: true,
    },
    orderBy: { externalId: "asc" },
  });
}

export async function getAllVignetteCandidates() {
  const [rsf, condor] = await Promise.all([
    getPatientsForSurvey("rsf"),
    getPatientsForSurvey("condor"),
  ]);
  return { rsf, condor };
}