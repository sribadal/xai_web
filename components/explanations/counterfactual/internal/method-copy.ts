export type MethodExplanation = {
  title: string
  description: string
}

const EXPLANATION: Record<string, MethodExplanation> = {
  en: {
    title: "About this method",
    description:
      "Shows the smallest changes to this patient's features that would lead the model to a different prediction. The original profile and the alternative are shown side by side; the changed features are highlighted.",
  },
  nl: {
    title: "Over deze methode",
    description:
      "Toont de kleinste wijzigingen in de kenmerken van deze patiënt die het model tot een andere voorspelling zouden leiden. Het oorspronkelijke profiel en het alternatief worden naast elkaar getoond; de gewijzigde kenmerken zijn gemarkeerd.",
  },
}

export function getMethodExplanation(
  method: string,
  locale: string = "en",
): MethodExplanation {
  void method
  return EXPLANATION[locale] ?? EXPLANATION.en
}