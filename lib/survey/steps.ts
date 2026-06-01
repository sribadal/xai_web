export type ModalityIndex = 0 | 1 | 2 | 3;
export type PatientIndex = 0 | 1;

export type StepKey =
  | { kind: "intro" }
  | { kind: "consent" }
  | { kind: "background" }
  | { kind: "practice" }
  | { kind: "patient"; modalityIndex: ModalityIndex; patientIndex: PatientIndex }
  | { kind: "final" }
  | { kind: "complete" };

const MODALITY_INDICES: ModalityIndex[] = [0, 1, 2, 3];

export const STEP_SEQUENCE: StepKey[] = [
  { kind: "intro" },
  { kind: "consent" },
  { kind: "background" },
  { kind: "practice" },
  ...MODALITY_INDICES.flatMap<StepKey>((m) => [
    { kind: "patient", modalityIndex: m, patientIndex: 0 },
    { kind: "patient", modalityIndex: m, patientIndex: 1 },
  ]),
  { kind: "final" },
  { kind: "complete" },
];

export const TOTAL_STEPS = STEP_SEQUENCE.length;

// --- serialization ---

export function serializeStep(step: StepKey): string {
  switch (step.kind) {
    case "patient":
      return `patient:${step.modalityIndex}:${step.patientIndex}`;
    default:
      return step.kind;
  }
}

export function deserializeStep(key: string): StepKey {
  const [head, a, b] = key.split(":");
  switch (head) {
    case "intro":
    case "consent":
    case "background":
    case "practice":
    case "final":
    case "complete":
      return { kind: head };
    case "patient": {
      const m = Number(a), p = Number(b);
      if (isModalityIndex(m) && isPatientIndex(p)) {
        return { kind: "patient", modalityIndex: m, patientIndex: p };
      }
      return { kind: "intro" };
    }
    default:
      return { kind: "intro" };
  }
}

export function stepToPath(code: string, step: StepKey): string {
  const base = `/survey/${code}`;
  switch (step.kind) {
    case "intro": return `${base}/intro`;
    case "consent": return `${base}/consent`;
    case "background": return `${base}/background`;
    case "practice": return `${base}/practice`;
    case "patient": return `${base}/modality/${step.modalityIndex}/patient/${step.patientIndex}`;
    case "final": return `${base}/final`;
    case "complete": return `${base}/complete`;
  }
}

export function stepIndex(step: StepKey): number {
  return STEP_SEQUENCE.findIndex((s) => stepsEqual(s, step));
}

export function nextStep(step: StepKey): StepKey | null {
  const i = stepIndex(step);
  if (i < 0 || i >= STEP_SEQUENCE.length - 1) return null;
  return STEP_SEQUENCE[i + 1];
}

export function prevStep(step: StepKey): StepKey | null {
  const i = stepIndex(step);
  if (i <= 0) return null;
  return STEP_SEQUENCE[i - 1];
}

export function stepsEqual(a: StepKey, b: StepKey): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "patient" && b.kind === "patient") {
    return a.modalityIndex === b.modalityIndex && a.patientIndex === b.patientIndex;
  }
  return true;
}

export const MODEL_BY_PATIENT_INDEX = ["rsf", "condor"] as const;
export type ModelType = (typeof MODEL_BY_PATIENT_INDEX)[number];

export function modelForPatientIndex(p: PatientIndex): ModelType {
  return MODEL_BY_PATIENT_INDEX[p];
}

export function isModalityIndex(n: number): n is ModalityIndex {
  return n === 0 || n === 1 || n === 2 || n === 3;
}
export function isPatientIndex(n: number): n is PatientIndex {
  return n === 0 || n === 1;
}