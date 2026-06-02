export type MethodExplanation = {
  title: string
  description: string
}

const ATTRIBUTION_EXPLANATIONS: Record<string, MethodExplanation> = {
  rsf: {
    title: "About this method",
    description:
      "Each bar shows how a patient feature pushed the model's survival prediction. " +
      "Red bars (right) increase mortality risk; green bars (left) are protective. " +
      "Longer bars have a stronger effect. When multiple time horizons are shown, " +
      "the selected horizon is highlighted and others are faded.",
  },
  condor: {
    title: "About this method",
    description:
      "Each bar shows how a patient feature pushed the model's quality-of-life prediction. " +
      "Green bars (right) increase predicted quality of life; red bars (left) decrease it. " +
      "Longer bars have a stronger effect. Use the time horizon chips to switch between " +
      "prediction windows.",
  },
}

const FALLBACK: MethodExplanation = {
  title: "About this method",
  description:
    "Each bar shows how a patient feature pushed the model's prediction. " +
    "Longer bars have a stronger effect.",
}

export function getMethodExplanation(
  method: string,
  modelType?: string,
): MethodExplanation {
  void method
  if (modelType && modelType in ATTRIBUTION_EXPLANATIONS) {
    return ATTRIBUTION_EXPLANATIONS[modelType]
  }
  return FALLBACK
}