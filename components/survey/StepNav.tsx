"use client";

import Link from "next/link";
import { stepToPath, prevStep, type StepKey } from "@/lib/survey/steps";

const NAV_T = {
  en: { back: "← Back", cont: "Continue", saving: "Saving…" },
  nl: { back: "← Terug", cont: "Doorgaan", saving: "Opslaan…" },
} as const;

export function StepNav({
  code,
  currentStep,
  onContinue,
  continueDisabled,
  continueLabel,
  pending,
  locale = "en",
}: {
  code: string;
  currentStep: StepKey;
  onContinue?: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
  pending?: boolean;
  locale?: string;
}) {
  const t = NAV_T[locale as keyof typeof NAV_T] ?? NAV_T.en;
  const back = prevStep(currentStep);
  const backHref = back ? stepToPath(code, back) : null;

  return (
    <div className="survey-nav">
      {backHref ? (
        <Link href={backHref} className="survey-btn survey-btn--ghost">
          {t.back}
        </Link>
      ) : (
        <span />
      )}
      <button
        type="button"
        className="survey-btn"
        onClick={onContinue}
        disabled={continueDisabled || pending}
      >
        {pending ? t.saving : continueLabel ?? t.cont}
      </button>
    </div>
  );
}