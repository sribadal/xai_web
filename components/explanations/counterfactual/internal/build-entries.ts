import { getActionability } from "@/lib/feature-actionability";
import type { GlossaryEntry } from "@/app/admin/patients/actions";
import { buildLabel, coerceScalar, formatValue, valuesEqual } from "./labels";
import { detectImplausibility } from "./plausibility";
import type { CardEntry, ChangedFeature, EntryPair, ModelType } from "./types";
import { decodeFeatureValue } from "@/lib/feature-value-encoder";

/**
 * Glossary valueLabels take priority (locale-specific), then fall back
 * to the comprehensive decoder (sentinels, units, binary vars, TNM).
 */
function resolveDisplay(
  rawKey: string,
  value: unknown,
  valueLabels?: Record<string, string>,
  locale: string = "en",
): string {
  if (value === null || value === undefined) return "—";
  if (valueLabels) {
    const label = valueLabels[String(value)];
    if (label) return label;
  }
  return decodeFeatureValue(rawKey, value, locale);
}

function pickValue(
  rawKey: string,
  rawSource: Record<string, unknown> | undefined,
  fallbackRaw: Record<string, unknown> | undefined,
  fallback: Record<string, unknown>,
): unknown {
  if (rawSource && rawKey in rawSource) return rawSource[rawKey];
  if (fallbackRaw && rawKey in fallbackRaw) return fallbackRaw[rawKey];
  return fallback[rawKey];
}

export type BuildEntriesArgs = {
  content: Record<string, number>;
  originalFeatures: Record<string, unknown>;
  originalFeaturesRaw: Record<string, unknown> | undefined;
  rawQuery: Record<string, unknown> | undefined;
  rawCf: Record<string, unknown> | undefined;
  cfRow: Record<string, unknown> | undefined;
  modelType: ModelType;
  glossary?: Record<string, GlossaryEntry>;
  locale: string;
};

export function buildEntries({
  content,
  originalFeatures,
  originalFeaturesRaw,
  rawQuery,
  rawCf,
  cfRow,
  modelType,
  glossary,
  locale,
}: BuildEntriesArgs): {
  pairs: EntryPair[];
  changed: ChangedFeature[];
} {
  const keys = new Set<string>();
  for (const k of Object.keys(originalFeatures)) keys.add(k);
  if (cfRow) for (const k of Object.keys(cfRow)) keys.add(k);
  for (const k of Object.keys(content)) keys.add(k);

  const pairs: EntryPair[] = [];
  const changed: ChangedFeature[] = [];

  for (const rawKey of keys) {
    const { feature, label, definition, valueLabels } = buildLabel(
      rawKey,
      glossary,
    );
    const actionability = getActionability(rawKey);

    const originalRaw = coerceScalar(
      pickValue(rawKey, rawQuery, originalFeaturesRaw, originalFeatures),
    );
    const cfRaw = coerceScalar(
      pickValue(rawKey, rawCf, undefined, cfRow ?? {}),
    );
    const cfEffective = cfRaw === null ? originalRaw : cfRaw;

    const original: CardEntry = {
      rawKey,
      feature,
      label,
      definition,
      actionability,
      displayValue: resolveDisplay(rawKey, originalRaw, valueLabels, locale),
      rawValue: originalRaw,
    };
    const counterfactual: CardEntry = {
      rawKey,
      feature,
      label,
      definition,
      actionability,
      displayValue: resolveDisplay(rawKey, cfEffective, valueLabels, locale),
      rawValue: cfEffective,
    };

    pairs.push({ original, counterfactual });

    if (!valuesEqual(originalRaw, cfEffective)) {
      const { implausible, reason } = detectImplausibility(
        feature,
        originalRaw,
        cfEffective,
        modelType,
        locale,
      );
      changed.push({
        rawKey,
        feature,
        label,
        definition,
        actionability,
        originalDisplay: resolveDisplay(
          rawKey,
          originalRaw,
          valueLabels,
          locale,
        ),
        cfDisplay: resolveDisplay(rawKey, cfEffective, valueLabels, locale),
        originalRaw,
        cfRaw: cfEffective,
        implausible,
        implausibleReason: reason,
      });
    }
  }
  return { pairs, changed };
}
