import type { ModelType } from "./types"

const PLAUSIBLE_RANGES: Record<string, [number, number]> = {
  ca199: [0, 10000],
  bilirubine: [0, 500],
  albumine: [10, 60],
  kreatinine: [20, 600],
  hb: [3, 14],
  ldh: [50, 5000],
  crp: [0, 500],
  cea: [0, 10000],
  leeftcat: [0, 25],
  cci: [0, 15],
  perfstat: [0, 9],
  asa: [0, 5],
  lengte: [120, 220],
  diaggewicht: [25, 200],
  gebrgewicht: [25, 200],
  klintumafm: [0, 999],
  patumafm: [0, 999],
}

export function lookupPlausibleRange(feature: string): [number, number] | null {
  const key = feature.toLowerCase().replace(/[^a-z0-9]/g, "")
  for (const [k, range] of Object.entries(PLAUSIBLE_RANGES)) {
    if (key === k || key.includes(k) || k.includes(key)) return range
  }
  return null
}

export function detectImplausibility(
  feature: string,
  originalRaw: number | string | null,
  cfRaw: number | string | null,
  modelType: ModelType,
): { implausible: boolean; reason?: string } {
  if (modelType === "condor") {
    if (typeof cfRaw === "number" && Math.abs(cfRaw) > 10) {
      return {
        implausible: true,
        reason: "Counterfactual is far outside the training distribution.",
      }
    }
    return { implausible: false }
  }

  if (typeof cfRaw !== "number") return { implausible: false }

  const range = lookupPlausibleRange(feature)
  if (range) {
    const [lo, hi] = range
    if (cfRaw < lo || cfRaw > hi) {
      return {
        implausible: true,
        reason: `Outside plausible clinical range (${lo}–${hi}).`,
      }
    }
  }

  if (typeof originalRaw === "number" && originalRaw !== 0 && cfRaw !== 0) {
    const ratio =
      Math.abs(cfRaw) > Math.abs(originalRaw)
        ? Math.abs(cfRaw / originalRaw)
        : Math.abs(originalRaw / cfRaw)
    if (ratio > 50) {
      return {
        implausible: true,
        reason: "Counterfactual is far from a clinically reasonable value.",
      }
    }
  }

  return { implausible: false }
}