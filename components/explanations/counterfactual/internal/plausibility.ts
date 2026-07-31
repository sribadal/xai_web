import type { ModelType } from "./types"

const PLAUS_T = {
  en: {
    outsideRange: (lo: number, hi: number) => `Outside plausible clinical range (${lo}–${hi}).`,
    outsideNorm: "Value is outside the valid 0–1 range for this feature.",
    extremeRatio: "Counterfactual is far from a clinically reasonable value.",
  },
  nl: {
    outsideRange: (lo: number, hi: number) => `Buiten plausibel klinisch bereik (${lo}–${hi}).`,
    outsideNorm: "Waarde valt buiten het geldige 0–1 bereik voor dit kenmerk.",
    extremeRatio: "Contrafactische waarde wijkt sterk af van een klinisch redelijke waarde.",
  },
} as const;

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

const REGISTRY_SENTINELS = new Set([99.9, 999, 999.9, 9999, 9999.9])

const NORMALISED_FEATURES = new Set([
  "ts_surg",
  "ts_syst",
  "surgery_time_norm",
  "chemo_time_norm",
  "time since surgery",
  "time since systemic therapy",
])

function isRegistrySentinel(value: number | string | null): boolean {
  return typeof value === "number" && REGISTRY_SENTINELS.has(value)
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
  locale: string = "en",
): { implausible: boolean; reason?: string } {
  const t = PLAUS_T[locale as keyof typeof PLAUS_T] ?? PLAUS_T.en;

  if (typeof cfRaw !== "number") return { implausible: false }
  if (isRegistrySentinel(cfRaw)) return { implausible: false }

  if (NORMALISED_FEATURES.has(feature)) {
    if (cfRaw < -0.05 || cfRaw > 1.05) {
      return { implausible: true, reason: t.outsideNorm }
    }
    return { implausible: false }
  }

  const range = lookupPlausibleRange(feature)
  if (range) {
    const [lo, hi] = range
    if (cfRaw < lo || cfRaw > hi) {
      return { implausible: true, reason: t.outsideRange(lo, hi) }
    }
  }

  if (
    typeof originalRaw === "number" &&
    !isRegistrySentinel(originalRaw) &&
    originalRaw !== 0 &&
    cfRaw !== 0
  ) {
    const ratio =
      Math.abs(cfRaw) > Math.abs(originalRaw)
        ? Math.abs(cfRaw / originalRaw)
        : Math.abs(originalRaw / cfRaw)
    if (ratio > 50) {
      return { implausible: true, reason: t.extremeRatio }
    }
  }

  return { implausible: false }
}