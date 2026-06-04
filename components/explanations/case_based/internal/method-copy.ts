export type MethodCopy = {
  title: string
  description: string
}

const COPY: Record<string, MethodCopy> = {
  en: {
    title: "About this method",
    description:
      "Shows patients from the training data whose profiles are most similar to this patient. Comparing the shared and differing features — alongside the similar patients' observed outcomes — can help contextualise this patient's prediction.",
  },
  nl: {
    title: "Over deze methode",
    description:
      "Toont patiënten uit de trainingsdata met het meest vergelijkbare profiel. Het vergelijken van gedeelde en afwijkende kenmerken — samen met de waargenomen uitkomsten — kan helpen de voorspelling voor deze patiënt in context te plaatsen.",
  },
}

export function getMethodCopy(method: string, locale: string = "en"): MethodCopy {
  void method
  return COPY[locale] ?? COPY.en
}