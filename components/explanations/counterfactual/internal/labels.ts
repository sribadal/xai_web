import { parseFeatureKey } from "@/lib/parse-feature-key"
import type { GlossaryEntry } from "@/app/admin/patients/actions"

export function buildLabel(
  rawKey: string,
  glossary?: Record<string, GlossaryEntry>,
) {
  const parsed = parseFeatureKey(rawKey)
  const entry = glossary?.[parsed.feature]
  const baseName = entry?.label ?? parsed.feature
  const label = parsed.condition ? `${baseName} (${parsed.condition})` : baseName
  return {
    feature: parsed.feature,
    label,
    definition: entry?.definition,
    valueLabels: entry?.value_labels,
  }
}

export function coerceScalar(v: unknown): number | string | null {
  if (typeof v === "number" && isFinite(v)) return v
  if (typeof v === "string") return v
  return null
}

export function formatNumber(v: number): string {
  if (!isFinite(v)) return "—"
  const a = Math.abs(v)
  if (a === 0) return "0"
  if (a >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (a >= 1e4) return `${(v / 1e3).toFixed(1)}k`
  if (a >= 100) return v.toFixed(0)
  if (a >= 10) return v.toFixed(1)
  if (a >= 1) return v.toFixed(2)
  if (a >= 0.01) return v.toFixed(3)
  return v.toExponential(1)
}

export function formatValue(
  v: number | string | null,
  valueLabels?: Record<string, string>,
): string {
  if (v === null) return "—"
  const label = valueLabels?.[String(v)]
  if (label) return label
  return typeof v === "number" ? formatNumber(v) : v
}

export function valuesEqual(
  a: number | string | null,
  b: number | string | null,
) {
  if (a === null || b === null) return a === b
  if (typeof a === "number" && typeof b === "number") {
    return Math.abs(a - b) < 1e-9
  }
  return a === b
}