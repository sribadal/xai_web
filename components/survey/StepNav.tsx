"use client";

import Link from "next/link";
import { stepToPath, prevStep, type StepKey } from "@/lib/survey/steps";

export function StepNav({
  code,
  currentStep,
  onContinue,
  continueDisabled,
  continueLabel,
  pending,
}: {
  code: string;
  currentStep: StepKey;
  onContinue?: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
  pending?: boolean;
}) {
  const back = prevStep(currentStep);
  const backHref = back ? stepToPath(code, back) : null;

  return (
    <div className="survey-nav">
      {backHref ? (
        <Link href={backHref} className="survey-btn survey-btn--ghost">
          ← Back
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
        {pending ? "Saving…" : continueLabel ?? "Continue"}
      </button>
    </div>
  );
}