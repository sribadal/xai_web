import { notFound } from "next/navigation";
import {
  getSessionByCode,
  getQuestionsByTag,
  getExistingResponses,
  type LoadedQuestion,
} from "@/lib/survey/data.server";
import { indexResponses, DEFAULT_LOCALE } from "@/lib/survey/shared";
import { QuestionsStep } from "@/components/survey/QuestionsStep";
import type { Modality } from "@/lib/generated/prisma/client";
import { redirectIfCompleted } from "@/lib/survey/guards";

const MODALITY_BY_VALUE: Modality[] = [
  "ATTRIBUTION",
  "COUNTERFACTUAL",
  "CASE_BASED",
  "RULE_BASED",
];

function filterModalityRankings(
  questions: LoadedQuestion[],
  modalityOrder: Modality[],
): LoadedQuestion[] {
  const shown = new Set(modalityOrder);
  return questions.map((q) => {
    if (q.type !== "RANKING") return q;
    if (q.answers.length !== 4) return q;
    const filtered = q.answers.filter((a) => {
      const mod = MODALITY_BY_VALUE[a.value];
      return mod !== undefined && shown.has(mod);
    });
    if (filtered.length === q.answers.length) return q;
    return { ...q, answers: filtered };
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await redirectIfCompleted(code);
  
  const loaded = await getSessionByCode(code);
  if (!loaded) notFound();

  const rawQuestions = await getQuestionsByTag(
    loaded.session.surveyId,
    "final",
  );
  const questions = filterModalityRankings(
    rawQuestions,
    loaded.session.modalityOrder,
  );
  const existing = await getExistingResponses(
    loaded.session.id,
    questions.map((q) => q.id),
    { patientId: null, modality: null },
  );

  const modalityCount = loaded.session.modalityOrder.length;

  return (
    <div className="survey-stage">
      <div className="survey-eyebrow">Final</div>
      <h1>Final preferences</h1>
      <p className="survey-lede">
        Looking back across the {modalityCount} explanation type
        {modalityCount === 1 ? "" : "s"} you have seen.
      </p>
      <div style={{ marginTop: "var(--survey-space-7)" }}>
        <QuestionsStep
          code={code}
          sessionId={loaded.session.id}
          currentStep={{ kind: "final" }}
          questions={questions}
          existing={indexResponses(existing)}
          locale={DEFAULT_LOCALE}
          scope={{ patientId: null, modality: null }}
        />
      </div>
    </div>
  );
}