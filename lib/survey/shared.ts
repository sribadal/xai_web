import type { Modality } from "@/lib/generated/prisma/client";

export const DEFAULT_LOCALE = "en";

type Translatable = { localeId: string };

export function pickTranslation<T extends Translatable>(
  translations: T[] | undefined | null,
  locale: string,
): T | null {
  if (!translations || translations.length === 0) return null;
  return (
    translations.find((t) => t.localeId === locale) ??
    translations.find((t) => t.localeId === DEFAULT_LOCALE) ??
    translations[0] ??
    null
  );
}

export function resolveModality(
  session: { modalityOrder: Modality[] },
  index: number,
): Modality | null {
  return session.modalityOrder[index] ?? null;
}

export type ResponsePayload = {
  questionId: string;
  patientId?: string | null;
  modality?: Modality | null;
  answerIds?: string[];
  openText?: string | null;
  rankingOrder?: string[];
  timeSpentMs?: number;
};

export function indexResponses<T extends { questionId: string }>(
  responses: T[],
): Record<string, T> {
  const out: Record<string, T> = {};
  for (const r of responses) out[r.questionId] = r;
  return out;
}