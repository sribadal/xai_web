export type MethodExplanation = {
  title: string
  description: string
}

const EXPLANATION: MethodExplanation = {
  title: "About this method",
  description:
    "Shows the smallest changes to this patient's features that would lead the model to a different prediction. The original profile and the alternative are shown side by side; the changed features are highlighted.",
}

export function getMethodExplanation(method: string): MethodExplanation {
  void method
  return EXPLANATION
}