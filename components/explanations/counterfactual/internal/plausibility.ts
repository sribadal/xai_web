import type { ModelType } from "./types"

/** Clinical reference ranges for plausibility checks. */
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
  neutrofielen: [0, 50],
  trombocyten: [0, 1200],
}

/** Features on a normalised 0–1 scale where values outside 0–1 are implausible. */
const NORMALISED_FEATURES = new Set([
  "ts_surg",
  "ts_syst",
  "surgery_time_norm",
  "chemo_time_norm",
  "time since surgery",
  "time since systemic therapy",
])

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
  if (typeof cfRaw !== "number") return { implausible: false }

  // Normalised 0–1 features: anything outside 0–1 is implausible
  if (NORMALISED_FEATURES.has(feature)) {
    if (cfRaw < -0.05 || cfRaw > 1.05) {
      return {
        implausible: true,
        reason: "Value is outside the valid 0–1 range for this feature.",
      }
    }
    return { implausible: false }
  }

  // Clinical range check (same logic for both RSF and ConDOR)
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

  // Extreme ratio check: flag if the change is 50x+ the original
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