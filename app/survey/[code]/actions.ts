"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Modality } from "@/lib/generated/prisma/client";
import type { ResponsePayload } from "@/lib/survey/shared";
import {
  stepToPath,
  serializeStep,
  deserializeStep,
  type StepKey,
} from "@/lib/survey/steps";

const MODALITY_TO_ARRAY_INDEX: Record<Modality, number> = {
  ATTRIBUTION: 0,
  COUNTERFACTUAL: 1,
  CASE_BASED: 2,
  RULE_BASED: 3,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function activeModalitiesForSurvey(
  surveyId: string,
): Promise<Modality[]> {
  const rows = await prisma.surveyMethod.findMany({
    where: { surveyId },
    select: { modality: true, modelType: true },
  });
  const byModality = new Map<Modality, Set<string>>();
  for (const r of rows) {
    if (!byModality.has(r.modality)) byModality.set(r.modality, new Set());
    byModality.get(r.modality)!.add(r.modelType);
  }
  const active: Modality[] = [];
  for (const [m, models] of byModality) {
    if (models.has("rsf") && models.has("condor")) active.push(m);
  }
  return active;
}

export async function startOrResumeSession(
  code: string,
): Promise<string | null> {
  const participant = await prisma.participant.findUnique({
    where: { accessCode: code },
    include: { sessions: { orderBy: { startedAt: "desc" }, take: 1 } },
  });
  if (!participant) return null;
  if (participant.sessions[0]) return participant.sessions[0].id;

  const survey = await prisma.survey.findUnique({
    where: { id: participant.surveyId },
  });
  if (!survey) return null;
  if (survey.status !== "PUBLISHED") return null;

  const rsfIds = survey.rsfVignettePatientIds;
  const condorIds = survey.condorVignettePatientIds;
  if (rsfIds.length !== 4 || condorIds.length !== 4) {
    throw new Error(
      `Survey ${survey.id} needs 4 RSF and 4 ConDOR vignettes; ` +
        `has ${rsfIds.length} rsf, ${condorIds.length} condor`,
    );
  }

  const patients = await prisma.patient.findMany({
    where: { id: { in: [...rsfIds, ...condorIds] } },
  });
  const byId = new Map(patients.map((p) => [p.id, p]));

  for (const id of rsfIds) {
    const p = byId.get(id);
    if (!p) throw new Error(`RSF vignette patient ${id} not found`);
    if (p.modelType !== "rsf")
      throw new Error(
        `Patient ${id} in RSF slot has modelType=${p.modelType}`,
      );
  }
  for (const id of condorIds) {
    const p = byId.get(id);
    if (!p) throw new Error(`ConDOR vignette patient ${id} not found`);
    if (p.modelType !== "condor")
      throw new Error(
        `Patient ${id} in ConDOR slot has modelType=${p.modelType}`,
      );
  }

  const active = await activeModalitiesForSurvey(survey.id);
  if (active.length === 0) {
    throw new Error(
      `Survey ${survey.id} has no fully-configured modalities`,
    );
  }

  const modalityOrder = shuffle(active);

  const sessionPatientData: {
    patientId: string;
    modality: Modality;
    modelType: string;
    displayOrder: number;
  }[] = [];
  let order = 0;
  for (const m of modalityOrder) {
    const idx = MODALITY_TO_ARRAY_INDEX[m];
    sessionPatientData.push({
      patientId: rsfIds[idx],
      modality: m,
      modelType: "rsf",
      displayOrder: order++,
    });
    sessionPatientData.push({
      patientId: condorIds[idx],
      modality: m,
      modelType: "condor",
      displayOrder: order++,
    });
  }

  const session = await prisma.surveySession.create({
    data: {
      surveyId: survey.id,
      participantId: participant.id,
      modalityOrder,
      currentStepKey: "intro",
      sessionPatients: { create: sessionPatientData },
    },
  });

  return session.id;
}

// ---------------------------------------------------------------------------
// Shared helper used by both saveAndAdvance and saveAndJump.
// Writes responses inside a transaction with a status guard.
// ---------------------------------------------------------------------------

async function writeResponsesAndCursor(
  sessionId: string,
  payloads: ResponsePayload[],
  nextStepKeySerialized: string,
  markCompleted: boolean,
): Promise<"ok" | "completed"> {
  const existing = await prisma.surveySession.findUnique({
    where: { id: sessionId },
    select: { status: true },
  });
  if (!existing) throw new Error(`Session ${sessionId} not found`);
  if (existing.status === "COMPLETED") return "completed";

  await prisma.$transaction(async (tx) => {
    const fresh = await tx.surveySession.findUnique({
      where: { id: sessionId },
      select: { status: true },
    });
    if (!fresh) throw new Error(`Session ${sessionId} not found`);
    if (fresh.status === "COMPLETED") {
      throw new Error("Session was completed mid-write; refusing to save.");
    }

    for (const p of payloads) {
      await tx.response.deleteMany({
        where: {
          sessionId,
          questionId: p.questionId,
          patientId: p.patientId ?? null,
          modality: p.modality ?? null,
        },
      });
      await tx.response.create({
        data: {
          sessionId,
          questionId: p.questionId,
          patientId: p.patientId ?? null,
          modality: p.modality ?? null,
          openText: p.openText ?? null,
          rankingOrder: p.rankingOrder ?? [],
          timeSpentMs: p.timeSpentMs ?? null,
          selectedAnswers: p.answerIds?.length
            ? { create: p.answerIds.map((answerId) => ({ answerId })) }
            : undefined,
        },
      });
    }

    await tx.surveySession.update({
      where: { id: sessionId },
      data: {
        currentStepKey: nextStepKeySerialized,
        ...(markCompleted
          ? { status: "COMPLETED", completedAt: new Date() }
          : {}),
      },
    });
  });
  return "ok";
}

export async function saveAndAdvance(args: {
  sessionId: string;
  code: string;
  payloads: ResponsePayload[];
  nextStep: StepKey;
}): Promise<void> {
  const result = await writeResponsesAndCursor(
    args.sessionId,
    args.payloads,
    serializeStep(args.nextStep),
    args.nextStep.kind === "complete",
  );
  if (result === "completed") {
    revalidatePath(`/survey/${args.code}`, "layout");
    redirect(`/survey/${args.code}/complete`);
  }
  revalidatePath(`/survey/${args.code}`, "layout");
  redirect(stepToPath(args.code, args.nextStep));
}

/**
 * Save current responses (best-effort, may be partial), then jump to the
 * requested step.
 *
 * Behaviour differences vs saveAndAdvance:
 *   - currentStepKey is set to the *jump target* (not the "next" of the
 *     current step). This is what "navigate freely" actually means.
 *   - Never marks the session COMPLETED; the only way to complete is via
 *     saveAndAdvance with nextStep.kind === "complete" (i.e. the explicit
 *     Submit at the end of /final).
 */
export async function saveAndJump(args: {
  sessionId: string;
  code: string;
  payloads: ResponsePayload[];
  targetStepKey: string; // serialized
}): Promise<void> {
  const target = deserializeStep(args.targetStepKey);
  // Don't let a jump land on the complete step; that's a submission concern.
  if (target.kind === "complete") {
    throw new Error(
      "Cannot jump to the completion step; submit via the final form.",
    );
  }

  const result = await writeResponsesAndCursor(
    args.sessionId,
    args.payloads,
    serializeStep(target),
    false,
  );
  if (result === "completed") {
    revalidatePath(`/survey/${args.code}`, "layout");
    redirect(`/survey/${args.code}/complete`);
  }
  revalidatePath(`/survey/${args.code}`, "layout");
  redirect(stepToPath(args.code, target));
}