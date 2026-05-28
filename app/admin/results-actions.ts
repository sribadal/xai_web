// app/admin/results-actions.ts
//
// Server actions for the results overview shown on the survey detail page.
// Pulls sessions + responses + answers + patient joins in one query, then
// shapes the data for the client. CSV exports are server-side too, so the
// client just downloads a string.

"use server";

import { prisma } from "@/lib/prisma";

export type ModalityKey =
  | "ATTRIBUTION"
  | "COUNTERFACTUAL"
  | "CASE_BASED"
  | "RULE_BASED";

export type ModelKey = "rsf" | "condor";

export type SessionRow = {
  id: string;
  accessCode: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  currentStepKey: string;
  responseCount: number;
};

export type AnswerOptionMeta = {
  id: string;
  value: number;
  displayOrder: number;
  label: string;
};

export type QuestionResultBase = {
  id: string;
  text: string;
  type: "LIKERT" | "RADIO" | "CHECKBOX" | "OPEN" | "RANKING";
  active: boolean;
  displayOrder: number;
  flowTag: string | null;
  totalResponses: number;
  answerOptions: AnswerOptionMeta[];
};

export type ClosedResult = QuestionResultBase & {
  shape: "CLOSED";
  overall: Record<string, number>;
  byCell: Partial<
    Record<ModelKey, Partial<Record<ModalityKey, Record<string, number>>>>
  >;
  overallMean: number | null;
  cellMeans: Partial<
    Record<ModelKey, Partial<Record<ModalityKey, number | null>>>
  >;
};

export type OpenResult = QuestionResultBase & {
  shape: "OPEN";
  entries: {
    text: string;
    model: ModelKey | null;
    modality: ModalityKey | null;
    accessCode: string;
  }[];
};

export type RankingResult = QuestionResultBase & {
  shape: "RANKING";
  meanRank: Record<string, number | null>;
  firstPlace: Record<string, number>;
  totalRankings: number;
};

export type QuestionResult = ClosedResult | OpenResult | RankingResult;

export type ResultsPayload = {
  surveyId: string;
  sessions: {
    total: number;
    inProgress: number;
    completed: number;
    abandoned: number;
    completionRate: number; // 0..1
    rows: SessionRow[];
  };
  questions: QuestionResult[];
  perSession: {
    sessionId: string;
    accessCode: string;
    status: string;
    answers: {
      questionId: string;
      questionText: string;
      questionType: string;
      model: ModelKey | null;
      modality: ModalityKey | null;
      answerLabels: string[];
      openText: string | null;
      rankingLabels: string[] | null;
      answeredAt: string;
    }[];
  }[];
};

function pickLabel(
  translations: { localeId: string; label: string }[],
): string {
  return (
    translations.find((t) => t.localeId === "en")?.label ??
    translations[0]?.label ??
    "—"
  );
}

function pickText(
  translations: { localeId: string; text: string }[],
): string {
  return (
    translations.find((t) => t.localeId === "en")?.text ??
    translations[0]?.text ??
    "Untitled question"
  );
}

const MODALITIES: ModalityKey[] = [
  "ATTRIBUTION",
  "COUNTERFACTUAL",
  "CASE_BASED",
  "RULE_BASED",
];
const MODELS: ModelKey[] = ["rsf", "condor"];

function emptyByCell<T>(make: () => T) {
  const out: Partial<Record<ModelKey, Partial<Record<ModalityKey, T>>>> = {};
  for (const m of MODELS) {
    out[m] = {};
    for (const mod of MODALITIES) {
      out[m]![mod] = make();
    }
  }
  return out;
}

export async function getSurveyResults(
  surveyId: string,
): Promise<ResultsPayload> {
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      questions: {
        include: {
          translations: true,
          answers: {
            include: { translations: true },
            orderBy: { displayOrder: "asc" },
          },
          tags: { include: { tag: { include: { group: true } } } },
        },
        orderBy: { displayOrder: "asc" },
      },
    },
  });
  if (!survey) throw new Error(`Survey ${surveyId} not found`);

  const sessions = await prisma.surveySession.findMany({
    where: { surveyId },
    include: {
      participant: true,
      responses: {
        include: {
          patient: { select: { modelType: true } },
          selectedAnswers: {
            include: { answer: { include: { translations: true } } },
          },
        },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  const inProgress = sessions.filter((s) => s.status === "IN_PROGRESS").length;
  const completed = sessions.filter((s) => s.status === "COMPLETED").length;
  const abandoned = sessions.filter((s) => s.status === "ABANDONED").length;
  const completionRate =
    sessions.length === 0 ? 0 : completed / sessions.length;

  const sessionRows: SessionRow[] = sessions.map((s) => ({
    id: s.id,
    accessCode: s.participant.accessCode,
    status: s.status,
    startedAt: s.startedAt.toISOString(),
    completedAt: s.completedAt?.toISOString() ?? null,
    currentStepKey: s.currentStepKey,
    responseCount: s.responses.length,
  }));

  const allResponses = sessions.flatMap((s) =>
    s.responses.map((r) => ({
      sessionId: s.id,
      accessCode: s.participant.accessCode,
      response: r,
      model: (r.patient?.modelType ?? null) as ModelKey | null,
      modality: (r.modality ?? null) as ModalityKey | null,
    })),
  );

  const responsesByQuestion = new Map<string, typeof allResponses>();
  for (const r of allResponses) {
    const list = responsesByQuestion.get(r.response.questionId) ?? [];
    list.push(r);
    responsesByQuestion.set(r.response.questionId, list);
  }

  const answerById = new Map<
    string,
    { id: string; value: number; label: string }
  >();
  for (const q of survey.questions) {
    for (const a of q.answers) {
      answerById.set(a.id, {
        id: a.id,
        value: a.value,
        label: pickLabel(a.translations),
      });
    }
  }

  const questionResults: QuestionResult[] = survey.questions.map((q) => {
    const text = pickText(q.translations);
    const flowTag =
      q.tags.find((t) => t.tag.group.name === "Survey flow")?.tag.name ?? null;
    const responsesForQ = responsesByQuestion.get(q.id) ?? [];
    const answerOptions: AnswerOptionMeta[] = q.answers.map((a) => ({
      id: a.id,
      value: a.value,
      displayOrder: a.displayOrder,
      label: pickLabel(a.translations),
    }));

    const base: QuestionResultBase = {
      id: q.id,
      text,
      type: q.type as QuestionResultBase["type"],
      active: q.active,
      displayOrder: q.displayOrder,
      flowTag,
      totalResponses: responsesForQ.length,
      answerOptions,
    };

    if (q.type === "OPEN") {
      const entries = responsesForQ
        .filter((r) => r.response.openText && r.response.openText.trim() !== "")
        .map((r) => ({
          text: r.response.openText!,
          model: r.model,
          modality: r.modality,
          accessCode: r.accessCode,
        }));
      return { ...base, shape: "OPEN", entries };
    }

    if (q.type === "RANKING") {
      // rankingOrder is a string[] of answer ids in chosen order.
      const meanRankAcc: Record<string, { sum: number; n: number }> = {};
      const firstPlace: Record<string, number> = {};
      for (const a of q.answers) {
        meanRankAcc[a.id] = { sum: 0, n: 0 };
        firstPlace[a.id] = 0;
      }
      let totalRankings = 0;
      for (const r of responsesForQ) {
        const order = r.response.rankingOrder;
        if (!order || order.length === 0) continue;
        totalRankings += 1;
        order.forEach((answerId, idx) => {
          const acc = meanRankAcc[answerId];
          if (acc) {
            acc.sum += idx + 1;
            acc.n += 1;
          }
          if (idx === 0 && firstPlace[answerId] !== undefined) {
            firstPlace[answerId] += 1;
          }
        });
      }
      const meanRank: Record<string, number | null> = {};
      for (const [id, { sum, n }] of Object.entries(meanRankAcc)) {
        meanRank[id] = n === 0 ? null : sum / n;
      }
      return { ...base, shape: "RANKING", meanRank, firstPlace, totalRankings };
    }

    // LIKERT / RADIO / CHECKBOX → closed
    const overall: Record<string, number> = {};
    for (const a of q.answers) overall[a.id] = 0;
    const byCell = emptyByCell<Record<string, number>>(() => {
      const o: Record<string, number> = {};
      for (const a of q.answers) o[a.id] = 0;
      return o;
    });

    // For mean calculation
    let overallSum = 0;
    let overallN = 0;
    const cellSums = emptyByCell<{ sum: number; n: number }>(() => ({
      sum: 0,
      n: 0,
    }));

    for (const r of responsesForQ) {
      for (const sel of r.response.selectedAnswers) {
        const answer = answerById.get(sel.answerId);
        if (!answer) continue;
        if (overall[answer.id] !== undefined) overall[answer.id] += 1;
        if (q.type === "LIKERT" || q.type === "RADIO") {
          overallSum += answer.value;
          overallN += 1;
          if (r.model && r.modality) {
            const cell = cellSums[r.model]?.[r.modality];
            if (cell) {
              cell.sum += answer.value;
              cell.n += 1;
            }
          }
        }
        if (r.model && r.modality) {
          const bucket = byCell[r.model]?.[r.modality];
          if (bucket && bucket[answer.id] !== undefined) {
            bucket[answer.id] += 1;
          }
        }
      }
    }

    const isNumeric = q.type === "LIKERT" || q.type === "RADIO";
    const overallMean = isNumeric && overallN > 0 ? overallSum / overallN : null;
    const cellMeans = emptyByCell<number | null>(() => null);
    if (isNumeric) {
      for (const m of MODELS) {
        for (const mod of MODALITIES) {
          const cell = cellSums[m]?.[mod];
          cellMeans[m]![mod] = cell && cell.n > 0 ? cell.sum / cell.n : null;
        }
      }
    }

    return {
      ...base,
      shape: "CLOSED",
      overall,
      byCell,
      overallMean,
      cellMeans,
    };
  });

  const perSession: ResultsPayload["perSession"] = sessions.map((s) => {
    const answers = s.responses
      .map((r) => {
        const q = survey.questions.find((qq) => qq.id === r.questionId);
        const labels = r.selectedAnswers.map((sa) =>
          pickLabel(sa.answer.translations),
        );
        let rankingLabels: string[] | null = null;
        if (r.rankingOrder && r.rankingOrder.length > 0) {
          rankingLabels = r.rankingOrder.map((aid) => {
            const a = answerById.get(aid);
            return a?.label ?? aid;
          });
        }
        return {
          questionId: r.questionId,
          questionText: q ? pickText(q.translations) : "Unknown question",
          questionType: q?.type ?? "?",
          model: (r.patient?.modelType ?? null) as ModelKey | null,
          modality: (r.modality ?? null) as ModalityKey | null,
          answerLabels: labels,
          openText: r.openText,
          rankingLabels,
          answeredAt: r.answeredAt.toISOString(),
          displayOrder: q?.displayOrder ?? 9999,
        };
      })
      .sort((a, b) => a.displayOrder - b.displayOrder)
      // Strip displayOrder before returning (it's an internal sort key).
      .map(({ displayOrder, ...rest }) => rest); // eslint-disable-line @typescript-eslint/no-unused-vars

    return {
      sessionId: s.id,
      accessCode: s.participant.accessCode,
      status: s.status,
      answers,
    };
  });

  return {
    surveyId,
    sessions: {
      total: sessions.length,
      inProgress,
      completed,
      abandoned,
      completionRate,
      rows: sessionRows,
    },
    questions: questionResults,
    perSession,
  };
}

// ---------------------------------------------------------------------------
// CSV exports (long format — one row per response)
// ---------------------------------------------------------------------------

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function exportResponsesCsv(surveyId: string): Promise<string> {
  const data = await getSurveyResults(surveyId);

  const header = [
    "session_id",
    "access_code",
    "session_status",
    "question_id",
    "question_text",
    "question_type",
    "model",
    "modality",
    "answer_label",
    "open_text",
    "ranking_order",
    "answered_at",
  ];
  const lines: string[] = [header.join(",")];

  for (const s of data.perSession) {
    for (const a of s.answers) {
      if (a.answerLabels.length > 0) {
        for (const lab of a.answerLabels) {
          lines.push(
            [
              s.sessionId,
              s.accessCode,
              s.status,
              a.questionId,
              a.questionText,
              a.questionType,
              a.model ?? "",
              a.modality ?? "",
              lab,
              "",
              "",
              a.answeredAt,
            ]
              .map(csvEscape)
              .join(","),
          );
        }
      } else if (a.openText) {
        lines.push(
          [
            s.sessionId,
            s.accessCode,
            s.status,
            a.questionId,
            a.questionText,
            a.questionType,
            a.model ?? "",
            a.modality ?? "",
            "",
            a.openText,
            "",
            a.answeredAt,
          ]
            .map(csvEscape)
            .join(","),
        );
      } else if (a.rankingLabels) {
        lines.push(
          [
            s.sessionId,
            s.accessCode,
            s.status,
            a.questionId,
            a.questionText,
            a.questionType,
            a.model ?? "",
            a.modality ?? "",
            "",
            "",
            a.rankingLabels.join(" > "),
            a.answeredAt,
          ]
            .map(csvEscape)
            .join(","),
        );
      } else {
        lines.push(
          [
            s.sessionId,
            s.accessCode,
            s.status,
            a.questionId,
            a.questionText,
            a.questionType,
            a.model ?? "",
            a.modality ?? "",
            "",
            "",
            "",
            a.answeredAt,
          ]
            .map(csvEscape)
            .join(","),
        );
      }
    }
  }

  return lines.join("\n");
}

export async function exportSessionsCsv(surveyId: string): Promise<string> {
  const data = await getSurveyResults(surveyId);
  const header = [
    "session_id",
    "access_code",
    "status",
    "started_at",
    "completed_at",
    "current_step",
    "response_count",
  ];
  const lines = [header.join(",")];
  for (const s of data.sessions.rows) {
    lines.push(
      [
        s.id,
        s.accessCode,
        s.status,
        s.startedAt,
        s.completedAt ?? "",
        s.currentStepKey,
        s.responseCount,
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return lines.join("\n");
}