import type { CaseRecord, CompareResult } from "./types"

export function splitColumns(record: CaseRecord) {
  const featureCols: string[] = []
  const metaCols: string[] = []
  for (const k of Object.keys(record)) {
    if (k.startsWith("_")) metaCols.push(k)
    else featureCols.push(k)
  }
  return { featureCols, metaCols }
}

export function getSimilarity(record: CaseRecord): number | null {
  for (const key of ["_similarity", "_distance", "_score", "_sim", "_weight"]) {
    if (typeof record[key] === "number") {
      if (key === "_distance") return 1 / (1 + (record[key] as number))
      return record[key] as number
    }
  }
  return null
}

export function getOutcome(record: CaseRecord): string | null {
  for (const key of [
    "_outcome",
    "_survival",
    "_event",
    "_qol",
    "_risk",
    "_label",
    "_class",
    "_y",
  ]) {
    const v = record[key]
    if (v !== undefined && v !== null) {
      if (typeof v === "number") return v.toFixed(2)
      return String(v)
    }
  }
  return null
}

export function getClusterSize(record: CaseRecord): number | null {
  const v = record._cluster_size
  return typeof v === "number" ? v : null
}

export function getRiskScore(record: CaseRecord): number | null {
  const v = record._risk_score
  return typeof v === "number" ? v : null
}

export function formatVal(v: unknown): string {
  if (v === null || v === undefined) return "—"
  if (typeof v === "number") {
    if (Number.isInteger(v)) return String(v)
    return Math.abs(v) < 0.01 && v !== 0 ? v.toExponential(2) : v.toFixed(2)
  }
  return String(v)
}

export function compareValues(
  queryVal: unknown,
  caseVal: unknown,
): CompareResult {
  if (queryVal === undefined || caseVal === undefined) return "missing"
  if (queryVal === null || caseVal === null) return "missing"

  if (typeof queryVal === "number" && typeof caseVal === "number") {
    const diff = caseVal - queryVal
    if (Math.abs(diff) < 0.01) return "same"
    return diff > 0 ? "higher" : "lower"
  }

  return queryVal === caseVal ? "same" : "different"
}

export function resolveDisplayValue(
  key: string,
  features: Record<string, unknown>,
  rawFeatures?: Record<string, unknown>,
): unknown {
  if (rawFeatures && rawFeatures[key] !== undefined) return rawFeatures[key]
  return features[key]
}