import { notFound } from "next/navigation";
import {
  getSessionByCode,
  getQuestionsByTag,
  getExistingResponses,
  getExplanationsForPatient,
  getSessionPatient,
  getSurveyMethod,
  getGlossary,
} from "@/lib/survey/data.server";
import { resolveModality, indexResponses } from "@/lib/survey/shared";
import {
  isModalityIndex,
  isPatientIndex,
  modelForPatientIndex,
} from "@/lib/survey/steps";
import { QuestionsStep } from "@/components/survey/QuestionsStep";
import { VignetteShell } from "@/components/survey/VignetteShell";
import { redirectIfCompleted } from "@/lib/survey/guards";
import { getLocale } from "@/lib/survey/locale";

export default async function Page({
  params,
}: {
  params: Promise<{
    code: string;
    modalityIndex: string;
    patientIndex: string;
  }>;
}) {
  const { code, modalityIndex, patientIndex } = await params;
  const mIdx = Number(modalityIndex);
  const pIdx = Number(patientIndex);
  if (!isModalityIndex(mIdx) || !isPatientIndex(pIdx)) notFound();
  await redirectIfCompleted(code);
  const loaded = await getSessionByCode(code);
  if (!loaded) notFound();
  const modality = resolveModality(loaded.session, mIdx);
  if (!modality) notFound();
  const modelType = modelForPatientIndex(pIdx);
  const sessionPatient = await getSessionPatient(
    loaded.session.id,
    modality,
    modelType,
  );
  if (!sessionPatient) notFound();
  const methodRow = await getSurveyMethod(
    loaded.session.surveyId,
    modelType,
    modality,
  );
  const methods = methodRow ? [methodRow.method] : [];
  const locale = await getLocale();
  const [explanations, questions, glossary] = await Promise.all([
    getExplanationsForPatient(sessionPatient.patient.id, modality, methods),
    getQuestionsByTag(loaded.session.surveyId, "per-vignette"),
    getGlossary(locale),
  ]);
  const existing = await getExistingResponses(
    loaded.session.id,
    questions.map((q) => q.id),
    { patientId: sessionPatient.patient.id, modality },
  );
  return (
    <VignetteShell
      modality={modality}
      modalityIndex={mIdx}
      patientIndex={pIdx}
      patient={sessionPatient.patient}
      modelType={modelType}
      methods={methods}
      explanations={explanations}
      glossary={glossary}
      locale={locale}
      right={
        <QuestionsStep
          code={code}
          sessionId={loaded.session.id}
          currentStep={{
            kind: "patient",
            modalityIndex: mIdx,
            patientIndex: pIdx,
          }}
          questions={questions}
          existing={indexResponses(existing)}
          locale={locale}
          scope={{ patientId: sessionPatient.patient.id, modality }}
        />
      }
    />
  );
}
