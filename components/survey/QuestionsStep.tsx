"use client";

import { useState, useTransition } from "react";
import type { LoadedQuestion } from "@/lib/survey/data.server";
import { pickTranslation, ResponsePayload } from "@/lib/survey/shared";
import { nextStep, type StepKey } from "@/lib/survey/steps";
import { saveAndAdvance } from "@/app/survey/[code]/actions";
import { StepNav } from "./StepNav";
import { useJumpHandler } from "./useJumpHandler";
import {
  LikertQuestion,
  RadioQuestion,
  CheckboxQuestion,
  OpenQuestion,
  RankingQuestion,
} from "./Inputs";
import type { Modality } from "@/lib/generated/prisma/client";

type ResponseRow = {
  questionId: string;
  openText: string | null;
  rankingOrder: string[];
  selectedAnswers: { answerId: string }[];
};

type QuestionValue = {
  answerIds: string[];
  openText: string;
  rankingOrder: string[];
};

function valueFromExisting(
  q: LoadedQuestion,
  r: ResponseRow | undefined,
): QuestionValue {
  const defaultRanking = q.type === "RANKING" ? q.answers.map((a) => a.id) : [];
  return {
    answerIds: r?.selectedAnswers.map((s) => s.answerId) ?? [],
    openText: r?.openText ?? "",
    rankingOrder:
      r?.rankingOrder && r.rankingOrder.length > 0
        ? r.rankingOrder
        : defaultRanking,
  };
}

function isAnswered(q: LoadedQuestion, v: QuestionValue): boolean {
  switch (q.type) {
    case "LIKERT":
    case "RADIO":
      return v.answerIds.length === 1;
    case "CHECKBOX":
      return v.answerIds.length >= 1;
    case "OPEN":
      return v.openText.trim().length > 0;
    case "RANKING":
      return v.rankingOrder.length === q.answers.length;
  }
}

function buildPayloads(
  questions: LoadedQuestion[],
  values: Record<string, QuestionValue>,
  scope: { patientId?: string | null; modality?: Modality | null },
): ResponsePayload[] {
  return questions
    .filter((q) => isAnswered(q, values[q.id]))
    .map((q) => ({
      questionId: q.id,
      patientId: scope.patientId ?? null,
      modality: scope.modality ?? null,
      answerIds: values[q.id].answerIds.length
        ? values[q.id].answerIds
        : undefined,
      openText: values[q.id].openText || undefined,
      rankingOrder: values[q.id].rankingOrder.length
        ? values[q.id].rankingOrder
        : undefined,
    }));
}

export function QuestionsStep({
  code,
  sessionId,
  currentStep,
  questions,
  existing,
  locale,
  scope,
  intro,
}: {
  code: string;
  sessionId: string;
  currentStep: StepKey;
  questions: LoadedQuestion[];
  existing: Record<string, ResponseRow>;
  locale: string;
  scope: { patientId?: string | null; modality?: Modality | null };
  intro?: React.ReactNode;
}) {
  const [values, setValues] = useState<Record<string, QuestionValue>>(() => {
    const initial: Record<string, QuestionValue> = {};
    for (const q of questions)
      initial[q.id] = valueFromExisting(q, existing[q.id]);
    return initial;
  });
  const [pending, startTransition] = useTransition();

  useJumpHandler({
    sessionId,
    code,
    getPayloads: () => buildPayloads(questions, values, scope),
  });

  const allRequiredAnswered = questions.every(
    (q) => !q.isRequired || isAnswered(q, values[q.id]),
  );

  const handleContinue = () => {
    const next = nextStep(currentStep);
    if (!next) return;

    const payloads = buildPayloads(questions, values, scope);

    startTransition(async () => {
      await saveAndAdvance({ sessionId, code, payloads, nextStep: next });
    });
  };

  const update = (qId: string, patch: Partial<QuestionValue>) => {
    setValues((v) => ({ ...v, [qId]: { ...v[qId], ...patch } }));
  };

  return (
    <div>
      {intro}
      <div>
        {questions.map((q) => {
          const tr = pickTranslation(q.translations, locale);
          const v = values[q.id];
          return (
            <div key={q.id} className="question-block">
              <div className="question-text">
                {tr?.text ?? "(missing translation)"}
              </div>
              {tr?.helperText && (
                <div className="question-helper">{tr.helperText}</div>
              )}
              <QuestionInput
                question={q}
                value={v}
                onChange={(patch) => update(q.id, patch)}
                locale={locale}
              />
            </div>
          );
        })}
      </div>
      <StepNav
        code={code}
        currentStep={currentStep}
        onContinue={handleContinue}
        continueDisabled={!allRequiredAnswered}
        pending={pending}
        locale={locale}
      />
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
  locale,
}: {
  question: LoadedQuestion;
  value: QuestionValue;
  onChange: (patch: Partial<QuestionValue>) => void;
  locale: string;
}) {
  switch (question.type) {
    case "LIKERT":
      return (
        <LikertQuestion
          answers={question.answers}
          selectedId={value.answerIds[0]}
          onSelect={(id) => onChange({ answerIds: [id] })}
          locale={locale}
        />
      );
    case "RADIO":
      return (
        <RadioQuestion
          answers={question.answers}
          selectedId={value.answerIds[0]}
          onSelect={(id) => onChange({ answerIds: [id] })}
          locale={locale}
        />
      );
    case "CHECKBOX":
      return (
        <CheckboxQuestion
          answers={question.answers}
          selectedIds={value.answerIds}
          onToggle={(id) => {
            const set = new Set(value.answerIds);
            if (set.has(id)) set.delete(id);
            else set.add(id);
            onChange({ answerIds: Array.from(set) });
          }}
          locale={locale}
        />
      );
    case "OPEN":
      return (
        <OpenQuestion
          value={value.openText}
          onChange={(v) => onChange({ openText: v })}
          locale={locale}
        />
      );
    case "RANKING":
      return (
        <RankingQuestion
          answers={question.answers}
          order={
            value.rankingOrder.length
              ? value.rankingOrder
              : question.answers.map((a) => a.id)
          }
          onChange={(order) => onChange({ rankingOrder: order })}
          locale={locale}
        />
      );
  }
}
