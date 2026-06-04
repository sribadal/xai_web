export const COLOR_GOOD = "#22c55e"
export const COLOR_BAD = "#ef4444"
export const COLOR_NEUTRAL = "#3b82f6"

export type GoodSign = 1 | -1
export type ModelType = "rsf" | "condor"

export function pickContributionColor(
  value: number,
  hasNegative: boolean,
  goodSign: GoodSign,
): string {
  if (!hasNegative) return COLOR_NEUTRAL
  if (value === 0) return COLOR_NEUTRAL
  const sign = value > 0 ? 1 : -1
  return sign === goodSign ? COLOR_GOOD : COLOR_BAD
}

export type DirectionLabels = {
  positiveLabel: string
  negativeLabel: string
  goodSign: GoodSign
}

export function getDirectionLabels(
  modelType?: ModelType,
  timeHorizon?: string | null,
  locale: string = "en",
): DirectionLabels {
  const nl = locale === "nl"

  if (modelType === "condor") {
    return {
      positiveLabel: nl ? "Verhoogt KvL (beter)" : "Increases QoL (better)",
      negativeLabel: nl ? "Verlaagt KvL (slechter)" : "Decreases QoL (worse)",
      goodSign: 1,
    }
  }

  const horizonNote = isProbabilityScale(timeHorizon)
    ? (nl ? " sterfte" : " mortality")
    : ""

  return {
    positiveLabel: nl
      ? `Verhoogt${horizonNote}risico (slechter)`
      : `Increases${horizonNote} risk (worse)`,
    negativeLabel: nl
      ? `Verlaagt${horizonNote}risico (beter)`
      : `Decreases${horizonNote} risk (better)`,
    goodSign: -1,
  }
}

export function isProbabilityScale(timeHorizon?: string | null): boolean {
  return !!timeHorizon && timeHorizon !== ""
}