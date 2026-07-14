"use client";

import { useMemo, useState } from "react";
import {
  filterInternalCaseRecord,
  filterInternalFeatures,
} from "@/lib/feature-filters";
import { buildEntries } from "./build-entries";
import { ExactValuesTable } from "./exact-values-table";
import { HORIZON_CUMULATIVE, sortHorizons } from "./horizons";
import { valuesEqual } from "./labels";
import { PredictionHeadline } from "./prediction-headline";
import { extractPatientPrediction, resolveScale } from "./scale";
import { Sidebar } from "./sidebar";
import type {
  ChangedFeature,
  CounterfactualViewProps,
  EntryPair,
} from "./types";

type ViewTab = "changed" | "all";

const CF_T = {
  en: {
    manyChanges: (changes: number, implausible: number) =>
      implausible > 0
        ? `The model needed ${changes} change${changes !== 1 ? "s" : ""} to reach a different outcome (${implausible} of which ${implausible === 1 ? "is" : "are"} clinically implausible).`
        : `The model needed ${changes} change${changes !== 1 ? "s" : ""} to reach a different outcome.`,
    fewChanges: (changes: number) =>
      `The model needed only ${changes} plausible change${changes !== 1 ? "s" : ""} to reach a different outcome.`,
    noData: "No data for this patient",
    feature: "Feature",
    thisPatient: "This patient",
    altProfile: "Alternative profile",
    noFeatures: "No features to show.",
    implausible: "⚠ implausible",
    legendChange: "Suggested change",
    legendImplausible: "Clinically implausible change",
    changed: (n: number) => `Changed (${n})`,
    all: (n: number) => `All (${n})`,
    robustBanner: (changes: number, implausible: number) =>
      `${changes} change${changes !== 1 ? "s" : ""} needed${implausible > 0 ? ` (${implausible} clinically implausible)` : ""} to alter the prediction — the prediction appears robust.`,
    fragileBanner: (changes: number) =>
      `Only ${changes} plausible change${changes !== 1 ? "s" : ""} would alter the prediction — the model may be less certain here.`,
  },
  nl: {
    manyChanges: (changes: number, implausible: number) =>
      implausible > 0
        ? `Het model had ${changes} wijziging${changes !== 1 ? "en" : ""} nodig om tot een andere uitkomst te komen (${implausible} daarvan klinisch onwaarschijnlijk).`
        : `Het model had ${changes} wijziging${changes !== 1 ? "en" : ""} nodig om tot een andere uitkomst te komen.`,
    fewChanges: (changes: number) =>
      `Het model had slechts ${changes} plausibele wijziging${changes !== 1 ? "en" : ""} nodig om tot een andere uitkomst te komen.`,
    noData: "Geen gegevens voor deze patiënt",
    feature: "Kenmerk",
    thisPatient: "Deze patiënt",
    altProfile: "Alternatief profiel",
    noFeatures: "Geen kenmerken om te tonen.",
    implausible: "⚠ onwaarschijnlijk",
    legendChange: "Voorgestelde wijziging",
    legendImplausible: "Klinisch onwaarschijnlijke wijziging",
    changed: (n: number) => `Gewijzigd (${n})`,
    all: (n: number) => `Alle (${n})`,
    robustBanner: (changes: number, implausible: number) =>
      `${changes} wijziging${changes !== 1 ? "en" : ""} nodig${implausible > 0 ? ` (${implausible} klinisch onwaarschijnlijk)` : ""} om de voorspelling te veranderen — de voorspelling lijkt robuust.`,
    fragileBanner: (changes: number) =>
      `Slechts ${changes} plausibele wijziging${changes !== 1 ? "en" : ""} zou de voorspelling veranderen — het model is hier mogelijk minder zeker.`,
  },
} as const;

type CFTDict = (typeof CF_T)[keyof typeof CF_T];

export function CounterfactualView({
  content,
  metadata,
  features,
  featuresRaw,
  method,
  modelType = "rsf",
  prediction,
  timeHorizon,
  glossary,
  horizonContents,
  locale = "en",
}: CounterfactualViewProps) {
  const t = CF_T[locale as keyof typeof CF_T] ?? CF_T.en;
  const [viewTab, setViewTab] = useState<ViewTab>("changed");

  const availableHorizons = useMemo(
    () => (horizonContents ? sortHorizons(Object.keys(horizonContents)) : []),
    [horizonContents],
  );

  const initialHorizon = timeHorizon ?? HORIZON_CUMULATIVE;
  const [activeHorizon, setActiveHorizon] = useState<string>(initialHorizon);

  const effectiveHorizon =
    availableHorizons.length > 0 && !availableHorizons.includes(activeHorizon)
      ? availableHorizons[0]
      : activeHorizon;

  const horizonEntry = horizonContents?.[effectiveHorizon];
  const effectiveContent = horizonEntry?.content ?? content;
  const effectiveMetadata = horizonEntry?.metadata ?? metadata;

  const filteredContent = useMemo(
    () => filterInternalFeatures(effectiveContent),
    [effectiveContent],
  );
  const filteredFeatures = useMemo(
    () => filterInternalCaseRecord(features as Record<string, unknown>),
    [features],
  );
  const filteredFeaturesRaw = useMemo(
    () =>
      featuresRaw
        ? filterInternalCaseRecord(featuresRaw as Record<string, unknown>)
        : undefined,
    [featuresRaw],
  );

  const rawQueryRaw = effectiveMetadata?.raw_query as
    | Record<string, unknown>
    | undefined
    | null;
  const rawCfRaw = effectiveMetadata?.raw_cf as
    | Record<string, unknown>
    | undefined
    | null;
  const rawQuery = rawQueryRaw
    ? filterInternalCaseRecord(rawQueryRaw)
    : undefined;
  const rawCf = rawCfRaw ? filterInternalCaseRecord(rawCfRaw) : undefined;

  const cfDf = effectiveMetadata?.counterfactual_df as
    | Record<string, unknown>[]
    | undefined
    | null;
  const cfRow = cfDf?.[0]
    ? filterInternalCaseRecord(cfDf[0] as Record<string, unknown>)
    : undefined;

  const scale = resolveScale(modelType, effectiveHorizon);

  const originalPrediction: number | null =
    effectiveMetadata?.original_prediction != null
      ? Number(effectiveMetadata.original_prediction)
      : extractPatientPrediction(prediction, scale, effectiveHorizon);

  const cfPrediction: number | null =
    effectiveMetadata?.cf_prediction != null
      ? Number(effectiveMetadata.cf_prediction)
      : null;

  const { pairs, changed } = useMemo(
    () =>
      buildEntries({
        content: filteredContent,
        originalFeatures: filteredFeatures,
        originalFeaturesRaw: filteredFeaturesRaw,
        rawQuery,
        rawCf,
        cfRow,
        modelType,
        glossary,
        locale,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      filteredContent,
      filteredFeatures,
      filteredFeaturesRaw,
      effectiveMetadata,
      modelType,
      glossary,
      locale,
    ],
  );

  const changedMap = useMemo(() => {
    const m = new Map<string, ChangedFeature>();
    for (const c of changed) m.set(c.rawKey, c);
    return m;
  }, [changed]);

  const changedPairs = useMemo(
    () => pairs.filter((p) => changedMap.has(p.original.rawKey)),
    [pairs, changedMap],
  );

  const visiblePairs = viewTab === "changed" ? changedPairs : pairs;
  const implausibleCount = changed.filter((c) => c.implausible).length;

  if (Object.keys(filteredContent).length === 0 && !cfRow) {
    return <p className="text-sm text-muted-foreground">{t.noData}</p>;
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-4">
        <PredictionHeadline
          scale={scale}
          originalPrediction={originalPrediction}
          cfPrediction={cfPrediction}
          changeCount={changed.length}
          locale={locale}
        />

        <RobustnessBanner
          changeCount={changed.length}
          implausibleCount={implausibleCount}
          t={t}
        />

        <div className="flex items-center justify-end">
          <ViewToggle
            tab={viewTab}
            onChange={setViewTab}
            changedCount={changedPairs.length}
            allCount={pairs.length}
            locale={locale}
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-border/50 bg-card shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="sticky left-0 z-[1] bg-muted/40 text-left px-3 py-3 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold border-b border-border/60 min-w-[200px]">
                  {t.feature}
                </th>
                <th className="text-left px-3 py-3 border-b border-border/60 border-l border-border/30 min-w-[140px] bg-emerald-50/40 dark:bg-emerald-950/15">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {t.thisPatient}
                  </span>
                </th>
                <th className="text-left px-3 py-3 border-b border-border/60 border-l border-border/30 min-w-[160px] bg-sky-50/40 dark:bg-sky-950/15">
                  <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                    {t.altProfile}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visiblePairs.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center text-sm text-muted-foreground py-6"
                  >
                    {t.noFeatures}
                  </td>
                </tr>
              ) : (
                visiblePairs.map((pair, rowIdx) => {
                  const orig = pair.original;
                  const cf = pair.counterfactual;
                  const changedFeature = changedMap.get(orig.rawKey);
                  const isChanged = !!changedFeature;
                  const implausible = !!changedFeature?.implausible;
                  const implausibleReason = changedFeature?.implausibleReason;
                  const isEven = rowIdx % 2 === 0;
                  const rowBgClass = isEven ? "bg-background" : "bg-muted/10";

                  return (
                    <tr
                      key={orig.rawKey}
                      className={`${rowBgClass} hover:bg-muted/30 transition-colors group`}
                    >
                      <th
                        scope="row"
                        className={`sticky left-0 z-[1] text-left px-3 py-2 align-top text-[12px] text-foreground font-medium border-b border-border/30 ${rowBgClass} group-hover:bg-muted/30 transition-colors min-w-[200px] max-w-[260px]`}
                      >
                        <span className="block">{orig.label}</span>
                        {orig.definition && (
                          <span className="block text-[10px] text-muted-foreground mt-0.5 font-normal leading-snug">
                            {orig.definition}
                          </span>
                        )}
                      </th>

                      <td className="px-3 py-2 align-top text-[12px] text-foreground border-l border-border/30 border-b border-border/30 font-medium bg-emerald-50/30 dark:bg-emerald-950/10 font-mono">
                        {orig.displayValue}
                      </td>

                      <td
                        className={`px-3 py-2 align-top text-[12px] border-l border-border/30 border-b border-border/30 font-mono ${
                          isChanged
                            ? implausible
                              ? "bg-amber-50 dark:bg-amber-950/30"
                              : "bg-sky-50 dark:bg-sky-950/30"
                            : "bg-sky-50/30 dark:bg-sky-950/10"
                        }`}
                      >
                        <div className="flex items-start gap-1.5 flex-wrap">
                          <span
                            className={
                              isChanged
                                ? implausible
                                  ? "text-amber-900 font-medium dark:text-amber-200"
                                  : "text-sky-900 font-medium dark:text-sky-200"
                                : "text-muted-foreground"
                            }
                          >
                            {cf.displayValue}
                          </span>
                          {isChanged && implausible && (
                            <span className="inline-block text-[9px] uppercase tracking-wide px-1 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-sans">
                              {t.implausible}
                            </span>
                          )}
                        </div>
                        {isChanged && implausibleReason && (
                          <span className="block text-[10px] text-muted-foreground/80 mt-0.5 leading-snug font-normal font-sans">
                            {implausibleReason}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-muted-foreground flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center">
            <span className="inline-block w-3 h-3 rounded-sm bg-sky-50 border border-sky-200 dark:bg-sky-950/30 dark:border-sky-800/40 mr-1.5" />
            {t.legendChange}
          </span>
          <span className="inline-flex items-center">
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40 mr-1.5" />
            {t.legendImplausible}
          </span>
        </p>

        <ExactValuesTable changed={changed} locale={locale} />
      </div>

      <Sidebar
        method={method}
        modelType={modelType}
        changedCount={changed.length}
        implausibleCount={implausibleCount}
        horizons={availableHorizons}
        activeHorizon={effectiveHorizon}
        onSelectHorizon={setActiveHorizon}
        locale={locale}
      />
    </div>
  );
}

function RobustnessBanner({
  changeCount,
  implausibleCount,
  t,
}: {
  changeCount: number;
  implausibleCount: number;
  t: CFTDict;
}) {
  if (changeCount === 0) return null;

  const plausibleCount = changeCount - implausibleCount;
  const many = changeCount >= 3 || implausibleCount > 0;

  const text = many
    ? t.manyChanges(changeCount, implausibleCount)
    : t.fewChanges(plausibleCount);

  const border = many
    ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-800/40 dark:bg-emerald-950/20"
    : "border-amber-200 bg-amber-50/40 dark:border-amber-800/40 dark:bg-amber-950/20";
  const textColor = many
    ? "text-emerald-700 dark:text-emerald-400"
    : "text-amber-700 dark:text-amber-400";

  return (
    <div className={`rounded-lg border px-4 py-3 ${border}`}>
      <p className={`text-[11px] font-medium ${textColor}`}>{text}</p>
    </div>
  );
}

function ViewToggle({
  tab,
  onChange,
  changedCount,
  allCount,
  locale = "en",
}: {
  tab: ViewTab;
  onChange: (t: ViewTab) => void;
  changedCount: number;
  allCount: number;
  locale?: string;
}) {
  const t = CF_T[locale as keyof typeof CF_T] ?? CF_T.en;
  const options: { key: ViewTab; label: string }[] = [
    { key: "changed", label: t.changed(changedCount) },
    { key: "all", label: t.all(allCount) },
  ];
  return (
    <div
      role="radiogroup"
      aria-label={locale === "nl" ? "Kenmerkweergave" : "Feature view"}
      className="inline-flex rounded-md border border-border/60 overflow-hidden text-[10px]"
    >
      {options.map((opt) => {
        const active = tab === opt.key;
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
