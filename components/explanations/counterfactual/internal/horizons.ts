export const HORIZON_CUMULATIVE = ""

export const HORIZON_LABELS: Record<string, string> = {
  [HORIZON_CUMULATIVE]: "Cumulative",
  "3_months": "3-month",
  "6_months": "6-month",
  "12_months": "12-month",
}

const HORIZON_ORDER = [
  HORIZON_CUMULATIVE,
  "3_months",
  "6_months",
  "12_months",
] as const

export function horizonLabel(horizon: string): string {
  return HORIZON_LABELS[horizon] ?? horizon
}

export function sortHorizons(horizons: string[]): string[] {
  const known = new Set<string>(HORIZON_ORDER)
  const sortedKnown = HORIZON_ORDER.filter((h) => horizons.includes(h))
  const unknown = horizons.filter((h) => !known.has(h)).sort()
  return [...sortedKnown, ...unknown]
}