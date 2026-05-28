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
): DirectionLabels {
  if (modelType === "condor") {
    return {
      positiveLabel: "Increases QoL (better)",
      negativeLabel: "Decreases QoL (worse)",
      goodSign: 1,
    }
  }
  const horizonNote = isProbabilityScale(timeHorizon) ? " mortality" : ""
  return {
    positiveLabel: `Increases${horizonNote} risk (worse)`,
    negativeLabel: `Decreases${horizonNote} risk (better)`,
    goodSign: -1,
  }
}

export function isProbabilityScale(timeHorizon?: string | null): boolean {
  return !!timeHorizon && timeHorizon !== ""
}