"use client";

import { useMemo } from "react";
import { buildFeatureLabel } from "@/components/explanations/shared/labels";
import type { GlossaryEntry } from "@/app/admin/patients/actions";
import {
  compareValues,
  formatVal,
  resolveDisplayValue,
  splitColumns,
} from "./helpers";
import {
  buildPatientSummary,
  extractSurvivalHorizons,
} from "./patient-summary";
import { groupBySection } from "./sections";
import { SurvivalStrip } from "./survival-strip";
import type { CompareResult } from "./types";

type Props = {
  title: string;
  badge?: string;
  badgeColor?: string;
  features: Record<string, unknown>;
  rawFeatures?: Record<string, unknown>;
  comparisonFeatures?: Record<string, unknown>;
  similarity?: number | null;
  outcome?: string | null;
  clusterSize?: number | null;
  riskScore?: number | null;
  prediction?: Record<string, unknown>;
  glossary?: Record<string, GlossaryEntry>;
  showDiffStyling?: boolean;
  showOnlyDiffering?: boolean;
};

function valueClassFor(cmp: CompareResult): string {
  switch (cmp) {
    case "higher":
      return "text-blue-600 dark:text-blue-400 font-medium";
    case "lower":
      return "text-orange-600 dark:text-orange-400 font-medium";
    case "different":
      return "text-amber-600 dark:text-amber-400 font-medium";
    default:
      return "text-foreground";
  }
}

function rowBgFor(cmp: CompareResult): string {
  return cmp !== "same" && cmp !== "missing" ? "bg-muted/20" : "";
}

export function PatientProfilePanel({
  title,
  badge,
  badgeColor,
  features,
  rawFeatures,
  comparisonFeatures,
  similarity,
  outcome,
  clusterSize,
  riskScore,
  prediction,
  glossary,
  showDiffStyling,
  showOnlyDiffering,
}: Props) {
  const { featureCols } = splitColumns(features);
  const sections = useMemo(() => groupBySection(featureCols), [featureCols]);
  const summary = useMemo(
    () => buildPatientSummary(features, rawFeatures),
    [features, rawFeatures],
  );

  const horizons = useMemo(
    () =>
      extractSurvivalHorizons(prediction) ?? extractSurvivalHorizons(features),
    [prediction, features],
  );

  return (
    <div className="rounded-md border border-border/60 bg-card overflow-hidden flex flex-col w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/40 h-[50px]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{title}</span>
          {badge && (
            <span
              className={`text-[9px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded ${
                badgeColor ??
                "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
              }`}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {similarity !== undefined && similarity !== null && (
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block leading-none">
                Similarity
              </span>
              <span className="text-xs font-mono font-medium">
                {(similarity * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {summary && (
        <div className="px-3 py-2 border-b border-border/40">
          <p className="text-xs leading-relaxed">{summary}</p>
        </div>
      )}

      {horizons && <SurvivalStrip horizons={horizons} />}

      {(outcome || clusterSize != null || riskScore != null) && (
        <div className="px-3 py-2 bg-amber-50/50 dark:bg-amber-900/10 border-b border-border/40 flex items-center gap-4 flex-wrap">
          {outcome && (
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide block leading-none">
                Observed outcome
              </span>
              <span className="text-sm font-medium">{outcome}</span>
            </div>
          )}
          {clusterSize != null && (
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide block leading-none">
                Represents
              </span>
              <span className="text-sm font-medium">
                {clusterSize} {clusterSize === 1 ? "patient" : "patients"}
              </span>
            </div>
          )}
          {riskScore != null && (
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide block leading-none">
                Mean risk score
              </span>
              <span className="text-sm font-medium">
                {riskScore.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto max-h-[420px]">
        {sections.map(({ section, label, keys }) => {
          const visibleKeys =
            showOnlyDiffering && comparisonFeatures
              ? keys.filter(
                  (k) =>
                    compareValues(comparisonFeatures[k], features[k]) !==
                    "same",
                )
              : keys;

          if (visibleKeys.length === 0) return null;

          return (
            <div key={section}>
              <div className="px-3 py-1 bg-muted/20 border-b border-border/30 sticky top-0">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  {label}
                </span>
              </div>
              <div className="divide-y divide-border/30">
                {visibleKeys.map((col) => {
                  const labels = buildFeatureLabel(col, glossary, 28);
                  const compVal = comparisonFeatures?.[col];
                  const cmp: CompareResult =
                    showDiffStyling && comparisonFeatures
                      ? compareValues(compVal, features[col])
                      : "same";

                  const displayValue = resolveDisplayValue(
                    col,
                    features,
                    rawFeatures,
                  );

                  return (
                    <div
                      key={col}
                      className={`flex items-center justify-between gap-2 px-3 py-1.5 ${rowBgFor(cmp)}`}
                      title={labels.full}
                    >
                      <span className="text-xs text-muted-foreground truncate">
                        {labels.short}
                      </span>
                      <span
                        className={`text-xs font-mono shrink-0 ${valueClassFor(cmp)}`}
                      >
                        {formatVal(displayValue)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
