"use client";

import { useMemo, useState } from "react";
import type { GlossaryEntry } from "@/app/admin/patients/actions";
import {
  decodeEarlyMortality,
  decodeProgression,
  decodeRadiotherapy,
  decodeRecurrence,
  decodeSurgery,
  decodeSurvival,
  decodeSystemic,
  decodeTargeted,
  decodeTumorDirected,
  type Decoded,
  type Tone,
} from "./decoders";
import { getClusterSize, getRiskScore, getSimilarity } from "./helpers";
import { Sidebar } from "./sidebar";
import type { CaseRecord } from "./types";
import { decodeFeatureValue } from "@/lib/feature-value-encoder";

const SBS_T = {
  en: {
    caseLabel: "Similar patient",
    casePlural: "s",
    thisPatient: "This patient",
    feature: "Feature",
    noCases: "No similar cases retrieved",
    shared: "Shared characteristics",
    differing: "Differing characteristics",
    sharedOf: (s: number, t: number) =>
      `${s} of ${t} baseline features shared`,
    outcome: "Outcome",
    outcomeDesc: "What happened to similar patients",
    treatment: "Treatment received",
    treatmentDesc: "Therapies the similar patients underwent",
    baseline: "Clinical baseline",
    baselineDesc: "Pre-treatment features used to compute similarity",
    legendMatch: "Values matching the current patient.",
    legendDiffer: "Values differing from the current patient.",
    legendWithheld:
      'Outcomes and treatments for "This patient" are withheld — the model\'s prediction is what\'s being evaluated.',
    noBaseline: "No baseline features available.",
    noFilter: "No matching baseline features for this filter.",
    filterAll: "All",
    filterShared: "Shared",
    filterDiffering: "Differing",
    horizonLabel: (h: string) => {
      const map: Record<string, string> = {
        "1_month": "1 month",
        "3_months": "3 months",
        "6_months": "6 months",
        "9_months": "9 months",
        "12_months": "12 months",
      };
      return map[h] ?? h.replace(/_/g, " ");
    },
    predOutcome: (h: string) => `Predicted outcome (${h})`,
    predOutcomeDef:
      "Model-predicted outcome for each similar patient at the selected time horizon.",
    survivalLabel: "Survival status",
    survivalDef:
      "Whether the patient is alive at last follow-up or has died, and when.",
    recurrenceLabel: "Recurrence (RFS)",
    recurrenceDef:
      "Curative-intent patients only: did the cancer return after treatment?",
    progressionLabel: "Progression (PFS)",
    progressionDef:
      "Palliative-intent patients only: did the cancer progress further?",
    earlyMortLabel: "Early mortality",
    earlyMortDef:
      "Whether the patient died within 6 months of diagnosis.",
    tumourDirLabel: "Tumour-directed therapy",
    tumourDirDef:
      "Did the patient receive any anti-cancer treatment, or was treatment withheld?",
    surgeryLabel: "Surgery",
    surgeryDef:
      "Type, technique, margin status, and timing of pancreatic surgery.",
    rtLabel: "Radiotherapy",
    rtDef: "Whether radiation therapy was given, and when.",
    systLabel: "Systemic therapy",
    systDef:
      "Chemotherapy drug (first regimen), number of cycles, and timing.",
    targetLabel: "Targeted therapy",
    targetDef: "Targeted or immunotherapy agents.",
    outcomeBanner: (survived: number, died: number, total: number, horizon: string) =>
      `Of ${total} similar patient${total !== 1 ? "s" : ""}: ${survived} survived past ${horizon}, ${died} did not.`,
    modelPredicts: (pct: string, horizon: string) =>
      `Model predicts ${pct} survival at ${horizon}.`,
    modelPredictsQol: (score: string, horizon: string) =>
      `Model predicts ${score} quality of life at ${horizon}.`,
    outcomesConsistent: "Similar patients' outcomes align with the prediction.",
    outcomesBetter: "Similar patients fared better than the model predicts.",
    outcomesWorse: "Similar patients fared worse than the model predicts.",
    outcomesMixed: "Similar patients had mixed outcomes — prediction is less certain.",
    qolBanner: (avg: string, n: number, horizon: string) =>
      `${n} similar patient${n !== 1 ? "s" : ""} averaged ${avg} QoL at ${horizon}.`,
    qolClose: "Similar patients scored close to the model's prediction.",
    qolHigher: "Similar patients scored higher than the model predicts.",
    qolLower: "Similar patients scored lower than the model predicts.",
    strongMatch: "Strong match",
    moderateMatch: "Moderate match",
    weakMatch: "Weak match",
    baselineQol: "baseline QoL",
  },
  nl: {
    caseLabel: "Vergelijkbare patiënt",
    casePlural: "en",
    thisPatient: "Deze patiënt",
    feature: "Kenmerk",
    noCases: "Geen vergelijkbare patiënten gevonden",
    shared: "Gedeelde kenmerken",
    differing: "Afwijkende kenmerken",
    sharedOf: (s: number, t: number) =>
      `${s} van ${t} basiskenmerken gedeeld`,
    outcome: "Uitkomst",
    outcomeDesc: "Wat er gebeurde met vergelijkbare patiënten",
    treatment: "Ontvangen behandeling",
    treatmentDesc: "Therapieën die de vergelijkbare patiënten ondergingen",
    baseline: "Klinische baseline",
    baselineDesc: "Kenmerken vóór behandeling gebruikt voor vergelijking",
    legendMatch: "Waarden die overeenkomen met de huidige patiënt.",
    legendDiffer: "Waarden die afwijken van de huidige patiënt.",
    legendWithheld:
      'Uitkomsten en behandelingen voor "Deze patiënt" zijn niet getoond — de voorspelling van het model wordt geëvalueerd.',
    noBaseline: "Geen basiskenmerken beschikbaar.",
    noFilter: "Geen basiskenmerken voor dit filter.",
    filterAll: "Alle",
    filterShared: "Gedeeld",
    filterDiffering: "Afwijkend",
    horizonLabel: (h: string) => {
      const map: Record<string, string> = {
        "1_month": "1 maand",
        "3_months": "3 maanden",
        "6_months": "6 maanden",
        "9_months": "9 maanden",
        "12_months": "12 maanden",
      };
      return map[h] ?? h.replace(/_/g, " ");
    },
    predOutcome: (h: string) => `Voorspelde uitkomst (${h})`,
    predOutcomeDef:
      "Modelvoorspelling voor elke vergelijkbare patiënt op de geselecteerde horizon.",
    survivalLabel: "Overlevingsstatus",
    survivalDef:
      "Of de patiënt in leven is bij laatste follow-up of is overleden, en wanneer.",
    recurrenceLabel: "Recidief (RFS)",
    recurrenceDef:
      "Alleen curatieve patiënten: is de kanker teruggekomen na behandeling?",
    progressionLabel: "Progressie (PFS)",
    progressionDef:
      "Alleen palliatieve patiënten: is de kanker verder gevorderd?",
    earlyMortLabel: "Vroege mortaliteit",
    earlyMortDef:
      "Of de patiënt binnen 6 maanden na diagnose is overleden.",
    tumourDirLabel: "Tumorgerichte therapie",
    tumourDirDef:
      "Heeft de patiënt antikankerbehandeling ontvangen, of werd behandeling onthouden?",
    surgeryLabel: "Chirurgie",
    surgeryDef:
      "Type, techniek, marge-status en timing van pancreaschirurgie.",
    rtLabel: "Radiotherapie",
    rtDef: "Of bestraling is gegeven, en wanneer.",
    systLabel: "Systemische therapie",
    systDef: "Chemotherapie (eerste schema), aantal cycli en timing.",
    targetLabel: "Doelgerichte therapie",
    targetDef: "Doelgerichte of immuuntherapie-middelen.",
    outcomeBanner: (survived: number, died: number, total: number, horizon: string) =>
      `Van ${total} vergelijkbare patiënt${total !== 1 ? "en" : ""}: ${survived} overleefde${survived !== 1 ? "n" : ""} voorbij ${horizon}, ${died} niet.`,
    modelPredicts: (pct: string, horizon: string) =>
      `Model voorspelt ${pct} overleving op ${horizon}.`,
    modelPredictsQol: (score: string, horizon: string) =>
      `Model voorspelt ${score} kwaliteit van leven op ${horizon}.`,
    outcomesConsistent: "Uitkomsten van vergelijkbare patiënten komen overeen met de voorspelling.",
    outcomesBetter: "Vergelijkbare patiënten deden het beter dan het model voorspelt.",
    outcomesWorse: "Vergelijkbare patiënten deden het slechter dan het model voorspelt.",
    outcomesMixed: "Vergelijkbare patiënten hadden gemengde uitkomsten — voorspelling is minder zeker.",
    qolBanner: (avg: string, n: number, horizon: string) =>
      `${n} vergelijkbare patiënt${n !== 1 ? "en" : ""} hadden gemiddeld ${avg} KvL op ${horizon}.`,
    qolClose: "Vergelijkbare patiënten scoorden dicht bij de voorspelling van het model.",
    qolHigher: "Vergelijkbare patiënten scoorden hoger dan het model voorspelt.",
    qolLower: "Vergelijkbare patiënten scoorden lager dan het model voorspelt.",
    strongMatch: "Sterk",
    moderateMatch: "Matig",
    weakMatch: "Zwak",
    baselineQol: "baseline KvL",
  },
} as const;

type TDict = (typeof SBS_T)[keyof typeof SBS_T];

const OUTCOME_FIELD_KEYS = new Set<string>([
  "vit_stat", "vit_stat_int", "rfs_event", "rfs_int", "pfs_event", "pfs_int",
  "dead_with_6months", "fup_event_type", "fup_event_int",
  "qol_summary_event", "qol_summary_time", "qol_physical_event", "qol_physical_time",
  "qol_emotional_event", "qol_emotional_time", "qol_social_event", "qol_social_time",
  "qol_cognitive_event", "qol_cognitive_time", "qol_role_event", "qol_role_time",
]);

const TREATMENT_FIELD_KEYS = new Set<string>([
  "tumgericht_ther", "geen_ther_reden", "geen_ther_type",
  "chir", "chir_type1", "chir_tech1", "chir_rad1", "chir_int1",
  "rt", "rt_type1", "rt_start_int1",
  "chemo", "target", "syst_code1", "syst_schemanum1", "syst_start_int1", "syst_kuren1",
]);

const RESERVED_FIELD_KEYS = new Set<string>([
  ...OUTCOME_FIELD_KEYS,
  ...TREATMENT_FIELD_KEYS,
]);

type FilterMode = "all" | "shared" | "differing";

type Props = {
  cases: CaseRecord[];
  queryFeatures: Record<string, unknown>;
  queryRawFeatures?: Record<string, unknown>;
  queryPrediction?: Record<string, unknown>;
  method: string;
  glossary?: Record<string, GlossaryEntry>;
  isPrototype?: boolean;
  timeHorizon?: string;
  locale?: string;
};

function detectIsRsf(prediction?: Record<string, unknown>): boolean {
  if (!prediction) return true;
  return Object.keys(prediction).some(
    (k) => k.startsWith("survival_prob_") || k.startsWith("mortality_risk_"),
  );
}

export function SideBySideView({
  cases,
  queryFeatures,
  queryRawFeatures,
  queryPrediction,
  method,
  glossary,
  isPrototype = false,
  timeHorizon,
  locale = "en",
}: Props) {
  const t = SBS_T[locale as keyof typeof SBS_T] ?? SBS_T.en;
  const isRsf = detectIsRsf(queryPrediction);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const querySource = queryRawFeatures ?? queryFeatures;

  const baselineKeys = useMemo(
    () =>
      Object.keys(querySource).filter(
        (k) =>
          !k.startsWith("_") &&
          querySource[k] != null &&
          !RESERVED_FIELD_KEYS.has(k) &&
          cases.some((c) => c[k] != null),
      ),
    [querySource, cases],
  );

  const differingKeys = useMemo(() => {
    const set = new Set<string>();
    for (const key of baselineKeys) {
      const qv = querySource[key];
      for (const c of cases) {
        if (!valuesEqual(qv, c[key])) {
          set.add(key);
          break;
        }
      }
    }
    return set;
  }, [baselineKeys, querySource, cases]);

  const sharedKeys = useMemo(
    () => baselineKeys.filter((k) => !differingKeys.has(k)),
    [baselineKeys, differingKeys],
  );

  const matchCounts = useMemo(
    () =>
      cases.map((c) => {
        let matches = 0;
        for (const key of baselineKeys) {
          if (valuesEqual(querySource[key], c[key])) matches++;
        }
        return matches;
      }),
    [cases, baselineKeys, querySource],
  );

  const trajectoryRow: ComposedRow | null = useMemo(() => {
    if (!timeHorizon) return null;
    const caseValues = cases.map((c) => {
      const traj = c._trajectory as Record<string, number> | undefined;
      const val = traj?.[timeHorizon];
      if (val == null) return { text: "—" } as Decoded;
      return {
        text: isRsf ? `${val.toFixed(1)}%` : `${val.toFixed(1)} / 100`,
        tone: "neutral" as Tone,
      } as Decoded;
    });
    if (caseValues.every((d) => d.text === "—")) return null;
    const horizonLabel = t.horizonLabel(timeHorizon);
    return {
      label: t.predOutcome(horizonLabel),
      definition: t.predOutcomeDef,
      cases: caseValues,
    };
  }, [timeHorizon, cases, t, isRsf]);

  if (!cases || cases.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t.noCases}</p>
    );
  }

  const visibleGroups: { heading: string | null; keys: string[] }[] =
    filterMode === "shared"
      ? [{ heading: null, keys: sharedKeys }]
      : filterMode === "differing"
        ? [{ heading: null, keys: baselineKeys.filter((k) => differingKeys.has(k)) }]
        : [
            ...(sharedKeys.length > 0
              ? [{ heading: t.shared, keys: sharedKeys }]
              : []),
            ...(differingKeys.size > 0
              ? [{
                  heading: t.differing,
                  keys: baselineKeys.filter((k) => differingKeys.has(k)),
                }]
              : []),
          ];

  const totalVisible = visibleGroups.reduce((n, g) => n + g.keys.length, 0);

  const outcomeRows: ComposedRow[] = [
    ...(trajectoryRow ? [trajectoryRow] : []),
    { label: t.survivalLabel, definition: t.survivalDef, cases: cases.map((c) => decodeSurvival(c, locale)) },
    { label: t.recurrenceLabel, definition: t.recurrenceDef, cases: cases.map((c) => decodeRecurrence(c, locale)) },
    { label: t.progressionLabel, definition: t.progressionDef, cases: cases.map((c) => decodeProgression(c, locale)) },
    { label: t.earlyMortLabel, definition: t.earlyMortDef, cases: cases.map((c) => decodeEarlyMortality(c, locale)) },
  ];

  const treatmentRows: ComposedRow[] = [
    { label: t.tumourDirLabel, definition: t.tumourDirDef, cases: cases.map((c) => decodeTumorDirected(c, locale)) },
    { label: t.surgeryLabel, definition: t.surgeryDef, cases: cases.map((c) => decodeSurgery(c, locale)) },
    { label: t.rtLabel, definition: t.rtDef, cases: cases.map((c) => decodeRadiotherapy(c, locale)) },
    { label: t.systLabel, definition: t.systDef, cases: cases.map((c) => decodeSystemic(c, locale)) },
    { label: t.targetLabel, definition: t.targetDef, cases: cases.map((c) => decodeTargeted(c, locale)) },
  ];

  const visibleOutcomeRows = outcomeRows.filter(rowHasAnyData);
  const visibleTreatmentRows = treatmentRows.filter(rowHasAnyData);
  const colSpan = cases.length + 2;

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {cases.length} {t.caseLabel}
            {cases.length !== 1 ? t.casePlural : ""}
            <span className="ml-1.5 normal-case">
              · {t.sharedOf(sharedKeys.length, baselineKeys.length)}
            </span>
          </p>
          <FilterToggle value={filterMode} onChange={setFilterMode} locale={locale} />
        </div>

        <OutcomeAgreementBanner
          cases={cases}
          queryPrediction={queryPrediction}
          timeHorizon={timeHorizon}
          isRsf={isRsf}
          t={t}
        />

        <div className="overflow-x-auto rounded-lg border border-border/50 bg-card shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="sticky left-0 z-[1] bg-muted/40 text-left px-3 py-3 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold border-b border-border/60 min-w-[200px]">
                  {t.feature}
                </th>
                <th className="text-left px-3 py-3 border-b border-border/60 border-l border-border/30 min-w-[120px] bg-emerald-50/40 dark:bg-emerald-950/15">
                  <ColumnHeader label={t.thisPatient} accent />
                </th>
                {cases.map((c, i) => (
                  <th
                    key={i}
                    className="text-left px-3 py-3 border-b border-border/60 border-l border-border/30 min-w-[160px]"
                  >
                    <ColumnHeader label={`${t.caseLabel} ${i + 1}`} />
                  </th>
                ))}
              </tr>
            </thead>

            {visibleOutcomeRows.length > 0 && (
              <ComposedSection
                title={t.outcome}
                subtitle={t.outcomeDesc}
                colSpan={colSpan}
                rows={visibleOutcomeRows}
              />
            )}

            {visibleTreatmentRows.length > 0 && (
              <ComposedSection
                title={t.treatment}
                subtitle={t.treatmentDesc}
                colSpan={colSpan}
                rows={visibleTreatmentRows}
              />
            )}

            <GroupedBaselineSection
              colSpan={colSpan}
              groups={visibleGroups}
              totalVisible={totalVisible}
              hasAnyBaseline={baselineKeys.length > 0}
              querySource={querySource}
              cases={cases}
              glossary={glossary}
              differingKeys={differingKeys}
              locale={locale}
              t={t}
            />
          </table>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          <span>
            <span className="inline-block w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40 mr-1.5 align-middle" />
            {t.legendMatch}
          </span>
          <span>
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40 mr-1.5 align-middle" />
            {t.legendDiffer}
          </span>
          <span>{t.legendWithheld}</span>
        </div>
      </div>
      <Sidebar method={method} isPrototype={isPrototype} locale={locale} />
    </div>
  );
}

function horizonToDays(horizon: string): number | null {
  const map: Record<string, number> = {
    "1_month": 30,
    "3_months": 91,
    "6_months": 182,
    "9_months": 274,
    "12_months": 365,
  };
  return map[horizon] ?? null;
}

function OutcomeAgreementBanner({
  cases,
  queryPrediction,
  timeHorizon,
  isRsf,
  t,
}: {
  cases: CaseRecord[];
  queryPrediction?: Record<string, unknown>;
  timeHorizon?: string;
  isRsf: boolean;
  t: TDict;
}) {
  const p = queryPrediction;
  if (!p || cases.length === 0) return null;

  if (!isRsf) {
    const horizon = timeHorizon ?? "12_months";
    const hLabel = t.horizonLabel(horizon);
    const qolPred = p[`qol_${horizon}`];
    if (typeof qolPred !== "number") return null;

    const trajValues: number[] = [];
    for (const c of cases) {
      const traj = c._trajectory as Record<string, number> | undefined;
      const val = traj?.[horizon];
      if (typeof val === "number") trajValues.push(val);
    }
    if (trajValues.length === 0) return null;

    const avg = trajValues.reduce((s, v) => s + v, 0) / trajValues.length;
    const diff = avg - qolPred;
    let signal: { text: string; tone: "good" | "warn" | "bad" };
    if (Math.abs(diff) < 10) {
      signal = { text: t.qolClose, tone: "good" };
    } else if (diff > 0) {
      signal = { text: t.qolHigher, tone: "warn" };
    } else {
      signal = { text: t.qolLower, tone: "bad" };
    }

    const predictionLine = t.modelPredictsQol(`${qolPred.toFixed(1)} / 100`, hLabel);

    const toneBorder =
      signal.tone === "good"
        ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-800/40 dark:bg-emerald-950/20"
        : signal.tone === "warn"
          ? "border-amber-200 bg-amber-50/40 dark:border-amber-800/40 dark:bg-amber-950/20"
          : "border-rose-200 bg-rose-50/40 dark:border-rose-800/40 dark:bg-rose-950/20";

    return (
      <div className={`rounded-lg border px-4 py-3 space-y-1 ${toneBorder}`}>
        <p className="text-xs text-foreground leading-relaxed">
          <span className="font-medium">
            {t.qolBanner(`${avg.toFixed(1)} / 100`, trajValues.length, hLabel)}
          </span>
          {" "}{predictionLine}
        </p>
        <p
          className={`text-[11px] font-medium ${
            signal.tone === "good"
              ? "text-emerald-700 dark:text-emerald-400"
              : signal.tone === "warn"
                ? "text-amber-700 dark:text-amber-400"
                : "text-rose-700 dark:text-rose-400"
          }`}
        >
          {signal.text}
        </p>
      </div>
    );
  }

  const horizon = timeHorizon ?? "12_months";
  const horizonDays = horizonToDays(horizon);
  if (!horizonDays) return null;

  const hLabel = t.horizonLabel(horizon);

  let survivedPast = 0;
  let diedBefore = 0;
  let usable = 0;

  for (const c of cases) {
    const days = c.vit_stat_int;
    const status = c.vit_stat;
    if (typeof days !== "number" || status == null) continue;
    usable++;
    if (status === 0 || days > horizonDays) {
      survivedPast++;
    } else {
      diedBefore++;
    }
  }

  if (usable === 0) return null;

  const caseRate = survivedPast / usable;

  let modelSurvival: number | null = null;
  let predictionLine: string | null = null;
  const survProb = p[`survival_prob_${horizon}`];
  const mortRisk = p[`mortality_risk_${horizon}`];
  if (typeof survProb === "number") {
    modelSurvival = survProb;
    predictionLine = t.modelPredicts(
      `${(survProb * 100).toFixed(0)}%`,
      hLabel,
    );
  } else if (typeof mortRisk === "number") {
    modelSurvival = 1 - mortRisk;
    predictionLine = t.modelPredicts(
      `${((1 - mortRisk) * 100).toFixed(0)}%`,
      hLabel,
    );
  }

  let agreementSignal: {
    text: string;
    tone: "good" | "warn" | "bad";
  } | null = null;

  if (modelSurvival !== null && usable >= 2) {
    const diff = caseRate - modelSurvival;
    if (Math.abs(diff) < 0.3) {
      agreementSignal = { text: t.outcomesConsistent, tone: "good" };
    } else if (caseRate > 0.2 && caseRate < 0.8) {
      agreementSignal = { text: t.outcomesMixed, tone: "warn" };
    } else if (diff > 0) {
      agreementSignal = { text: t.outcomesBetter, tone: "warn" };
    } else {
      agreementSignal = { text: t.outcomesWorse, tone: "bad" };
    }
  }

  const toneBorder =
    agreementSignal?.tone === "good"
      ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-800/40 dark:bg-emerald-950/20"
      : agreementSignal?.tone === "warn"
        ? "border-amber-200 bg-amber-50/40 dark:border-amber-800/40 dark:bg-amber-950/20"
        : agreementSignal?.tone === "bad"
          ? "border-rose-200 bg-rose-50/40 dark:border-rose-800/40 dark:bg-rose-950/20"
          : "border-border/50 bg-muted/20";

  return (
    <div className={`rounded-lg border px-4 py-3 space-y-1 ${toneBorder}`}>
      <p className="text-xs text-foreground leading-relaxed">
        <span className="font-medium">
          {t.outcomeBanner(survivedPast, diedBefore, usable, hLabel)}
        </span>
        {predictionLine && <span className="ml-1">{predictionLine}</span>}
      </p>
      {agreementSignal && (
        <p
          className={`text-[11px] font-medium ${
            agreementSignal.tone === "good"
              ? "text-emerald-700 dark:text-emerald-400"
              : agreementSignal.tone === "warn"
                ? "text-amber-700 dark:text-amber-400"
                : "text-rose-700 dark:text-rose-400"
          }`}
        >
          {agreementSignal.text}
        </p>
      )}
    </div>
  );
}

function FilterToggle({
  value,
  onChange,
  locale = "en",
}: {
  value: FilterMode;
  onChange: (v: FilterMode) => void;
  locale?: string;
}) {
  const t = SBS_T[locale as keyof typeof SBS_T] ?? SBS_T.en;
  const options: { key: FilterMode; label: string }[] = [
    { key: "all", label: t.filterAll },
    { key: "shared", label: t.filterShared },
    { key: "differing", label: t.filterDiffering },
  ];
  return (
    <div
      role="radiogroup"
      aria-label={locale === "nl" ? "Kenmerkfilter" : "Feature filter"}
      className="inline-flex rounded-md border border-border/60 overflow-hidden text-[10px]"
    >
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.key)}
            className={`px-2.5 py-1 border-l first:border-l-0 border-border/40 transition-colors cursor-pointer font-medium ${
              active
                ? "bg-foreground text-background"
                : "bg-transparent text-muted-foreground hover:bg-muted/40"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

type ComposedRow = {
  label: string;
  definition: string;
  cases: Decoded[];
};

function rowHasAnyData(row: ComposedRow): boolean {
  return row.cases.some((d) => d.text !== "—");
}

function ComposedSection({
  title,
  subtitle,
  colSpan,
  rows,
}: {
  title: string;
  subtitle: string;
  colSpan: number;
  rows: ComposedRow[];
}) {
  return (
    <tbody>
      <tr>
        <td
          colSpan={colSpan}
          className="sticky left-0 z-[1] px-3 py-2 bg-slate-100/60 dark:bg-slate-900/40 text-[10px] uppercase tracking-wider font-semibold text-foreground border-b border-border/60 border-t border-border/60"
        >
          {title}
          <span className="ml-2 text-muted-foreground font-normal normal-case text-[10px]">
            {subtitle}
          </span>
        </td>
      </tr>
      {rows.map((row, idx) => {
        const isEven = idx % 2 === 0;
        const rowBgClass = isEven ? "bg-background" : "bg-muted/10";
        return (
          <tr
            key={row.label}
            className={`${rowBgClass} hover:bg-muted/30 transition-colors group`}
          >
            <th
              scope="row"
              className={`sticky left-0 z-[1] text-left px-3 py-2 align-top text-[12px] text-foreground font-medium border-b border-border/30 ${rowBgClass} group-hover:bg-muted/30 transition-colors min-w-[200px] max-w-[260px]`}
            >
              <span className="block">{row.label}</span>
              <span className="block text-[10px] text-muted-foreground mt-0.5 font-normal leading-snug">
                {row.definition}
              </span>
            </th>
            <td className="px-3 py-2 align-top text-[12px] text-muted-foreground border-l border-border/30 border-b border-border/30 italic bg-emerald-50/30 dark:bg-emerald-950/10">
              —
            </td>
            {row.cases.map((d, i) => (
              <td
                key={i}
                className={`px-3 py-2 align-top text-[12px] border-l border-border/30 border-b border-border/30 ${toneCellClass(d.tone)}`}
              >
                <DecodedCell decoded={d} />
              </td>
            ))}
          </tr>
        );
      })}
    </tbody>
  );
}

function DecodedCell({ decoded }: { decoded: Decoded }) {
  if (decoded.text === "—") {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-col">
      <span className="font-medium leading-tight">{decoded.text}</span>
      {decoded.detail && (
        <span className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
          {decoded.detail}
        </span>
      )}
    </div>
  );
}

function toneCellClass(tone?: Tone): string {
  switch (tone) {
    case "bad":
      return "bg-rose-50 dark:bg-rose-950/25";
    case "warn":
      return "bg-amber-50 dark:bg-amber-950/25";
    case "good":
      return "bg-emerald-50/60 dark:bg-emerald-950/20";
    case "muted":
      return "text-muted-foreground";
    case "neutral":
    default:
      return "";
  }
}

function GroupedBaselineSection({
  colSpan,
  groups,
  totalVisible,
  hasAnyBaseline,
  querySource,
  cases,
  glossary,
  differingKeys,
  locale = "en",
  t,
}: {
  colSpan: number;
  groups: { heading: string | null; keys: string[] }[];
  totalVisible: number;
  hasAnyBaseline: boolean;
  querySource: Record<string, unknown>;
  cases: CaseRecord[];
  glossary?: Record<string, GlossaryEntry>;
  differingKeys: Set<string>;
  locale?: string;
  t: TDict;
}) {
  let runningRowIdx = 0;
  return (
    <tbody>
      <tr>
        <td
          colSpan={colSpan}
          className="sticky left-0 z-[1] px-3 py-2 bg-slate-100/60 dark:bg-slate-900/40 text-[10px] uppercase tracking-wider font-semibold text-foreground border-b border-border/60 border-t border-border/60"
        >
          {t.baseline}
          <span className="ml-2 text-muted-foreground font-normal normal-case text-[10px]">
            {t.baselineDesc}
          </span>
        </td>
      </tr>

      {groups.map((group, gIdx) => {
        const rows = group.keys.map((key) => {
          const idx = runningRowIdx++;
          return { key, globalIdx: idx };
        });
        return (
          <GroupRows
            key={gIdx}
            heading={group.heading}
            rows={rows}
            colSpan={colSpan}
            querySource={querySource}
            cases={cases}
            glossary={glossary}
            differingKeys={differingKeys}
            locale={locale}
          />
        );
      })}

      {totalVisible === 0 && (
        <tr>
          <td
            colSpan={colSpan}
            className="text-center text-sm text-muted-foreground py-6"
          >
            {hasAnyBaseline ? t.noFilter : t.noBaseline}
          </td>
        </tr>
      )}
    </tbody>
  );
}

function GroupRows({
  heading,
  rows,
  colSpan,
  querySource,
  cases,
  glossary,
  differingKeys,
  locale = "en",
}: {
  heading: string | null;
  rows: { key: string; globalIdx: number }[];
  colSpan: number;
  querySource: Record<string, unknown>;
  cases: CaseRecord[];
  glossary?: Record<string, GlossaryEntry>;
  differingKeys: Set<string>;
  locale?: string;
}) {
  if (rows.length === 0) return null;
  return (
    <>
      {heading && (
        <tr>
          <td
            colSpan={colSpan}
            className="sticky left-0 z-[1] px-3 py-1.5 bg-muted/20 text-[10px] uppercase tracking-wider font-medium text-muted-foreground border-b border-border/40"
          >
            {heading}
            <span className="ml-1.5 font-normal">({rows.length})</span>
          </td>
        </tr>
      )}
      {rows.map(({ key, globalIdx }) => {
        const qv = querySource[key];
        const friendly = glossary?.[key]?.label ?? key;
        const definition = glossary?.[key]?.definition;
        const isEven = globalIdx % 2 === 0;
        const rowBgClass = isEven ? "bg-background" : "bg-muted/10";
        return (
          <tr
            key={key}
            className={`${rowBgClass} hover:bg-muted/30 transition-colors group`}
          >
            <th
              scope="row"
              className={`sticky left-0 z-[1] text-left px-3 py-2 align-top text-[12px] text-foreground font-medium border-b border-border/30 ${rowBgClass} group-hover:bg-muted/30 transition-colors min-w-[200px] max-w-[260px]`}
            >
              <span className="block">{friendly}</span>
              {definition && (
                <span className="block text-[10px] text-muted-foreground mt-0.5 font-normal leading-snug">
                  {definition}
                </span>
              )}
            </th>
            <td className="px-3 py-2 align-top text-[12px] text-foreground border-l border-border/30 border-b border-border/30 font-medium bg-emerald-50/30 dark:bg-emerald-950/10">
              {decodeFeatureValue(key, qv, locale)}
            </td>
            {cases.map((c, i) => {
              const v = c[key];
              const differs = !valuesEqual(qv, v);
              return (
                <td
                  key={i}
                  className={`px-3 py-2 align-top text-[12px] border-l border-border/30 border-b border-border/30 ${
                    differs
                      ? "bg-amber-50 text-amber-900 font-medium dark:bg-amber-950/30 dark:text-amber-200"
                      : "bg-emerald-50/40 text-emerald-900 dark:bg-emerald-950/15 dark:text-emerald-200"
                  }`}
                >
                  {decodeFeatureValue(key, v, locale)}
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
}

function ColumnHeader({
  label,
  accent,
}: {
  label: string;
  accent?: boolean;
}) {
  return (
    <span
      className={`text-xs font-semibold ${
        accent
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-foreground"
      }`}
    >
      {label}
    </span>
  );
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a === "number" && typeof b === "number") {
    return Math.abs(a - b) < 1e-9;
  }
  return String(a) === String(b);
}