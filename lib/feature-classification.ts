import { parseFeatureKey } from "@/lib/parse-feature-key";
import type { GlossaryEntry } from "@/app/admin/patients/actions";

export type FeatureKind = "categorical" | "binary" | "continuous" | "outcome";

export const OUTCOME_FEATURES = new Set<string>([
  "rfs_event",
  "rfs_int",
  "pfs_event",
  "pfs_int",
  "rfs_1jaar_afgerond",
  "rfs_3jaar_afgerond",
  "rfs_5jaar_afgerond",
  "pfs_1jaar_afgerond",
  "pfs_3jaar_afgerond",
  "pfs_5jaar_afgerond",
  "dead_with_6months",
  "vit_stat",
  "vit_stat_int",
  "fup_event_type",
  "fup_event_int",
  "fup_diagnostiek_reden",
  "respons_uitslag",
  "respons_int",
]);

const BINARY_FEATURES = new Set<string>([
  "cm",
  "pm",
  "meta_bijnier",
  "meta_bot",
  "meta_hersenen",
  "meta_lever",
  "meta_long",
  "meta_lymf",
  "meta_perit",
  "meta_overig",
  "meta_chir",
  "lok_chemo_immuno",
  "tumgericht_ther",
  "expl_chir",
  "chir",
  "destr",
  "meta_rt",
  "chemo",
  "target",
]);

export function classifyFeature(
  rawKey: string,
  glossary?: Record<string, GlossaryEntry>,
): FeatureKind {
  const { feature } = parseFeatureKey(rawKey);

  if (OUTCOME_FEATURES.has(feature)) return "outcome";

  const entry = glossary?.[feature];
  if (entry?.value_labels && Object.keys(entry.value_labels).length > 0) {
    return "categorical";
  }

  if (BINARY_FEATURES.has(feature)) return "binary";

  return "continuous";
}

export type CategoricalResolution =
  | { kind: "resolved"; label: string; valueLabel: string }
  | { kind: "missing"; label: string }
  | { kind: "unresolved" };

export function resolveCategoricalValue(
  rawKey: string,
  rawValue: unknown,
  glossary: Record<string, GlossaryEntry> | undefined,
): CategoricalResolution {
  const parsed = parseFeatureKey(rawKey);
  const entry = glossary?.[parsed.feature];

  if (!entry?.value_labels || Object.keys(entry.value_labels).length === 0) {
    return { kind: "unresolved" };
  }

  const baseLabel = entry.label ?? parsed.feature;
  const label = parsed.condition ? `${baseLabel} (${parsed.condition})` : baseLabel;

  if (rawValue == null) {
    return { kind: "missing", label };
  }

  const lookupKey = String(rawValue);
  const valueLabel = entry.value_labels[lookupKey];

  if (!valueLabel) {
    return {
      kind: "resolved",
      label,
      valueLabel: `code ${lookupKey}`,
    };
  }

  return { kind: "resolved", label, valueLabel };
}

export function isThresholdInScaledSpace(
  rawValue: unknown,
  threshold: number,
): boolean {
  if (rawValue == null) {
    return Math.abs(threshold) < 3 && !Number.isInteger(threshold);
  }

  const rawNum = typeof rawValue === "number" ? rawValue : Number(rawValue);
  if (!Number.isFinite(rawNum)) return false;

  if (Math.abs(rawNum) > 5 && Math.abs(threshold) < 3) return true;

  return false;
}

export function scaledDirection(
  operator: string,
  threshold: number,
): "below" | "above" | "near" {
  switch (operator) {
    case "<=":
    case "<":
      return threshold <= 0 ? "below" : "near";
    case ">=":
    case ">":
      return threshold >= 0 ? "above" : "near";
    default:
      return "near";
  }
}