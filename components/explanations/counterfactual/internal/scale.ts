import type { ModelType } from "./types"

export type Scale = "risk_0_100" | "mortality_prob" | "qol_0_100"

export const SCALE_CONFIG: Record<
  Scale,
  {
    lowerIsBetter: boolean
    outcomeNoun: string
    formatPrediction: (v: number) => string
  }
> = {
  risk_0_100: {
    lowerIsBetter: true,
    outcomeNoun: "risk score",
    formatPrediction: (v) => v.toFixed(1),
  },
  mortality_prob: {
    lowerIsBetter: true,
    outcomeNoun: "mortality risk",
    formatPrediction: (v) => `${(v * 100).toFixed(1)}%`,
  },
  qol_0_100: {
    lowerIsBetter: false,
    outcomeNoun: "quality-of-life score",
    formatPrediction: (v) => v.toFixed(1),
  },
}

export function resolveScale(
  modelType: ModelType,
  timeHorizon?: string | null,
): Scale {
  if (modelType === "condor") return "qol_0_100"
  if (timeHorizon && timeHorizon !== "") return "mortality_prob"
  return "risk_0_100"
}

export function extractPatientPrediction(
  prediction: Record<string, unknown> | undefined,
  scale: Scale,
  timeHorizon?: string | null,
): number | null {
  if (!prediction) return null
  if (scale === "mortality_prob" && timeHorizon) {
    const v = prediction[`mortality_risk_${timeHorizon}`]
    if (typeof v === "number") return v
  }
  if (prediction.risk_score != null) return Number(prediction.risk_score)
  return null
}