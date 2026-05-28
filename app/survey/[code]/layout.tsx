import { getSessionByCode } from "@/lib/survey/data.server";
import { SurveyShell } from "@/components/survey/SurveyShell";
import { getProgress } from "@/lib/survey/progress";
import {
  deserializeStep,
  stepIndex,
  TOTAL_STEPS,
} from "@/lib/survey/steps";
import "./survey.css";

function pickTitle(
  translations: { localeId: string; title: string }[] | undefined,
): string {
  if (!translations || translations.length === 0) return "Survey";
  return (
    translations.find((t) => t.localeId === "en")?.title ??
    translations[0]?.title ??
    "Survey"
  );
}

export default async function SurveyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const loaded = await getSessionByCode(code);

  const surveyTitle = loaded
    ? pickTitle(loaded.session.survey.translations)
    : "Survey";

  let progress = null;
  let stepCounter: { current: number; total: number } | null = null;

  if (loaded) {
    const step = deserializeStep(loaded.session.currentStepKey);
    const isStepperVisible = step.kind !== "intro" && step.kind !== "complete";

    if (isStepperVisible) {
      progress = await getProgress(loaded.session.id);
      const idx = stepIndex(step);
      if (idx >= 0) {
        stepCounter = { current: idx + 1, total: TOTAL_STEPS - 1 };
      }
    }
  }

  return (
    <div className="survey-root">
      <SurveyShell
        code={code}
        title={surveyTitle}
        progress={progress}
        stepCounter={stepCounter}
      >
        {children}
      </SurveyShell>
    </div>
  );
}