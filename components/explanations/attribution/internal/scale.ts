import { isProbabilityScale } from "../../shared/colors"

export type ScaleMode = "raw" | "scaled" | "percent"

export function deriveHazardScaleFactor(
  prediction?: Record<string, unknown>,
): number | null {
  if (!prediction) return null

  const raw = prediction.risk_score_raw
  const scaled = prediction.risk_score
  if (typeof raw !== "number" || typeof scaled !== "number" || scaled === 0) {
    return null
  }

  const factor = raw / scaled
  return factor > 0 ? factor : null
}

type ResolveScaleArgs = {
  modelType?: "rsf" | "condor"
  timeHorizon: string | null | undefined
  prediction?: Record<string, unknown>
  viewingProbability: boolean
}

export function resolveScaleMode({
  modelType,
  prediction,
  viewingProbability,
}: ResolveScaleArgs): {
  mode: ScaleMode
  hazardFactor: number | null
} {
  if (modelType === "rsf" && viewingProbability) {
    return { mode: "percent", hazardFactor: null }
  }

  if (modelType === "rsf" && !viewingProbability) {
    const hazardFactor = deriveHazardScaleFactor(prediction)
    if (hazardFactor !== null && hazardFactor > 1) {
      return { mode: "scaled", hazardFactor }
    }
  }

  return { mode: "raw", hazardFactor: null }
}

export function transformContributionValue(
  raw: number,
  mode: ScaleMode,
  hazardFactor: number | null,
): number {
  if (mode === "percent") return raw * 100
  if (mode === "scaled" && hazardFactor !== null) return raw / hazardFactor
  return raw
}

export function scaleUnit(mode: ScaleMode): string {
  return mode === "percent" ? " pp" : ""
}

export { isProbabilityScale }