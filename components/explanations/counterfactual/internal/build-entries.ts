import { getActionability } from "@/lib/feature-actionability"
import type { GlossaryEntry } from "@/app/admin/patients/actions"
import {
  buildLabel,
  coerceScalar,
  formatValue,
  valuesEqual,
} from "./labels"
import { detectImplausibility } from "./plausibility"
import type {
  CardEntry,
  ChangedFeature,
  EntryPair,
  ModelType,
} from "./types"

function pickValue(
  rawKey: string,
  rawSource: Record<string, unknown> | undefined,
  fallbackRaw: Record<string, unknown> | undefined,
  fallback: Record<string, unknown>,
): unknown {
  if (rawSource && rawKey in rawSource) return rawSource[rawKey]
  if (fallbackRaw && rawKey in fallbackRaw) return fallbackRaw[rawKey]
  return fallback[rawKey]
}

export type BuildEntriesArgs = {
  content: Record<string, number>
  originalFeatures: Record<string, unknown>
  originalFeaturesRaw: Record<string, unknown> | undefined
  rawQuery: Record<string, unknown> | undefined
  rawCf: Record<string, unknown> | undefined
  cfRow: Record<string, unknown> | undefined
  modelType: ModelType
  glossary?: Record<string, GlossaryEntry>
}

export function buildEntries({
  content,
  originalFeatures,
  originalFeaturesRaw,
  rawQuery,
  rawCf,
  cfRow,
  modelType,
  glossary,
}: BuildEntriesArgs): {
  pairs: EntryPair[]
  changed: ChangedFeature[]
} {
  const keys = new Set<string>()
  for (const k of Object.keys(originalFeatures)) keys.add(k)
  if (cfRow) for (const k of Object.keys(cfRow)) keys.add(k)
  for (const k of Object.keys(content)) keys.add(k)

  const pairs: EntryPair[] = []
  const changed: ChangedFeature[] = []

  for (const rawKey of keys) {
    const { feature, label, definition, valueLabels } = buildLabel(
      rawKey,
      glossary,
    )
    const actionability = getActionability(rawKey)

    const originalRaw = coerceScalar(
      pickValue(rawKey, rawQuery, originalFeaturesRaw, originalFeatures),
    )
    const cfRaw = coerceScalar(pickValue(rawKey, rawCf, undefined, cfRow ?? {}))
    const cfEffective = cfRaw === null ? originalRaw : cfRaw

    const original: CardEntry = {
      rawKey,
      feature,
      label,
      definition,
      actionability,
      displayValue: formatValue(originalRaw, valueLabels, feature),
      rawValue: originalRaw,
    }
    const counterfactual: CardEntry = {
      rawKey,
      feature,
      label,
      definition,
      actionability,
      displayValue: formatValue(cfEffective, valueLabels, feature),
      rawValue: cfEffective,
    }

    pairs.push({ original, counterfactual })

    if (!valuesEqual(originalRaw, cfEffective)) {
      const { implausible, reason } = detectImplausibility(
        feature,
        originalRaw,
        cfEffective,
        modelType,
      )
      changed.push({
        rawKey,
        feature,
        label,
        definition,
        actionability,
        originalDisplay: formatValue(originalRaw, valueLabels, feature),
        cfDisplay: formatValue(cfEffective, valueLabels, feature),
        originalRaw,
        cfRaw: cfEffective,
        implausible,
        implausibleReason: reason,
      })
    }
  }

  return { pairs, changed }
}