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

const CASE_LABEL = "Similar patient";

const OUTCOME_FIELD_KEYS = new Set<string>([
  "vit_stat",
  "vit_stat_int",
  "rfs_event",
  "rfs_int",
  "pfs_event",
  "pfs_int",
  "dead_with_6months",
  "fup_event_type",
  "fup_event_int",
  "qol_summary_event",
  "qol_summary_time",
  "qol_physical_event",
  "qol_physical_time",
  "qol_emotional_event",
  "qol_emotional_time",
  "qol_social_event",
  "qol_social_time",
  "qol_cognitive_event",
  "qol_cognitive_time",
  "qol_role_event",
  "qol_role_time",
]);

const TREATMENT_FIELD_KEYS = new Set<string>([
  "tumgericht_ther",
  "geen_ther_reden",
  "geen_ther_type",
  "chir",
  "chir_type1",
  "chir_tech1",
  "chir_rad1",
  "chir_int1",
  "rt",
  "rt_type1",
  "rt_start_int1",
  "chemo",
  "target",
  "syst_code1",
  "syst_schemanum1",
  "syst_start_int1",
  "syst_kuren1",
]);

const RESERVED_FIELD_KEYS = new Set<string>([
  ...OUTCOME_FIELD_KEYS,
  ...TREATMENT_FIELD_KEYS,
]);

type Props = {
  cases: CaseRecord[];
  queryFeatures: Record<string, unknown>;
  queryRawFeatures?: Record<string, unknown>;
  queryPrediction?: Record<string, unknown>;
  method: string;
  glossary?: Record<string, GlossaryEntry>;
  isPrototype?: boolean;
};

export function SideBySideView({
  cases,
  queryFeatures,
  queryRawFeatures,
  method,
  glossary,
  isPrototype = false,
}: Props) {
  const [showOnlyDiffering, setShowOnlyDiffering] = useState(false);
  const querySource = queryRawFeatures ?? queryFeatures;
  const baselineKeys = useMemo(
  () =>
    Object.keys(querySource).filter(
      (k) =>
        !k.startsWith("_") &&
        querySource[k] != null &&
        !RESERVED_FIELD_KEYS.has(k) &&
        cases.some((c) => c[k] != null),  // NEW
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

  if (!cases || cases.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No similar cases retrieved
      </p>
    );
  }

  const visibleBaselineKeys = showOnlyDiffering
    ? baselineKeys.filter((k) => differingKeys.has(k))
    : baselineKeys;

  const outcomeRows: ComposedRow[] = [
    {
      label: "Survival status",
      definition:
        "Whether the patient is alive at last follow-up or has died, and when.",
      cases: cases.map((c) => decodeSurvival(c)),
    },
    {
      label: "Recurrence (RFS)",
      definition:
        "Curative-intent patients only: did the cancer return after treatment?",
      cases: cases.map((c) => decodeRecurrence(c)),
    },
    {
      label: "Progression (PFS)",
      definition:
        "Palliative-intent patients only: did the cancer progress further?",
      cases: cases.map((c) => decodeProgression(c)),
    },
    {
      label: "Early mortality",
      definition: "Whether the patient died within 6 months of diagnosis.",
      cases: cases.map((c) => decodeEarlyMortality(c)),
    },
  ];

  const treatmentRows: ComposedRow[] = [
    {
      label: "Tumour-directed therapy",
      definition:
        "Did the patient receive any anti-cancer treatment, or was treatment withheld?",
      cases: cases.map((c) => decodeTumorDirected(c)),
    },
    {
      label: "Surgery",
      definition:
        "Type, technique, margin status, and timing of pancreatic surgery.",
      cases: cases.map((c) => decodeSurgery(c)),
    },
    {
      label: "Radiotherapy",
      definition: "Whether radiation therapy was given, and when.",
      cases: cases.map((c) => decodeRadiotherapy(c)),
    },
    {
      label: "Systemic therapy",
      definition:
        "Chemotherapy drug (first regimen), number of cycles, and timing.",
      cases: cases.map((c) => decodeSystemic(c)),
    },
    {
      label: "Targeted therapy",
      definition: "Targeted or immunotherapy agents.",
      cases: cases.map((c) => decodeTargeted(c)),
    },
  ];

  const visibleOutcomeRows = outcomeRows.filter(rowHasAnyData);
  const visibleTreatmentRows = treatmentRows.filter(rowHasAnyData);

  const colSpan = cases.length + 2;

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {cases.length} {CASE_LABEL}
            {cases.length !== 1 ? "s" : ""}
          </p>
          <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyDiffering}
              onChange={(e) => setShowOnlyDiffering(e.target.checked)}
              className="h-3 w-3 cursor-pointer"
            />
            Only show differing baseline features
          </label>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border/50 bg-card shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="sticky left-0 z-[1] bg-muted/40 text-left px-3 py-3 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold border-b border-border/60 min-w-[200px]">
                  Feature
                </th>
                <th className="text-left px-3 py-3 border-b border-border/60 border-l border-border/30 min-w-[120px] bg-emerald-50/40 dark:bg-emerald-950/15">
                  <ColumnHeader label="This patient" accent />
                </th>
                {cases.map((c, i) => (
                  <th
                    key={i}
                    className="text-left px-3 py-3 border-b border-border/60 border-l border-border/30 min-w-[160px]"
                  >
                    <ColumnHeader
                      label={`${CASE_LABEL} ${i + 1}`}
                      similarity={getSimilarity(c)}
                      clusterSize={isPrototype ? getClusterSize(c) : null}
                      riskScore={isPrototype ? getRiskScore(c) : null}
                    />
                  </th>
                ))}
              </tr>
            </thead>

            {visibleOutcomeRows.length > 0 && (
              <ComposedSection
                title="Outcome"
                subtitle="What happened to similar patients"
                colSpan={colSpan}
                rows={visibleOutcomeRows}
              />
            )}

            {visibleTreatmentRows.length > 0 && (
              <ComposedSection
                title="Treatment received"
                subtitle="Therapies the similar patients underwent"
                colSpan={colSpan}
                rows={visibleTreatmentRows}
              />
            )}

            <BaselineSection
              colSpan={colSpan}
              visibleKeys={visibleBaselineKeys}
              hasAnyBaseline={baselineKeys.length > 0}
              querySource={querySource}
              cases={cases}
              glossary={glossary}
            />
          </table>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          <span>
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40 mr-1.5 align-middle" />
            Highlighted baseline cells differ from this patient.
          </span>
          <span>
            Outcomes and treatments for "This patient" are withheld — the
            model's prediction is what's being evaluated.
          </span>
        </div>
      </div>
      <Sidebar method={method} isPrototype={isPrototype} />
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
                className={`px-3 py-2 align-top text-[12px] border-l border-border/30 border-b border-border/30 ${toneCellClass(
                  d.tone,
                )}`}
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

function BaselineSection({
  colSpan,
  visibleKeys,
  hasAnyBaseline,
  querySource,
  cases,
  glossary,
}: {
  colSpan: number;
  visibleKeys: string[];
  hasAnyBaseline: boolean;
  querySource: Record<string, unknown>;
  cases: CaseRecord[];
  glossary?: Record<string, GlossaryEntry>;
}) {
  return (
    <tbody>
      <tr>
        <td
          colSpan={colSpan}
          className="sticky left-0 z-[1] px-3 py-2 bg-slate-100/60 dark:bg-slate-900/40 text-[10px] uppercase tracking-wider font-semibold text-foreground border-b border-border/60 border-t border-border/60"
        >
          Clinical baseline
          <span className="ml-2 text-muted-foreground font-normal normal-case text-[10px]">
            Pre-treatment features used to compute similarity
          </span>
        </td>
      </tr>
      {visibleKeys.map((key, rowIdx) => {
        const qv = querySource[key];
        const friendly = glossary?.[key]?.label ?? key;
        const definition = glossary?.[key]?.definition;
        const isEven = rowIdx % 2 === 0;
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
              {formatValue(qv)}
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
                      : "text-muted-foreground"
                  }`}
                >
                  {formatValue(v)}
                </td>
              );
            })}
          </tr>
        );
      })}
      {visibleKeys.length === 0 && (
        <tr>
          <td
            colSpan={colSpan}
            className="text-center text-sm text-muted-foreground py-6"
          >
            {hasAnyBaseline
              ? "No differing baseline features."
              : "No baseline features available."}
          </td>
        </tr>
      )}
    </tbody>
  );
}

function ColumnHeader({
  label,
  accent,
  similarity,
  clusterSize,
  riskScore,
}: {
  label: string;
  accent?: boolean;
  similarity?: number | null;
  clusterSize?: number | null;
  riskScore?: number | null;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={`text-xs font-semibold ${
          accent
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-foreground"
        }`}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-normal">
        {typeof similarity === "number" && (
          <span className="text-muted-foreground">
            sim {(similarity * 100).toFixed(0)}%
          </span>
        )}
        {typeof clusterSize === "number" && (
          <span className="text-muted-foreground">n = {clusterSize}</span>
        )}
        {typeof riskScore === "number" && (
          <span className="text-muted-foreground">
            risk {riskScore.toFixed(2)}
          </span>
        )}
      </div>
    </div>
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

function formatValue(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "number") {
    if (Number.isInteger(v)) return String(v);
    return v.toFixed(2);
  }
  if (typeof v === "boolean") return v ? "yes" : "no";
  return String(v);
}