export type MethodExplanation = {
  title: string
  description: string
}

const ATTRIBUTION_EXPLANATIONS: Record<string, Record<string, MethodExplanation>> = {
  rsf: {
    en: {
      title: "About this method",
      description:
        "Each bar shows how a patient feature pushed the model's survival prediction. " +
        "Red bars (right) increase mortality risk; green bars (left) are protective. " +
        "Longer bars have a stronger effect. When multiple time horizons are shown, " +
        "the selected horizon is highlighted and others are faded.",
    },
    nl: {
      title: "Over deze methode",
      description:
        "Elke balk toont hoe een patiëntkenmerk de overlevingsvoorspelling van het model beïnvloedde. " +
        "Rode balken (rechts) verhogen het sterfterisico; groene balken (links) zijn beschermend. " +
        "Langere balken hebben een sterker effect. Wanneer meerdere horizonten worden getoond, " +
        "is de geselecteerde horizon gemarkeerd en zijn de andere vervaagd.",
    },
  },
  condor: {
    en: {
      title: "About this method",
      description:
        "Each bar shows how a patient feature pushed the model's quality-of-life prediction. " +
        "Green bars (right) increase predicted quality of life; red bars (left) decrease it. " +
        "Longer bars have a stronger effect. Use the time horizon chips to switch between " +
        "prediction windows.",
    },
    nl: {
      title: "Over deze methode",
      description:
        "Elke balk toont hoe een patiëntkenmerk de kwaliteit-van-levenvoorspelling van het model beïnvloedde. " +
        "Groene balken (rechts) verhogen de voorspelde kwaliteit van leven; rode balken (links) verlagen deze. " +
        "Langere balken hebben een sterker effect. Gebruik de horizontchips om tussen " +
        "voorspellingsperioden te wisselen.",
    },
  },
}

const FALLBACK: Record<string, MethodExplanation> = {
  en: {
    title: "About this method",
    description:
      "Each bar shows how a patient feature pushed the model's prediction. " +
      "Longer bars have a stronger effect.",
  },
  nl: {
    title: "Over deze methode",
    description:
      "Elke balk toont hoe een patiëntkenmerk de voorspelling van het model beïnvloedde. " +
      "Langere balken hebben een sterker effect.",
  },
}

export function getMethodExplanation(
  method: string,
  modelType?: string,
  locale: string = "en",
): MethodExplanation {
  void method
  const lang = locale === "nl" ? "nl" : "en"
  if (modelType && modelType in ATTRIBUTION_EXPLANATIONS) {
    return ATTRIBUTION_EXPLANATIONS[modelType][lang] ?? ATTRIBUTION_EXPLANATIONS[modelType].en
  }
  return FALLBACK[lang] ?? FALLBACK.en
}