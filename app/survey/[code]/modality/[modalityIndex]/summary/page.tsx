import { notFound } from "next/navigation";
import {
  getSessionByCode,
  getQuestionsByTag,
  getExistingResponses,
} from "@/lib/survey/data.server";
import { DEFAULT_LOCALE, indexResponses, resolveModality} from "@/lib/survey/shared";
import { isModalityIndex } from "@/lib/survey/steps";
import { QuestionsStep } from "@/components/survey/QuestionsStep";

const MODALITY_LABEL: Record<string, string> = {
  ATTRIBUTION: "Attribution",
  COUNTERFACTUAL: "Counterfactual",
  CASE_BASED: "Case-based",
  RULE_BASED: "Rule-based",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string; modalityIndex: string }>;
}) {
  const { code, modalityIndex } = await params;
  const mIdx = Number(modalityIndex);
  if (!isModalityIndex(mIdx)) notFound();

  const loaded = await getSessionByCode(code);
  if (!loaded) notFound();

  const modality = resolveModality(loaded.session, mIdx);
  if (!modality) notFound();

  const questions = await getQuestionsByTag(loaded.session.surveyId, "modality-summary");
  const existing = await getExistingResponses(
    loaded.session.id,
    questions.map((q) => q.id),
    { patientId: null, modality },
  );

  return (
    <div className="survey-stage">
      <div className="survey-eyebrow">Summary</div>
      <h1>
        <span className="display-italic">{MODALITY_LABEL[modality]}</span> — reflections
      </h1>
      <p className="survey-lede">
        You have now seen this explanation type for two patient examples.
      </p>
      <div style={{ marginTop: "var(--survey-space-7)" }}>
        <QuestionsStep
          code={code}
          sessionId={loaded.session.id}
          currentStep={{ kind: "summary", modalityIndex: mIdx }}
          questions={questions}
          existing={indexResponses(existing)}
          locale={DEFAULT_LOCALE}
          scope={{ patientId: null, modality }}
        />
      </div>
    </div>
  );
}