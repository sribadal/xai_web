import "server-only";
import { prisma } from "@/lib/prisma";
import type { Modality } from "@/lib/generated/prisma/client";
import {
  deserializeStep,
  serializeStep,
  stepIndex,
  STEP_SEQUENCE,
  type StepKey,
} from "./steps";

export type SectionKey =
  | "consent"
  | "background"
  | "practice"
  | "modality-0"
  | "modality-1"
  | "modality-2"
  | "modality-3"
  | "final";

export type SectionStatus =
  | "current"
  | "done"
  | "incomplete"
  | "pending";

export type SectionCompletionStatus = "done" | "incomplete" | "pending";

export type SubStepProgress = {
  key: "patient-0" | "patient-1" | "summary";
  label: string;
  targetStep: StepKey;
  completionStatus: SectionCompletionStatus;
};

export type SectionProgress = {
  key: SectionKey;
  label: string;
  sublabel: string | null;
  targetStep: StepKey;
  status: SectionStatus;
  completionStatus: SectionCompletionStatus;
  stepIndices: number[];
  subProgress: { current: number; total: number } | null;
  subSteps: SubStepProgress[] | null;
};

const SECTION_LABELS: Record<Exclude<SectionKey, `modality-${number}`>, string> =
  {
    consent: "Consent",
    background: "Background",
    practice: "Practice",
    final: "Compare",
  };

function sectionForStep(step: StepKey): SectionKey | null {
  switch (step.kind) {
    case "intro":
      return null;
    case "consent":
      return "consent";
    case "background":
      return "background";
    case "practice":
      return "practice";
    case "patient":
    case "summary":
      return `modality-${step.modalityIndex}` as SectionKey;
    case "final":
      return "final";
    case "complete":
      return null;
  }
}

function firstStepOfSection(key: SectionKey): StepKey {
  switch (key) {
    case "consent":
      return { kind: "consent" };
    case "background":
      return { kind: "background" };
    case "practice":
      return { kind: "practice" };
    case "modality-0":
      return { kind: "patient", modalityIndex: 0, patientIndex: 0 };
    case "modality-1":
      return { kind: "patient", modalityIndex: 1, patientIndex: 0 };
    case "modality-2":
      return { kind: "patient", modalityIndex: 2, patientIndex: 0 };
    case "modality-3":
      return { kind: "patient", modalityIndex: 3, patientIndex: 0 };
    case "final":
      return { kind: "final" };
  }
}

function stepsOfSection(key: SectionKey): StepKey[] {
  switch (key) {
    case "consent":
      return [{ kind: "consent" }];
    case "background":
      return [{ kind: "background" }];
    case "practice":
      return [{ kind: "practice" }];
    case "modality-0":
    case "modality-1":
    case "modality-2":
    case "modality-3": {
      const m = Number(key.split("-")[1]) as 0 | 1 | 2 | 3;
      return [
        { kind: "patient", modalityIndex: m, patientIndex: 0 },
        { kind: "patient", modalityIndex: m, patientIndex: 1 },
        { kind: "summary", modalityIndex: m },
      ];
    }
    case "final":
      return [{ kind: "final" }];
  }
}

const ALL_SECTIONS: SectionKey[] = [
  "consent",
  "background",
  "practice",
  "modality-0",
  "modality-1",
  "modality-2",
  "modality-3",
  "final",
];

type SessionWithDeps = {
  id: string;
  modalityOrder: Modality[];
  currentStepKey: string;
  status: string;
  survey: {
    questions: {
      id: string;
      type: string;
      isRequired: boolean;
      active: boolean;
      tags: { tag: { name: string; group: { name: string } } }[];
    }[];
  };
  responses: {
    questionId: string;
    patientId: string | null;
    modality: Modality | null;
    openText: string | null;
    rankingOrder: string[];
    selectedAnswers: { id: string }[];
  }[];
  sessionPatients: {
    patientId: string;
    modality: Modality;
    modelType: string;
  }[];
};

function flowTagFor(q: SessionWithDeps["survey"]["questions"][number]): string | null {
  const tag = q.tags.find((t) => t.tag.group.name === "Survey flow");
  return tag?.tag.name ?? null;
}

function responseHasContent(
  r: SessionWithDeps["responses"][number],
): boolean {
  if (r.selectedAnswers.length > 0) return true;
  if (r.openText && r.openText.trim() !== "") return true;
  if (r.rankingOrder.length > 0) return true;
  return false;
}

function sectionRequiredMissing(
  section: SectionKey,
  session: SessionWithDeps,
): boolean {
  const qs = session.survey.questions.filter((q) => q.active && q.isRequired);

  switch (section) {
    case "consent":
    case "practice":
      return false;

    case "background": {
      const bgQs = qs.filter((q) => flowTagFor(q) === "background");
      for (const q of bgQs) {
        const r = session.responses.find(
          (r) =>
            r.questionId === q.id &&
            r.patientId === null &&
            r.modality === null,
        );
        if (!r || !responseHasContent(r)) return true;
      }
      return false;
    }

    case "final": {
      const finalQs = qs.filter((q) => flowTagFor(q) === "final");
      for (const q of finalQs) {
        const r = session.responses.find(
          (r) =>
            r.questionId === q.id &&
            r.patientId === null &&
            r.modality === null,
        );
        if (!r || !responseHasContent(r)) return true;
      }
      return false;
    }

    case "modality-0":
    case "modality-1":
    case "modality-2":
    case "modality-3": {
      const mIdx = Number(section.split("-")[1]) as 0 | 1 | 2 | 3;
      const modality = session.modalityOrder[mIdx];
      if (!modality) return false;

      const perVignette = qs.filter(
        (q) => flowTagFor(q) === "per-vignette",
      );
      const modalitySummary = qs.filter(
        (q) => flowTagFor(q) === "modality-summary",
      );

      const patientsInBlock = session.sessionPatients.filter(
        (sp) => sp.modality === modality,
      );

      for (const q of perVignette) {
        for (const sp of patientsInBlock) {
          const r = session.responses.find(
            (r) =>
              r.questionId === q.id &&
              r.patientId === sp.patientId &&
              r.modality === modality,
          );
          if (!r || !responseHasContent(r)) return true;
        }
      }

      for (const q of modalitySummary) {
        const r = session.responses.find(
          (r) =>
            r.questionId === q.id &&
            r.patientId === null &&
            r.modality === modality,
        );
        if (!r || !responseHasContent(r)) return true;
      }
      return false;
    }
  }
}

function sectionHasAnyResponses(
  section: SectionKey,
  session: SessionWithDeps,
): boolean {
  switch (section) {
    case "consent":
    case "practice":
      return false;

    case "background": {
      return session.responses.some(
        (r) =>
          r.patientId === null &&
          r.modality === null &&
          responseHasContent(r) &&
          session.survey.questions.some(
            (q) => q.id === r.questionId && flowTagFor(q) === "background",
          ),
      );
    }

    case "final": {
      return session.responses.some(
        (r) =>
          r.patientId === null &&
          r.modality === null &&
          responseHasContent(r) &&
          session.survey.questions.some(
            (q) => q.id === r.questionId && flowTagFor(q) === "final",
          ),
      );
    }

    case "modality-0":
    case "modality-1":
    case "modality-2":
    case "modality-3": {
      const mIdx = Number(section.split("-")[1]) as 0 | 1 | 2 | 3;
      const modality = session.modalityOrder[mIdx];
      if (!modality) return false;
      return session.responses.some(
        (r) => r.modality === modality && responseHasContent(r),
      );
    }
  }
}

function modalitySubStepCompletion(
  modalityIdx: 0 | 1 | 2 | 3,
  session: SessionWithDeps,
  currentStep: StepKey,
): SubStepProgress[] {
  const modality = session.modalityOrder[modalityIdx];
  if (!modality) {
    return [
      {
        key: "patient-0",
        label: "Patient 1",
        targetStep: { kind: "patient", modalityIndex: modalityIdx, patientIndex: 0 },
        completionStatus: "pending",
      },
      {
        key: "patient-1",
        label: "Patient 2",
        targetStep: { kind: "patient", modalityIndex: modalityIdx, patientIndex: 1 },
        completionStatus: "pending",
      },
      {
        key: "summary",
        label: "Reflection",
        targetStep: { kind: "summary", modalityIndex: modalityIdx },
        completionStatus: "pending",
      },
    ];
  }

  const requiredPerVignette = session.survey.questions.filter(
    (q) => q.active && q.isRequired && flowTagFor(q) === "per-vignette",
  );
  const requiredSummary = session.survey.questions.filter(
    (q) => q.active && q.isRequired && flowTagFor(q) === "modality-summary",
  );
  const rsfPatient = session.sessionPatients.find(
    (sp) => sp.modality === modality && sp.modelType === "rsf",
  );
  const condorPatient = session.sessionPatients.find(
    (sp) => sp.modality === modality && sp.modelType === "condor",
  );

  function patientStatus(
    patientId: string | undefined,
    stepIdx: 0 | 1,
  ): SectionCompletionStatus {
    if (!patientId) return "pending";

    const hasAny = session.responses.some(
      (r) =>
        r.patientId === patientId &&
        r.modality === modality &&
        responseHasContent(r),
    );

    let missing = false;
    for (const q of requiredPerVignette) {
      const r = session.responses.find(
        (r) =>
          r.questionId === q.id &&
          r.patientId === patientId &&
          r.modality === modality,
      );
      if (!r || !responseHasContent(r)) {
        missing = true;
        break;
      }
    }

    const passed =
      stepIndex(currentStep) >=
      stepIndex({
        kind: "patient",
        modalityIndex: modalityIdx,
        patientIndex: stepIdx,
      });

    if (!missing && (hasAny || passed)) return "done";
    if (hasAny || passed) return "incomplete";
    return "pending";
  }

  function summaryStatus(): SectionCompletionStatus {
    const hasAny = session.responses.some(
      (r) =>
        r.modality === modality &&
        r.patientId === null &&
        responseHasContent(r),
    );
    let missing = false;
    for (const q of requiredSummary) {
      const r = session.responses.find(
        (r) =>
          r.questionId === q.id &&
          r.patientId === null &&
          r.modality === modality,
      );
      if (!r || !responseHasContent(r)) {
        missing = true;
        break;
      }
    }
    const passed =
      stepIndex(currentStep) >=
      stepIndex({ kind: "summary", modalityIndex: modalityIdx });

    if (!missing && (hasAny || passed)) return "done";
    if (hasAny || passed) return "incomplete";
    return "pending";
  }

  return [
    {
      key: "patient-0",
      label: "Patient 1",
      targetStep: {
        kind: "patient",
        modalityIndex: modalityIdx,
        patientIndex: 0,
      },
      completionStatus: patientStatus(rsfPatient?.patientId, 0),
    },
    {
      key: "patient-1",
      label: "Patient 2",
      targetStep: {
        kind: "patient",
        modalityIndex: modalityIdx,
        patientIndex: 1,
      },
      completionStatus: patientStatus(condorPatient?.patientId, 1),
    },
    {
      key: "summary",
      label: "Reflection",
      targetStep: { kind: "summary", modalityIndex: modalityIdx },
      completionStatus: summaryStatus(),
    },
  ];
}

function sectionVisited(
  section: SectionKey,
  currentStep: StepKey,
): boolean {
  const sectionStart = stepIndex(firstStepOfSection(section));
  const currentIdx = stepIndex(currentStep);
  if (sectionStart < 0 || currentIdx < 0) return false;
  return currentIdx >= sectionStart;
}

function isCurrentSection(section: SectionKey, currentStep: StepKey): boolean {
  return sectionForStep(currentStep) === section;
}

function subProgressFor(
  section: SectionKey,
  currentStep: StepKey,
): { current: number; total: number; label: string } | null {
  if (!section.startsWith("modality-")) return null;
  if (!isCurrentSection(section, currentStep)) return null;

  if (currentStep.kind === "patient") {
    return {
      current: currentStep.patientIndex + 1,
      total: 3,
      label: `Patient ${currentStep.patientIndex + 1} of 2`,
    };
  }
  if (currentStep.kind === "summary") {
    return { current: 3, total: 3, label: "Reflection" };
  }
  return null;
}

export type ProgressData = {
  currentStep: StepKey;
  currentStepKey: string;
  sections: SectionProgress[];
};

export async function getProgress(
  sessionId: string,
): Promise<ProgressData | null> {
  const session = await prisma.surveySession.findUnique({
    where: { id: sessionId },
    include: {
      survey: {
        include: {
          questions: {
            include: {
              tags: { include: { tag: { include: { group: true } } } },
            },
          },
        },
      },
      responses: {
        include: { selectedAnswers: { select: { id: true } } },
      },
      sessionPatients: true,
    },
  });
  if (!session) return null;

  const currentStep = deserializeStep(session.currentStepKey);
  const sessionData: SessionWithDeps = {
    id: session.id,
    modalityOrder: session.modalityOrder as Modality[],
    currentStepKey: session.currentStepKey,
    status: session.status,
    survey: {
      questions: session.survey.questions.map((q) => ({
        id: q.id,
        type: q.type,
        isRequired: q.isRequired,
        active: q.active,
        tags: q.tags.map((t) => ({
          tag: { name: t.tag.name, group: { name: t.tag.group.name } },
        })),
      })),
    },
    responses: session.responses.map((r) => ({
      questionId: r.questionId,
      patientId: r.patientId,
      modality: r.modality,
      openText: r.openText,
      rankingOrder: r.rankingOrder,
      selectedAnswers: r.selectedAnswers.map((sa) => ({ id: sa.id })),
    })),
    sessionPatients: session.sessionPatients.map((sp) => ({
      patientId: sp.patientId,
      modality: sp.modality,
      modelType: sp.modelType,
    })),
  };

  const sections: SectionProgress[] = ALL_SECTIONS.map((key) => {
    const isCurrent = isCurrentSection(key, currentStep);
    const visited = sectionVisited(key, currentStep);
    const hasResponses = sectionHasAnyResponses(key, sessionData);
    const missing = sectionRequiredMissing(key, sessionData);

    let completionStatus: SectionCompletionStatus;
    if (!missing && (visited || hasResponses)) {
      completionStatus = "done";
    } else if (visited || hasResponses) {
      completionStatus = "incomplete";
    } else {
      completionStatus = "pending";
    }

    const status: SectionStatus = isCurrent ? "current" : completionStatus;

    let label: string;
    if (key.startsWith("modality-")) {
      const idx = Number(key.split("-")[1]) as 0 | 1 | 2 | 3;
      label = `Method ${idx + 1}`;
    } else {
      label = SECTION_LABELS[key as keyof typeof SECTION_LABELS];
    }

    const sub = subProgressFor(key, currentStep);

    let subSteps: SubStepProgress[] | null = null;
    if (key.startsWith("modality-")) {
      const idx = Number(key.split("-")[1]) as 0 | 1 | 2 | 3;
      subSteps = modalitySubStepCompletion(idx, sessionData, currentStep);
    }

    return {
      key,
      label,
      sublabel: sub?.label ?? null,
      targetStep: firstStepOfSection(key),
      status,
      completionStatus,
      stepIndices: stepsOfSection(key).map((s) => stepIndex(s)),
      subProgress: sub ? { current: sub.current, total: sub.total } : null,
      subSteps,
    };
  });

  return {
    currentStep,
    currentStepKey: serializeStep(currentStep),
    sections,
  };
}

export function stepKeyToSerialized(step: StepKey): string {
  return serializeStep(step);
}
export { STEP_SEQUENCE };