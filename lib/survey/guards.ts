import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Modality } from "@/lib/generated/prisma/client";

export async function redirectIfCompleted(code: string): Promise<void> {
  const participant = await prisma.participant.findUnique({
    where: { accessCode: code },
    include: { sessions: { orderBy: { startedAt: "desc" }, take: 1 } },
  });
  if (!participant) return; // unknown code → let the page's own notFound() handle it
  const session = participant.sessions[0];
  if (session && session.status === "COMPLETED") {
    redirect(`/survey/${code}/complete`);
  }
}

export type SummaryAnswer = {
  questionId: string;
  questionText: string;
  questionType: string;
  flowTag: string | null;
  displayOrder: number;
  model: "rsf" | "condor" | null;
  modality: Modality | null;
  answerLabels: string[];
  openText: string | null;
  rankingLabels: string[] | null;
  answeredAt: string;
};

export type Summary = {
  sessionId: string;
  accessCode: string;
  completedAt: string | null;
  startedAt: string;
  surveyTitle: string;
  surveyDescription: string | null;
  totalAnswers: number;
  vignetteCount: number;
  modalityOrder: Modality[];
  answers: SummaryAnswer[];
};

function pickText(
  translations: { localeId: string; text: string }[],
): string {
  return (
    translations.find((t) => t.localeId === "en")?.text ??
    translations[0]?.text ??
    "—"
  );
}

function pickLabel(
  translations: { localeId: string; label: string }[],
): string {
  return (
    translations.find((t) => t.localeId === "en")?.label ??
    translations[0]?.label ??
    "—"
  );
}

function pickSurveyTitle(
  translations: { localeId: string; title: string }[],
): string {
  return (
    translations.find((t) => t.localeId === "en")?.title ??
    translations[0]?.title ??
    "Survey"
  );
}

function pickSurveyDescription(
  translations: { localeId: string; description: string | null }[],
): string | null {
  return (
    translations.find((t) => t.localeId === "en")?.description ??
    translations[0]?.description ??
    null
  );
}

export async function loadSummary(code: string): Promise<Summary | null> {
  const participant = await prisma.participant.findUnique({
    where: { accessCode: code },
    include: {
      sessions: {
        orderBy: { startedAt: "desc" },
        take: 1,
        include: {
          survey: {
            include: {
              translations: true,
              questions: {
                include: {
                  translations: true,
                  answers: { include: { translations: true } },
                  tags: { include: { tag: { include: { group: true } } } },
                },
              },
            },
          },
          responses: {
            include: {
              patient: { select: { modelType: true } },
              selectedAnswers: {
                include: { answer: { include: { translations: true } } },
              },
            },
            orderBy: { answeredAt: "asc" },
          },
          sessionPatients: true,
        },
      },
    },
  });

  if (!participant || !participant.sessions[0]) return null;
  const session = participant.sessions[0];

  const answerLabelById = new Map<string, string>();
  for (const q of session.survey.questions) {
    for (const a of q.answers) {
      answerLabelById.set(a.id, pickLabel(a.translations));
    }
  }

  const answers: SummaryAnswer[] = session.responses.map((r) => {
    const q = session.survey.questions.find((qq) => qq.id === r.questionId);
    const flowTag =
      q?.tags.find((t) => t.tag.group.name === "Survey flow")?.tag.name ?? null;
    const rankingLabels =
      r.rankingOrder && r.rankingOrder.length > 0
        ? r.rankingOrder.map((aid) => answerLabelById.get(aid) ?? aid)
        : null;
    return {
      questionId: r.questionId,
      questionText: q ? pickText(q.translations) : "Unknown question",
      questionType: q?.type ?? "?",
      flowTag,
      displayOrder: q?.displayOrder ?? 9999,
      model: (r.patient?.modelType ?? null) as "rsf" | "condor" | null,
      modality: r.modality,
      answerLabels: r.selectedAnswers.map((sa) =>
        pickLabel(sa.answer.translations),
      ),
      openText: r.openText,
      rankingLabels,
      answeredAt: r.answeredAt.toISOString(),
    };
  });

  const modalityOrder = session.modalityOrder as Modality[];
  const modalityRank = new Map<string, number>();
  modalityOrder.forEach((m, i) => modalityRank.set(m, i));

  answers.sort((a, b) => {
    if (a.displayOrder !== b.displayOrder)
      return a.displayOrder - b.displayOrder;
    const ma = a.modality ? (modalityRank.get(a.modality) ?? 99) : -1;
    const mb = b.modality ? (modalityRank.get(b.modality) ?? 99) : -1;
    if (ma !== mb) return ma - mb;
    if (a.model !== b.model) {
      if (a.model === "rsf") return -1;
      if (b.model === "rsf") return 1;
    }
    return 0;
  });

  return {
    sessionId: session.id,
    accessCode: participant.accessCode,
    completedAt: session.completedAt?.toISOString() ?? null,
    startedAt: session.startedAt.toISOString(),
    surveyTitle: pickSurveyTitle(session.survey.translations),
    surveyDescription: pickSurveyDescription(session.survey.translations),
    totalAnswers: answers.length,
    vignetteCount: session.sessionPatients.length,
    modalityOrder,
    answers,
  };
}