import { notFound } from "next/navigation";
import {
  getSessionByCode,
  getQuestionsByTag,
  getExistingResponses,
} from "@/lib/survey/data.server";
import { indexResponses, DEFAULT_LOCALE } from "@/lib/survey/shared";
import { QuestionsStep } from "@/components/survey/QuestionsStep";
import { redirectIfCompleted } from "@/lib/survey/guards";

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await redirectIfCompleted(code);
  
  const loaded = await getSessionByCode(code);
  if (!loaded) notFound();

  const questions = await getQuestionsByTag(loaded.session.surveyId, "background");
  const existing = await getExistingResponses(
    loaded.session.id,
    questions.map((q) => q.id),
    { patientId: null, modality: null },
  );

  return (
    <div className="survey-stage">
      <div className="survey-eyebrow">Background</div>
      <h1>About you</h1>
      <p className="survey-lede">
        A few questions about your role and experience.
      </p>
      <div style={{ marginTop: "var(--survey-space-7)" }}>
        <QuestionsStep
          code={code}
          sessionId={loaded.session.id}
          currentStep={{ kind: "background" }}
          questions={questions}
          existing={indexResponses(existing)}
          locale={DEFAULT_LOCALE}
          scope={{ patientId: null, modality: null }}
        />
      </div>
    </div>
  );
}