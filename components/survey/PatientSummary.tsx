import {
  generatePatientNarrative,
  generateModelOutputSummary,
} from "@/lib/survey/patient-narrative";

export function PatientSummaryCard({
  patient,
  locale,
}: {
  patient: { externalId: string; featuresRaw: unknown };
  locale?: string;
}) {
  const paragraphs = generatePatientNarrative(patient.featuresRaw, locale);
  return (
    <div className="survey-card">
      <div className="survey-prose">
        {paragraphs.map((p, i) => (
          <p key={i} style={{ marginBottom: "var(--survey-space-2)" }}>
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

export function ModelOutputCard({
  prediction,
  modelType,
  timeHorizon,
  locale = "en",
}: {
  prediction: unknown;
  modelType: string;
  timeHorizon?: string;
  locale?: string;
}) {
  const summary = generateModelOutputSummary(
    prediction,
    modelType,
    timeHorizon,
    locale,
  );
  return (
    <div className="survey-card">
      <div className="survey-card-label">
        {locale === "nl" ? "Modelvoorspelling" : "Model prediction"}
      </div>
      <div className="survey-prose">
        <p>{summary}</p>
      </div>
    </div>
  );
}
