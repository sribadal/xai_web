export type MethodExplanation = {
  title: string
  description: string
}

const EXPLANATION: MethodExplanation = {
  title: "About this method",
  description:
    "Each bar shows how a patient feature pushed the model's prediction up or down. Bars to the right increase the predicted value; bars to the left decrease it. Longer bars have a stronger effect.",
}

export function getMethodExplanation(method: string): MethodExplanation {
  void method
  return EXPLANATION
}