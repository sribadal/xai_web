"use client";

import { useState, useTransition } from "react";
import { saveAndAdvance } from "@/app/survey/[code]/actions";
import { nextStep, type StepKey } from "@/lib/survey/steps";
import { StepNav } from "./StepNav";

export function StaticStep({
  code,
  sessionId,
  currentStep,
  eyebrow,
  title,
  children,
  requireConsent,
  consentLabel,
  hideNav,
  continueLabel,
}: {
  code: string;
  sessionId: string;
  currentStep: StepKey;
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  requireConsent?: boolean;
  consentLabel?: string;
  hideNav?: boolean;
  continueLabel?: string;
}) {
  const [checked, setChecked] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleContinue = () => {
    const next = nextStep(currentStep);
    if (!next) return;
    startTransition(async () => {
      await saveAndAdvance({ sessionId, code, payloads: [], nextStep: next });
    });
  };

  const disabled = requireConsent ? !checked : false;

  return (
    <div className="survey-stage">
      {eyebrow && <div className="survey-eyebrow">{eyebrow}</div>}
      <h1>{title}</h1>
      <div className="survey-prose" style={{ marginTop: "var(--survey-space-6)" }}>
        {children}
      </div>

      {requireConsent && (
        <label className="consent-check">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          <span>{consentLabel ?? "I agree to participate"}</span>
        </label>
      )}

      {!hideNav && (
        <StepNav
          code={code}
          currentStep={currentStep}
          onContinue={handleContinue}
          continueDisabled={disabled}
          pending={pending}
          continueLabel={continueLabel}
        />
      )}
    </div>
  );
}