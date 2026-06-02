"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttributionView } from "@/components/explanations/attribution";
import { CounterfactualView } from "@/components/explanations/counterfactual";
import { CaseBasedView } from "@/components/explanations/case_based";
import { RuleBasedView } from "@/components/explanations/rule_based";
import {
  filterInternalEntries,
  filterInternalLimeKeys,
} from "@/lib/feature-filters";
import { updatePatientNotes } from "../actions";
import type { GlossaryEntry } from "../actions";

type Explanation = {
  id: string;
  modality: string;
  method: string;
  timeHorizon: string | null;
  content: unknown;
  metadata: unknown;
  error: string | null;
  errorType: string | null;
};

type Patient = {
  id: string;
  externalId: string;
  modelType: string;
  features: unknown;
  featuresRaw?: unknown;
  prediction: unknown;
  notes: string | null;
  explanations: Explanation[];
};

type Modality = "ATTRIBUTION" | "COUNTERFACTUAL" | "CASE_BASED" | "RULE_BASED";

const MODALITY_LABELS: Record<Modality, string> = {
  ATTRIBUTION: "Attribution",
  COUNTERFACTUAL: "Counterfactual",
  CASE_BASED: "Case-based",
  RULE_BASED: "Rule-based",
};

const HORIZON_OPTIONS_BY_MODEL: Record<
  string,
  { value: string; label: string }[]
> = {
  rsf: [
    { value: "__default__", label: "Cumulative hazard" },
    { value: "3_months", label: "3-month risk" },
    { value: "6_months", label: "6-month risk" },
    { value: "12_months", label: "12-month risk" },
  ],
  condor: [
    { value: "__default__", label: "Baseline QoL" },
    { value: "1_month", label: "1-month QoL" },
    { value: "3_months", label: "3-month QoL" },
    { value: "6_months", label: "6-month QoL" },
    { value: "9_months", label: "9-month QoL" },
    { value: "12_months", label: "12-month QoL" },
  ],
};

const SIGNED_ATTRIBUTION_METHODS = new Set([
  "lime",
  "integrated_gradients",
  "deep_lift",
]);

function getPredictionLabel(
  prediction: unknown,
  modelType: string,
  timeHorizon: string | null,
  horizonOptions: { value: string; label: string }[],
): string | null {
  if (!prediction || typeof prediction !== "object") return null;
  const pred = prediction as Record<string, unknown>;

  if (timeHorizon && timeHorizon !== "__default__") {
    const horizonLabel =
      horizonOptions.find((o) => o.value === timeHorizon)?.label ?? timeHorizon;

    if (modelType === "condor") {
      const qolVal = pred[`qol_${timeHorizon}`];
      if (typeof qolVal === "number") {
        return `${horizonLabel}: ${qolVal.toFixed(1)} / 100`;
      }
    } else {
      const mortVal = pred[`mortality_risk_${timeHorizon}`];
      const survVal = pred[`survival_prob_${timeHorizon}`];
      if (typeof mortVal === "number") {
        return `${horizonLabel}: ${(mortVal * 100).toFixed(1)}% mortality`;
      }
      if (typeof survVal === "number") {
        return `${horizonLabel}: ${(survVal * 100).toFixed(1)}% survival`;
      }
    }
  }

  // Baseline / no-horizon fallback
  if (modelType === "condor") {
    const baseline = pred["qol_baseline"] ?? pred["risk_score"];
    if (typeof baseline === "number") {
      return `Baseline QoL: ${baseline.toFixed(1)} / 100`;
    }
  }

  if ("risk_score" in pred) {
    const value = Number(pred.risk_score);
    if (isNaN(value)) return null;
    return `Risk score: ${value.toFixed(2)}`;
  }
  return null;
}

function groupByModality(
  explanations: Explanation[],
  timeHorizon: string | null,
) {
  const targetHorizon =
    timeHorizon === "__default__" || !timeHorizon ? "" : timeHorizon;

  const filtered = explanations.filter(
    (e) => (e.timeHorizon ?? "") === targetHorizon,
  );

  const grouped: Record<string, Explanation[]> = {};
  for (const exp of filtered) {
    if (!grouped[exp.modality]) grouped[exp.modality] = [];
    grouped[exp.modality].push(exp);
  }
  return grouped;
}

function getAvailableHorizons(explanations: Explanation[]): Set<string> {
  const horizons = new Set<string>();
  horizons.add("__default__");
  for (const exp of explanations) {
    if (exp.timeHorizon && exp.timeHorizon !== "") {
      horizons.add(exp.timeHorizon);
    }
  }
  return horizons;
}

function gatherHorizonContents(
  allExplanations: Explanation[],
  method: string,
): Record<string, Record<string, number>> | null {
  if (!SIGNED_ATTRIBUTION_METHODS.has(method)) return null;

  const result: Record<string, Record<string, number>> = {};
  for (const exp of allExplanations) {
    if (exp.modality !== "ATTRIBUTION") continue;
    if (exp.method !== method) continue;
    if (exp.error) continue;
    const horizonKey = exp.timeHorizon ?? "";
    if (
      exp.content &&
      typeof exp.content === "object" &&
      !Array.isArray(exp.content)
    ) {
      result[horizonKey] = filterInternalLimeKeys(
        exp.content as Record<string, number>,
      );
    }
  }

  return Object.keys(result).length > 1 ? result : null;
}

function ExplanationRenderer({
  modality,
  explanation,
  features,
  featuresRaw,
  glossary,
  modelType,
  prediction,
  allExplanations,
}: {
  modality: Modality;
  explanation: Explanation;
  features: Record<string, unknown>;
  featuresRaw?: Record<string, unknown> | null;
  glossary?: Record<string, GlossaryEntry>;
  modelType: string;
  prediction?: Record<string, unknown>;
  allExplanations: Explanation[];
}) {
  if (explanation.error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        <p className="font-medium">Error</p>
        <p className="mt-1">{explanation.error}</p>
      </div>
    );
  }

  const common = {
    glossary: glossary ?? {},
    locale: "en" as const,
  };
  const rawFeatures = featuresRaw ?? undefined;

  switch (modality) {
    case "ATTRIBUTION": {
      const horizonContents = gatherHorizonContents(
        allExplanations,
        explanation.method,
      );
      return (
        <AttributionView
          method={explanation.method}
          content={explanation.content as Record<string, number>}
          modelType={modelType as "rsf" | "condor"}
          prediction={prediction}
          timeHorizon={explanation.timeHorizon}
          featureValues={{ ...(features as Record<string, unknown>), ...(featuresRaw as Record<string, unknown>) } as any}
          showTopNSelector
          horizonContents={horizonContents ?? undefined}
          showHorizonChips={false}
          {...common}
        />
      );
    }
    case "COUNTERFACTUAL": {
      const horizonContents = gatherCounterfactualHorizonContents(
        allExplanations,
        explanation.method,
      );
      return (
        <CounterfactualView
          method={explanation.method}
          content={explanation.content as Record<string, number>}
          metadata={explanation.metadata as Record<string, unknown>}
          features={features}
          featuresRaw={rawFeatures}
          modelType={modelType as "rsf" | "condor"}
          prediction={prediction}
          timeHorizon={explanation.timeHorizon}
          horizonContents={horizonContents ?? undefined}
          {...common}
        />
      );
    }
    case "CASE_BASED":
      return (
        <CaseBasedView
          method={explanation.method}
          content={explanation.content}
          metadata={explanation.metadata as Record<string, unknown>}
          features={features}
          featuresRaw={rawFeatures}
          prediction={prediction}
          {...common}
        />
      );
    case "RULE_BASED":
      return (
        <RuleBasedView
          method={explanation.method}
          content={explanation.content as Record<string, unknown>}
          featuresRaw={rawFeatures}
          {...common}
        />
      );
    default:
      return <p className="text-sm text-muted-foreground">Unknown modality</p>;
  }
}

function ModalityPanel({
  modality,
  explanations,
  features,
  featuresRaw,
  glossary,
  modelType,
  prediction,
  allExplanations,
}: {
  modality: Modality;
  explanations: Explanation[];
  features: Record<string, unknown>;
  featuresRaw?: Record<string, unknown> | null;
  glossary?: Record<string, GlossaryEntry>;
  modelType: string;
  prediction?: Record<string, unknown>;
  allExplanations: Explanation[];
}) {
  const available = explanations.filter((e) => !e.error);
  const notApplicable = explanations.filter(
    (e) => e.error && e.errorType === "NotApplicable",
  );
  const errored = explanations.filter(
    (e) => e.error && e.errorType !== "NotApplicable",
  );

  const [selectedMethod, setSelectedMethod] = useState<string>(
    available[0]?.method ?? errored[0]?.method ?? "",
  );

  const current =
    [...available, ...errored].find((e) => e.method === selectedMethod) ??
    available[0] ??
    errored[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">{MODALITY_LABELS[modality]}</CardTitle>
        <div className="flex items-center gap-2">
          {errored.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {errored.length} errored
            </Badge>
          )}
          <Select
            value={current?.method ?? ""}
            onValueChange={setSelectedMethod}
          >
            <SelectTrigger className="w-[200px] h-8 text-sm">
              <SelectValue placeholder="Pick method" />
            </SelectTrigger>
            <SelectContent>
              {available.map((e) => (
                <SelectItem key={e.id} value={e.method}>
                  {e.method}
                </SelectItem>
              ))}

              {errored.length > 0 && (
                <div className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wide text-destructive/70 border-t border-border/40 mt-1">
                  Errored
                </div>
              )}
              {errored.map((e) => (
                <SelectItem key={e.id} value={e.method}>
                  <span className="text-destructive">{e.method} ✗</span>
                </SelectItem>
              ))}

              {notApplicable.length > 0 && (
                <div className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground/60 border-t border-border/40 mt-1">
                  Not available for this horizon
                </div>
              )}
              {notApplicable.map((e) => (
                <SelectItem
                  key={e.id}
                  value={e.method}
                  disabled
                  className="text-muted-foreground/50"
                >
                  {e.method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {current ? (
          <ExplanationRenderer
            modality={modality}
            explanation={current}
            features={features}
            featuresRaw={featuresRaw}
            glossary={glossary}
            modelType={modelType}
            prediction={prediction}
            allExplanations={allExplanations}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No methods available for this horizon
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function PatientDetail({
  patient,
  glossary,
}: {
  patient: Patient;
  glossary?: Record<string, GlossaryEntry>;
}) {
  const features = (patient.features ?? {}) as Record<string, unknown>;
  const [notes, setNotes] = useState(patient.notes ?? "");
  const [notesSaving, setNotesSaving] = useState(false);

  const horizonOptions = HORIZON_OPTIONS_BY_MODEL[patient.modelType] ?? [
    { value: "__default__", label: "Default" },
  ];

  const availableHorizons = getAvailableHorizons(patient.explanations);
  const hasHorizons = availableHorizons.size > 1;
  const [timeHorizon, setTimeHorizon] = useState<string>("__default__");

  const predLabel = getPredictionLabel(
    patient.prediction,
    patient.modelType,
    hasHorizons ? timeHorizon : null,
    horizonOptions,
  );
  const grouped = groupByModality(patient.explanations, timeHorizon);

  async function saveNotes() {
    setNotesSaving(true);
    try {
      await updatePatientNotes(patient.id, notes.trim() || null);
    } finally {
      setNotesSaving(false);
    }
  }

  const modalities: Modality[] = [
    "ATTRIBUTION",
    "COUNTERFACTUAL",
    "CASE_BASED",
    "RULE_BASED",
  ];

  const featuresRaw = (patient.featuresRaw ?? null) as Record<
    string,
    unknown
  > | null;

  const prediction = (patient.prediction ?? undefined) as
    | Record<string, unknown>
    | undefined;

  const visibleFeatureEntries = filterInternalEntries(Object.entries(features));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/patients"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              ← Patients
            </Link>
          </div>
          <h1 className="text-2xl font-medium tracking-tight mt-2">
            Patient {patient.externalId}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="outline">{patient.modelType.toUpperCase()}</Badge>
            {predLabel !== null && (
              <span className="text-sm text-muted-foreground">
                <span className="font-mono">{predLabel}</span>
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              {patient.explanations.length} explanations
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="explanations">
        <TabsList>
          <TabsTrigger value="explanations">Explanations</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="explanations" className="space-y-4 mt-4">
          {hasHorizons && (
            <div className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/30 px-4 py-2.5">
              <span className="text-xs text-muted-foreground font-medium shrink-0">
                Prediction target
              </span>
              <div className="flex rounded-md border border-border overflow-hidden">
                {horizonOptions
                  .filter((opt) => availableHorizons.has(opt.value))
                  .map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTimeHorizon(opt.value)}
                      className={`px-3 py-1 text-xs transition-colors ${
                        timeHorizon === opt.value
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
              </div>
              <span className="text-[10px] text-muted-foreground/70 hidden sm:inline">
                {timeHorizon === "__default__"
                  ? patient.modelType === "condor"
                    ? "Baseline quality-of-life score (t=0)"
                    : "Overall mortality risk (cumulative hazard)"
                  : `Explanations targeting ${
                      horizonOptions.find((o) => o.value === timeHorizon)
                        ?.label ?? timeHorizon
                    }`}
              </span>
            </div>
          )}

          {modalities.map((mod) => {
            const explanations = grouped[mod];
            if (!explanations || explanations.length === 0) return null;
            return (
              <ModalityPanel
                key={`${mod}-${timeHorizon}`}
                modality={mod}
                explanations={explanations}
                features={features}
                featuresRaw={featuresRaw}
                glossary={glossary}
                modelType={patient.modelType}
                prediction={prediction}
                allExplanations={patient.explanations}
              />
            );
          })}

          {Object.keys(grouped).length === 0 &&
            timeHorizon !== "__default__" && (
              <div className="rounded-md border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No explanations available for this time horizon yet.
                </p>
                <button
                  onClick={() => setTimeHorizon("__default__")}
                  className="text-xs text-primary underline mt-2"
                >
                  Switch to{" "}
                  {patient.modelType === "condor"
                    ? "baseline"
                    : "cumulative hazard"}
                </button>
              </div>
            )}
        </TabsContent>

        <TabsContent value="features" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
                {visibleFeatureEntries.map(([key, value]) => {
                  const entry = glossary?.[key];
                  return (
                    <div
                      key={key}
                      className="flex justify-between py-1 border-b border-border/50 group relative"
                      title={entry?.definition}
                    >
                      <span className="text-sm text-muted-foreground">
                        {entry?.label ?? key}
                        {entry && (
                          <span className="text-[10px] text-muted-foreground/50 ml-1">
                            ({key})
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-mono">
                        {typeof value === "number"
                          ? value.toFixed(1)
                          : String(value ?? "—")}
                      </span>
                    </div>
                  );
                })}
              </div>
              {visibleFeatureEntries.length < Object.keys(features).length && (
                <p className="text-[10px] text-muted-foreground/60 mt-4 italic">
                  {Object.keys(features).length - visibleFeatureEntries.length}{" "}
                  internal model features (one-hot encoded categoricals) hidden.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this patient (vignette candidacy, quality flags, etc.)..."
                rows={4}
              />
              <Button onClick={saveNotes} disabled={notesSaving} size="sm">
                {notesSaving ? "Saving..." : "Save notes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function gatherCounterfactualHorizonContents(
  allExplanations: Explanation[],
  method: string,
): Record<
  string,
  { content: Record<string, number>; metadata: Record<string, unknown> }
> | null {
  const result: Record<
    string,
    { content: Record<string, number>; metadata: Record<string, unknown> }
  > = {};

  for (const exp of allExplanations) {
    if (exp.modality !== "COUNTERFACTUAL") continue;
    if (exp.method !== method) continue;
    if (exp.error) continue;

    const horizonKey = exp.timeHorizon ?? "";

    if (
      exp.content &&
      typeof exp.content === "object" &&
      !Array.isArray(exp.content)
    ) {
      result[horizonKey] = {
        content: exp.content as Record<string, number>,
        metadata: (exp.metadata ?? {}) as Record<string, unknown>,
      };
    }
  }

  return Object.keys(result).length > 1 ? result : null;
}
