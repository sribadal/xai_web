import { notFound } from "next/navigation";
import {
  getSessionByCode,
  getQuestionsByTag,
  getExistingResponses,
  type LoadedQuestion,
} from "@/lib/survey/data.server";
import { indexResponses } from "@/lib/survey/shared";
import { QuestionsStep } from "@/components/survey/QuestionsStep";
import type { Modality } from "@/lib/generated/prisma/client";
import { redirectIfCompleted } from "@/lib/survey/guards";
import { getLocale } from "@/lib/survey/locale";

const MODALITY_BY_VALUE: Modality[] = [
  "ATTRIBUTION",
  "COUNTERFACTUAL",
  "CASE_BASED",
  "RULE_BASED",
];

const T = {
  en: {
    eyebrow: "Final",
    title: "Final preferences",
    lede: (n: number) =>
      `Looking back across the ${n} explanation type${n === 1 ? "" : "s"} you have seen.`,
    method: (i: number) => `Method ${i}`,
  },
  nl: {
    eyebrow: "Afsluiting",
    title: "Eindvoorkeuren",
    lede: (n: number) =>
      `Terugkijkend op de ${n} uitlegtype${n === 1 ? "" : "s"} die u heeft gezien.`,
    method: (i: number) => `Methode ${i}`,
  },
} as const;

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

function anonymizeRankingAnswers(
  questions: LoadedQuestion[],
  modalityOrder: Modality[],
  methodLabel: (i: number) => string,
): LoadedQuestion[] {
  const labelMap = new Map<number, string>();
  modalityOrder.forEach((mod, i) => {
    const value = MODALITY_BY_VALUE.indexOf(mod);
    if (value !== -1) {
      labelMap.set(value, methodLabel(i + 1));
    }
  });

  return questions.map((q) => {
    if (q.type !== "RANKING") return q;
    return {
      ...q,
      answers: q.answers.map((a) => {
        const anon = labelMap.get(a.value);
        if (!anon) return a;
        return {
          ...a,
          label: anon,
          translations: a.translations.map((t: any) => ({ ...t, label: anon })),
        };
      }),
    };
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
  const locale = await getLocale();
  const t = T[locale];

  const rawQuestions = await getQuestionsByTag(
    loaded.session.surveyId,
    "final",
  );
  const questions = anonymizeRankingAnswers(
    filterModalityRankings(rawQuestions, loaded.session.modalityOrder),
    loaded.session.modalityOrder,
    t.method,
  );
  const existing = await getExistingResponses(
    loaded.session.id,
    questions.map((q) => q.id),
    { patientId: null, modality: null },
  );
  const modalityCount = loaded.session.modalityOrder.length;

  return (
    <div className="survey-stage">
      <div className="survey-eyebrow">{t.eyebrow}</div>
      <h1>{t.title}</h1>
      <p className="survey-lede">{t.lede(modalityCount)}</p>
      <div style={{ marginTop: "var(--survey-space-7)" }}>
        <QuestionsStep
          code={code}
          sessionId={loaded.session.id}
          currentStep={{ kind: "final" }}
          questions={questions}
          existing={indexResponses(existing)}
          locale={locale}
          scope={{ patientId: null, modality: null }}
        />
      </div>
    </div>
  );
}