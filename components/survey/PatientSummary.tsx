import {
  generatePatientNarrative,
  generateModelOutputSummary,
} from "@/lib/survey/patient-narrative";

export function PatientSummaryCard({
  patient,
}: {
  patient: { externalId: string; featuresRaw: unknown };
}) {
  const paragraphs = generatePatientNarrative(patient.featuresRaw);
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
}: {
  prediction: unknown;
  modelType: string;
  timeHorizon?: string;
}) {
  const summary = generateModelOutputSummary(prediction, modelType, timeHorizon);
  return (
    <div className="survey-card">
      <div className="survey-card-label">Model prediction</div>
      <div className="survey-prose">
        <p>{summary}</p>
      </div>
    </div>
  );
}