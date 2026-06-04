import { notFound } from "next/navigation";
import {
  getSessionByCode,
  getQuestionsByTag,
  getExistingResponses,
} from "@/lib/survey/data.server";
import { indexResponses } from "@/lib/survey/shared";
import { QuestionsStep } from "@/components/survey/QuestionsStep";
import { redirectIfCompleted } from "@/lib/survey/guards";
import { getLocale } from "@/lib/survey/locale";

const T = {
  en: {
    eyebrow: "Background",
    title: "About you",
    lede: "A few questions about your role and experience.",
  },
  nl: {
    eyebrow: "Achtergrond",
    title: "Over u",
    lede: "Een paar vragen over uw rol en ervaring.",
  },
} as const;

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

  const questions = await getQuestionsByTag(loaded.session.surveyId, "background");
  const existing = await getExistingResponses(
    loaded.session.id,
    questions.map((q) => q.id),
    { patientId: null, modality: null },
  );

  return (
    <div className="survey-stage">
      <div className="survey-eyebrow">{t.eyebrow}</div>
      <h1>{t.title}</h1>
      <p className="survey-lede">{t.lede}</p>
      <div style={{ marginTop: "var(--survey-space-7)" }}>
        <QuestionsStep
          code={code}
          sessionId={loaded.session.id}
          currentStep={{ kind: "background" }}
          questions={questions}
          existing={indexResponses(existing)}
          locale={locale}
          scope={{ patientId: null, modality: null }}
        />
      </div>
    </div>
  );
}