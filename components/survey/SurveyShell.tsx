"use client";

import Link from "next/link";
import { ProgressStepper } from "./ProgressStepper";
import type { ProgressData } from "@/lib/survey/progress";

export function SurveyShell({
  children,
  code,
  title,
  progress,
  stepCounter,
}: {
  children: React.ReactNode;
  code: string;
  title: string;
  progress: ProgressData | null;
  stepCounter?: { current: number; total: number } | null;
}) {
  return (
    <div className="survey-shell">
      <header className="survey-header">
        <Link href={`/survey/${code}`} className="survey-header-title">
          {title}
        </Link>
      </header>

      {progress && (
        <ProgressStepper progress={progress} stepCounter={stepCounter ?? null} />
      )}

      <main className="survey-main">{children}</main>
    </div>
  );
}