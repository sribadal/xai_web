"use client";

import { useState, useMemo } from "react";
import type { Modality } from "@/lib/generated/prisma/client";
import { ThinkAloudHint } from "./ThinkAloudHint";
import { AttributionView } from "@/components/explanations/attribution";
import { CounterfactualView } from "@/components/explanations/counterfactual";
import { CaseBasedView } from "@/components/explanations/case_based";
import { RuleBasedView } from "@/components/explanations/rule_based";
import { PatientSummaryCard } from "./PatientSummary";
import { OutcomeTrajectoryCard } from "./OutcomeTrajectoryCard";
import { ExpandableCard } from "./ExpandableCard";
import { filterInternalLimeKeys } from "@/lib/feature-filters";
import type { GlossaryEntry } from "@/lib/survey/data.server";

const MODALITY_INTRO: Record<string, { en: string; nl: string }> = {
  ATTRIBUTION_rsf: {
    en: "This explanation highlights which patient characteristics had the most influence on the survival prediction. Green bars (left) indicate features that lower mortality risk; red bars (right) indicate features that increase it. Longer bars have a stronger effect.",
    nl: "Deze uitleg laat zien welke patiëntkenmerken de meeste invloed hadden op de overlevingsvoorspelling. Groene balken (rechts) duiden op kenmerken die het sterfterisico verlagen; rode balken (links) op kenmerken die het verhogen. Langere balken hebben een sterker effect.",
  },
  ATTRIBUTION_condor: {
    en: "This explanation highlights which patient characteristics had the most influence on the quality-of-life prediction. Green bars (right) indicate features that improve predicted quality of life; red bars (left) indicate features that reduce it. Longer bars have a stronger effect.",
    nl: "Deze uitleg laat zien welke patiëntkenmerken de meeste invloed hadden op de kwaliteit-van-levenvoorspelling. Groene balken (rechts) duiden op kenmerken die de voorspelde kwaliteit van leven verbeteren; rode balken (links) op kenmerken die deze verminderen. Langere balken hebben een sterker effect.",
  },
  COUNTERFACTUAL: {
    en: "This explanation shows what would need to be different about this patient for the predicted outcome to change. It highlights the smallest changes in patient characteristics that would lead to a different prediction.",
    nl: "Deze uitleg laat zien wat er anders zou moeten zijn aan deze patiënt om de voorspelde uitkomst te veranderen. Het toont de kleinste veranderingen in patiëntkenmerken die tot een andere voorspelling zouden leiden.",
  },
  CASE_BASED: {
    en: "This explanation shows patients from the dataset who are most similar to the current patient. You can compare their characteristics and outcomes side by side to better understand the prediction.",
    nl: "Deze uitleg toont patiënten uit de dataset die het meest lijken op de huidige patiënt. U kunt hun kenmerken en uitkomsten naast elkaar vergelijken om de voorspelling beter te begrijpen.",
  },
  RULE_BASED: {
    en: "This explanation presents simple if-then rules that describe how the model reached its prediction. Each rule shows a combination of patient conditions and the outcome they point to.",
    nl: "Deze uitleg presenteert eenvoudige als-dan-regels die beschrijven hoe het model tot zijn voorspelling is gekomen. Elke regel toont een combinatie van patiëntcondities en de uitkomst waar ze naar wijzen.",
  },
};

const RSF_HORIZON_OPTIONS: { value: string; label: string }[] = [
  { value: "3_months", label: "3-month risk" },
  { value: "6_months", label: "6-month risk" },
  { value: "12_months", label: "12-month risk" },
];

const CONDOR_HORIZON_OPTIONS: { value: string; label: string }[] = [
  { value: "1_month", label: "1-month QoL" },
  { value: "3_months", label: "3-month QoL" },
  { value: "6_months", label: "6-month QoL" },
  { value: "9_months", label: "9-month QoL" },
  { value: "12_months", label: "12-month QoL" },
];

const HORIZON_INDEPENDENT_MODALITIES = new Set<Modality>(["CASE_BASED"]);

const SIGNED_ATTRIBUTION_METHODS = new Set([
  "lime",
  "integrated_gradients",
  "deep_lift",
]);

type Explanation = {
  method: string;
  content: unknown;
  metadata: unknown;
  error: string | null;
  errorType: string | null;
  timeHorizon?: string | null;
};

function firstPredictionHorizon(
  prediction: unknown,
  horizonOptions: { value: string }[],
): string | undefined {
  const p = prediction as Record<string, unknown> | null;
  if (!p) return undefined;
  for (const opt of horizonOptions) {
    if (
      `mortality_risk_${opt.value}` in p ||
      `survival_prob_${opt.value}` in p ||
      `qol_${opt.value}` in p
    ) {
      return opt.value;
    }
  }
  return undefined;
}

export function VignetteShell({
  modality,
  modalityIndex,
  patientIndex,
  patient,
  modelType,
  methods,
  explanations,
  glossary,
  locale = "en",
  right,
}: {
  modality: Modality;
  modalityIndex: number;
  patientIndex: number;
  patient: {
    id: string;
    externalId: string;
    features: unknown;
    featuresRaw: unknown;
    prediction: unknown;
  };
  modelType: string;
  methods: string[];
  explanations: Explanation[];
  glossary?: Record<string, GlossaryEntry>;
  locale?: "en" | "nl";
  right: React.ReactNode;
}) {
  const isRsf = modelType === "rsf";
  const isCondor = modelType === "condor";
  const methodLabel = `Method ${modalityIndex + 1}`;

  const modalityIntro =
    MODALITY_INTRO[`${modality}_${modelType}`]?.[locale] ??
    MODALITY_INTRO[modality]?.[locale] ??
    null;

  const modalityIsHorizonIndependent =
    HORIZON_INDEPENDENT_MODALITIES.has(modality);

  const horizonOptions = useMemo(() => {
    if (isRsf) return RSF_HORIZON_OPTIONS;
    if (isCondor) return CONDOR_HORIZON_OPTIONS;
    return [];
  }, [isRsf, isCondor]);

  const availableHorizons = useMemo(() => {
    if (modalityIsHorizonIndependent) return new Set<string>();
    if (horizonOptions.length === 0) return new Set<string>();
    const found = new Set<string>();
    for (const e of explanations) {
      if (e.timeHorizon && e.timeHorizon !== "") found.add(e.timeHorizon);
    }
    return found;
  }, [modalityIsHorizonIndependent, horizonOptions, explanations]);

  const horizonChips = useMemo(
    () => horizonOptions.filter((o) => availableHorizons.has(o.value)),
    [horizonOptions, availableHorizons],
  );

  const useHorizons = horizonChips.length > 0;

  const [timeHorizon, setTimeHorizon] = useState<string>(() => {
    if (horizonChips[0]?.value) return horizonChips[0].value;
    if (modalityIsHorizonIndependent && horizonOptions.length > 0) {
      return firstPredictionHorizon(patient.prediction, horizonOptions) ?? "";
    }
    return "";
  });

  const visibleExplanations = useMemo(() => {
    if (!useHorizons) return explanations;
    return explanations.filter((e) => (e.timeHorizon ?? "") === timeHorizon);
  }, [useHorizons, explanations, timeHorizon]);

  const byMethod = new Map(visibleExplanations.map((e) => [e.method, e]));

  const horizonContentsByMethod = useMemo(() => {
    const map = new Map<string, Record<string, Record<string, number>>>();
    if (modality !== "ATTRIBUTION") return map;

    const indexed = new Map<string, Map<string, Record<string, number>>>();
    for (const exp of explanations) {
      if (!SIGNED_ATTRIBUTION_METHODS.has(exp.method)) continue;
      if (exp.error) continue;
      const horizonKey = exp.timeHorizon ?? "";
      if (!horizonKey) continue;
      if (
        !exp.content ||
        typeof exp.content !== "object" ||
        Array.isArray(exp.content)
      ) {
        continue;
      }
      if (!indexed.has(exp.method)) indexed.set(exp.method, new Map());
      indexed
        .get(exp.method)!
        .set(
          horizonKey,
          filterInternalLimeKeys(exp.content as Record<string, number>),
        );
    }

    const orderedKeys = horizonOptions.map((o) => o.value);
    for (const [method, perHorizon] of indexed) {
      const ordered: Record<string, Record<string, number>> = {};
      for (const key of orderedKeys) {
        if (perHorizon.has(key)) ordered[key] = perHorizon.get(key)!;
      }
      if (Object.keys(ordered).length > 1) map.set(method, ordered);
    }
    return map;
  }, [modality, explanations, horizonOptions]);

  return (
    <div className="survey-stage-wide">
      <div style={{ marginBottom: "var(--survey-space-7)" }}>
        <span className="modality-chip">
          {methodLabel} · {isRsf ? "Survival model" : "Quality-of-life model"}
        </span>
        <h2 style={{ marginTop: "var(--survey-space-4)" }}>
          <span className="display-italic">{methodLabel}</span> explanation
        </h2>
        {modalityIntro && (
          <p
            className="survey-prose"
            style={{
              marginTop: "var(--survey-space-3)",
              fontSize: "0.9rem",
              color: "var(--survey-ink-soft)",
              maxWidth: "56ch",
              lineHeight: 1.55,
            }}
          >
            {modalityIntro}
          </p>
        )}
        {methods.length > 1 && (
          <p
            className="survey-prose"
            style={{
              marginTop: "var(--survey-space-3)",
              fontSize: "0.9rem",
            }}
          >
            You will see two variants below. Please review both before answering
            the questions on the right.
          </p>
        )}
      </div>

      <div className="vignette-grid">
        <div className="vignette-left">
          <div className="survey-card survey-card--dummy">
            <div className="survey-card-label">Patient summary</div>
            <PatientSummaryCard patient={patient} />
          </div>

          <div className="survey-card survey-card--dummy">
            <div className="survey-card-label">Model output</div>
            <OutcomeTrajectoryCard
              prediction={patient.prediction}
              modelType={modelType}
              activeHorizon={timeHorizon}
              onHorizonChange={setTimeHorizon}
            />
          </div>

          {useHorizons && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--survey-space-4)",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--survey-muted, #666)",
                }}
              >
                Prediction window
              </span>
              <div
                role="tablist"
                aria-label="Prediction time horizon"
                style={{
                  display: "inline-flex",
                  border: "1px solid var(--survey-border, #d4d4d4)",
                  borderRadius: 6,
                  overflow: "hidden",
                  background: "var(--survey-card-bg, #fff)",
                }}
              >
                {horizonChips.map((opt, i) => {
                  const active = timeHorizon === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setTimeHorizon(opt.value)}
                      style={{
                        padding: "6px 14px",
                        fontSize: "0.8rem",
                        border: "none",
                        borderLeft:
                          i === 0
                            ? "none"
                            : "1px solid var(--survey-border, #d4d4d4)",
                        background: active
                          ? "var(--survey-accent, #1f1f1f)"
                          : "transparent",
                        color: active
                          ? "var(--survey-accent-fg, #fff)"
                          : "var(--survey-ink, #1f1f1f)",
                        cursor: "pointer",
                        transition: "background 120ms ease",
                        fontFamily: "inherit",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {methods.length === 0 ? (
            <div
              className="survey-card survey-card--dummy"
              style={{ minHeight: 320 }}
            >
              <div className="survey-card-label">{methodLabel}</div>
              <div>
                No methods configured for this modality. Set them in the survey
                edit form.
              </div>
            </div>
          ) : (
            methods.map((method) => {
              const exp = byMethod.get(method);
              if (!exp) {
                return (
                  <div
                    key={method}
                    className="survey-card survey-card--dummy"
                    style={{ minHeight: 200 }}
                  >
                    <div className="survey-card-label">{methodLabel}</div>
                    <div>
                      {useHorizons
                        ? `No data found at ${
                            horizonChips.find((h) => h.value === timeHorizon)
                              ?.label ?? timeHorizon
                          }.`
                        : "No data found."}
                    </div>
                  </div>
                );
              }
              if (exp.error) {
                return (
                  <div
                    key={method}
                    className="survey-card survey-card--dummy"
                    style={{ minHeight: 200 }}
                  >
                    <div className="survey-card-label">{methodLabel}</div>
                    <div>Could not generate this explanation: {exp.error}</div>
                  </div>
                );
              }

              const renderedContent =
                modality === "ATTRIBUTION" &&
                SIGNED_ATTRIBUTION_METHODS.has(method) &&
                exp.content &&
                typeof exp.content === "object" &&
                !Array.isArray(exp.content)
                  ? filterInternalLimeKeys(
                      exp.content as Record<string, number>,
                    )
                  : exp.content;

              return (
                <ExpandableCard
                  key={`${method}-${useHorizons ? timeHorizon : "default"}`}
                  label={methodLabel}
                >
                  <MethodExplanation
                    modality={modality}
                    method={method}
                    content={renderedContent}
                    metadata={exp.metadata}
                    patient={patient}
                    modelType={modelType}
                    timeHorizon={useHorizons ? timeHorizon : ""}
                    glossary={glossary}
                    horizonContents={horizonContentsByMethod.get(method)}
                  />
                </ExpandableCard>
              );
            })
          )}
        </div>

        <div className="vignette-right">
          <ThinkAloudHint>
            Please keep talking as you review this screen: what you notice
            first, what you understand, and what feels unclear.
          </ThinkAloudHint>
          {right}
        </div>
      </div>
    </div>
  );
}

function MethodExplanation({
  modality,
  method,
  content,
  metadata,
  patient,
  modelType,
  timeHorizon,
  glossary,
  horizonContents,
}: {
  modality: Modality;
  method: string;
  content: unknown;
  metadata: unknown;
  patient: { features: unknown; featuresRaw: unknown; prediction: unknown };
  modelType: string;
  timeHorizon: string;
  glossary?: Record<string, GlossaryEntry>;
  horizonContents?: Record<string, Record<string, number>>;
}) {
  const common = {
    glossary: glossary ?? {},
    locale: "en" as const,
  };

  switch (modality) {
    case "ATTRIBUTION":
      return (
        <AttributionView
          method={method}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content={content as any}
          modelType={modelType as "rsf" | "condor"}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          prediction={patient.prediction as any}
          timeHorizon={timeHorizon}
          // Prefer featuresRaw (clinical-only) when present, matching
          // the admin PatientDetail call site. Falling back to features
          // would re-introduce the cat_* dummies via the value lookup.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          featureValues={
            {
              ...(patient.features as Record<string, unknown>),
              ...(patient.featuresRaw as Record<string, unknown>),
            } as any
          }
          showTopNSelector
          horizonContents={horizonContents}
          // The vignette controls horizon selection at the parent level
          // (the OutcomeTrajectoryCard pills + the "Prediction window"
          // tab strip directly under it), so suppress the inner
          // HorizonChips row to avoid a third duplicate control. The
          // prop is honored end-to-end:
          // AttributionView → LimeView → ContributionView (which
          // already gates on showHorizonChips).
          showHorizonChips={false}
          {...common}
        />
      );
    case "CASE_BASED":
      return (
        <CaseBasedView
          method={method}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content={content as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          metadata={metadata as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          features={patient.features as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          featuresRaw={patient.featuresRaw as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          prediction={patient.prediction as any}
          {...common}
        />
      );
    case "COUNTERFACTUAL":
      return (
        <CounterfactualView
          method={method}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content={content as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          metadata={metadata as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          features={patient.features as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          featuresRaw={patient.featuresRaw as any}
          modelType={modelType as "rsf" | "condor"}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          prediction={patient.prediction as any}
          timeHorizon={timeHorizon}
          {...common}
        />
      );
    case "RULE_BASED":
      return (
        <RuleBasedView
          method={method}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content={content as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          featuresRaw={patient.featuresRaw as any}
          {...common}
        />
      );
  }
}
