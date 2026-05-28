export type Locale = "en" | "nl";

export interface MethodExplanation {
  title: string;
  description: string;
  howToRead: string;
  caveat: string;
}

export interface RuleBasedMessages {
  operators: {
    lte: string;
    gte: string;
    lt: string;
    gt: string;
    eq: string;
    neq: string;
  };

  narrative: {
    leadIn: string;
    and: string;
    finalAnd: string;
    listSeparator: string;
    outcomeSuffix: (outcome: string) => string;
    rulefitLeadIn: string;
    riskRaisingHeader: string;
    riskLoweringHeader: string;
    rulefitWhen: (clauseText: string, direction: "raise" | "lower") => string;
    rulefitOutcomeSuffix: (outcome: string) => string;
  };

  condition: {
    isPresent: string;
    isAbsent: string;
    applies: string;
    notRecorded: string;
    belowTypical: string;
    aboveTypical: string;
    nearTypical: string;
    outcomeWarning: string;
  };

  ui: {
    conditionsCount: (n: number) => string;
    firingRulesCount: (n: number) => string;
    showTechnical: string;
    showClinical: string;
    prediction: string;
    keyFactors: string;
    contributingPatterns: string;
    showAll: (n: number) => string;
    showFewer: string;
    rawRuleText: string;
    conditionsHeader: string;
    thenLabel: string;
    firingRulesHeader: string;
    rangeIndicator: string;
    rangeIndicatorHint: string;
    binaryFeatures: string;
    conditionConfirmed: string;
    conditionAbsent: string;
    qualityMetrics: string;
    parameters: string;
    noiseScale: string;
    activeRules: string;
    legend: string;
    lowersRisk: string;
    raisesRisk: string;
    seenInPercent: (pct: number) => string;
    supportLabel: (pct: number) => string;

    fidelityDesc: string;
    fidelityLabel: string;

    localFidelityLabel: string;
    localFidelityDesc: string;

    precisionDesc: string;
    coverageDesc: string;
    precisionLabel: string;
    coverageLabel: string;

    anchorsConfidenceHeader: string;
    anchorsConfidenceStatement: (precision?: number, coverage?: number) => string;

    decisionPathHeader: (depth: number) => string;
    treePathDepth: (depth: number) => string;
    treePathAria: (depth: number) => string;

    sumOfContributions: (sum: number, outcome?: string) => string;
    sumOfContributionsTechnical: (sum: number) => string;

    noData: string;
    scaledValueCaveat: string;
  };

  methods: {
    lore: MethodExplanation;
    rulefit: MethodExplanation;
    anchors: MethodExplanation;
    surrogateTree: MethodExplanation;
    default: MethodExplanation;
  };
}

function pctEn(x: number | undefined) {
  if (x == null || Number.isNaN(x)) return "—";
  return `${Math.round(x * 100)}%`;
}

function pctNl(x: number | undefined) {
  if (x == null || Number.isNaN(x)) return "—";
  return `${Math.round(x * 100)}%`;
}

function signed(x: number) {
  const s = x >= 0 ? "+" : "";
  return `${s}${x.toFixed(2)}`;
}

const en: RuleBasedMessages = {
  operators: {
    lte: "is at most",
    gte: "is at least",
    lt: "is below",
    gt: "is above",
    eq: "equals",
    neq: "is not",
  },

  narrative: {
    leadIn: "The model predicts this outcome because the patient's ",
    and: " and ",
    finalAnd: ", and ",
    listSeparator: ", ",
    outcomeSuffix: (outcome) =>
      ` Together, these factors lead to a prediction of "${outcome}".`,
    rulefitLeadIn:
      "The model combines multiple clinical patterns to arrive at this prediction.",
    riskRaisingHeader: "Factors that increase the risk estimate:",
    riskLoweringHeader: "Factors that decrease the risk estimate:",
    rulefitWhen: (clauseText, direction) =>
      direction === "raise"
        ? `\u2022 When ${clauseText} \u2014 this raises the risk score.`
        : `\u2022 When ${clauseText} \u2014 this lowers the risk score.`,
    rulefitOutcomeSuffix: (outcome) =>
      `On balance, these patterns lead to a prediction of "${outcome}".`,
  },

  condition: {
    isPresent: "is present",
    isAbsent: "is absent",
    applies: "applies",
    notRecorded: "(not recorded for this patient)",
    belowTypical: "is below typical for this group",
    aboveTypical: "is above typical for this group",
    nearTypical: "is near the typical value",
    outcomeWarning: "outcome variable",
  },

  ui: {
    conditionsCount: (n) => `${n} condition${n !== 1 ? "s" : ""}`,
    firingRulesCount: (n) => `${n} firing rule${n !== 1 ? "s" : ""}`,
    showTechnical: "Show technical notation",
    showClinical: "Show clinical summary",
    prediction: "Prediction",
    keyFactors: "Key clinical factors",
    contributingPatterns: "Contributing clinical patterns",
    showAll: (n) => `Show all ${n} patterns \u25be`,
    showFewer: "Show fewer \u25b4",
    rawRuleText: "Raw rule text \u25b8",
    conditionsHeader: "Conditions (IF \u2026 THEN)",
    thenLabel: "THEN",
    firingRulesHeader: "Firing rules (weighted)",
    rangeIndicator: "Range indicator",
    rangeIndicatorHint: "Blue fill = satisfying range. Line = threshold value.",
    binaryFeatures: "Binary features",
    conditionConfirmed: "Condition confirmed",
    conditionAbsent: "Condition not present",
    qualityMetrics: "Quality metrics",
    parameters: "Parameters",
    noiseScale: "Noise scale",
    activeRules: "Active rules",
    legend: "Legend",
    lowersRisk: "Lowers risk",
    raisesRisk: "Raises risk",
    seenInPercent: (pct) => `Seen in ${pct.toFixed(0)}% of patients`,
    supportLabel: (pct) => `support: ${pct.toFixed(0)}%`,

    fidelityDesc:
      "How well this rule matches what the model actually does. Higher is better.",
    fidelityLabel: "Fidelity",

    localFidelityLabel: "Local fidelity",
    localFidelityDesc:
      "How well this rule matches the model's behaviour on patients similar to this one. Higher is better. Unlike global fidelity, this is measured only on a local neighbourhood.",

    precisionDesc:
      "How often the prediction holds when these conditions are met.",
    coverageDesc:
      "What fraction of patients this rule applies to. Lower means more specific to this patient.",
    precisionLabel: "Precision",
    coverageLabel: "Coverage",

    anchorsConfidenceHeader: "Anchor confidence",
    anchorsConfidenceStatement: (precision, coverage) => {
      const parts: string[] = [];
      if (precision != null && !Number.isNaN(precision)) {
        parts.push(
          `When these conditions hold, the prediction stays the same about ${pctEn(precision)} of the time.`,
        );
      }
      if (coverage != null && !Number.isNaN(coverage)) {
        parts.push(
          `This rule applies to roughly ${pctEn(coverage)} of similar patients in the training cohort.`,
        );
      }
      return parts.join(" ");
    },

    decisionPathHeader: (depth) =>
      depth > 0
        ? `Decision path \u2014 depth ${depth}`
        : `Decision path`,
    treePathDepth: (depth) => `depth ${depth}`,
    treePathAria: (depth) =>
      `Decision tree path with ${depth} split${depth !== 1 ? "s" : ""}`,

    sumOfContributions: (sum, outcome) =>
      outcome
        ? `These patterns add up to a net contribution of ${signed(sum)}, leading to a prediction of "${outcome}".`
        : `These patterns add up to a net contribution of ${signed(sum)}.`,
    sumOfContributionsTechnical: (sum) =>
      `\u03A3 coef = ${signed(sum)}`,

    noData: "No rule-based data",
    scaledValueCaveat:
      "This feature is shown relative to the typical value because the model uses a transformed scale that has no direct clinical interpretation.",
  },

  methods: {
    lore: {
      title: "Decision Rule (LORE)",
      description:
        'This explanation shows a set of clinical conditions that describe why the model made this prediction. Think of it as: "patients with these characteristics tend to get this result."',
      howToRead:
        "Each row shows one clinical factor and the threshold that was relevant for this patient. The blue bar shows which side of the threshold satisfies the condition. The local fidelity score tells you how reliably this rule matches the model's behaviour on similar patients.",
      caveat:
        "This rule is built from a local surrogate tree fit around this patient \u2014 it captures the key patterns near this case but may not generalise to very different patients.",
    },
    rulefit: {
      title: "Combined Rules (RuleFit)",
      description:
        "Multiple clinical patterns work together to arrive at the prediction. Each pattern describes a combination of findings, and its direction shows whether it pushes toward lower or higher risk.",
      howToRead:
        "Green (\u2193) patterns reduce the risk estimate; red (\u2191) patterns increase it. The bar width shows the relative weight of each pattern. The sum of all weights determines the prediction.",
      caveat:
        "These patterns approximate the model's reasoning. In reality, the model evaluates all features simultaneously rather than applying rules one by one.",
    },
    anchors: {
      title: "Anchoring Conditions (Anchors)",
      description:
        'These are the key clinical conditions that "anchor" this prediction \u2014 as long as these hold true, the prediction stays the same regardless of other features.',
      howToRead:
        "Precision tells you how reliable the anchor is: 95% means the prediction holds 95 out of 100 times when these conditions are met. Coverage tells you how broadly this anchor applies across all patients.",
      caveat:
        "A very precise anchor with low coverage means the rule is reliable but quite specific to this patient's profile.",
    },
    surrogateTree: {
      title: "Decision Path (Surrogate Tree)",
      description:
        "This explanation traces a single root-to-leaf path through a simplified decision tree that approximates the model. The conditions along the path describe why this patient ends up in this leaf.",
      howToRead:
        "Read the conditions in order, from the root of the tree down to the leaf. Each split narrows the patient population further until the predicted outcome is reached. The path depth indicates how many splits were needed.",
      caveat:
        "The surrogate tree is a global approximation \u2014 it summarises the model with a single tree, which can lose detail for patients whose decision is driven by interactions the tree cannot represent.",
    },
    default: {
      title: "Decision Rules",
      description:
        "This explanation presents the model's prediction as a set of readable clinical conditions.",
      howToRead:
        "Each condition describes a feature threshold. When all conditions are met, the model predicts the shown outcome.",
      caveat:
        "Rules are simplified representations of a complex model and may not capture every factor.",
    },
  },
};

const nl: RuleBasedMessages = {
  operators: {
    lte: "is hoogstens",
    gte: "is minstens",
    lt: "is lager dan",
    gt: "is hoger dan",
    eq: "is gelijk aan",
    neq: "is niet",
  },

  narrative: {
    leadIn: "Het model voorspelt deze uitkomst omdat de ",
    and: " en ",
    finalAnd: " en ",
    listSeparator: ", ",
    outcomeSuffix: (outcome) =>
      ` Samen leiden deze factoren tot een voorspelling van "${outcome}".`,
    rulefitLeadIn:
      "Het model combineert meerdere klinische patronen om tot deze voorspelling te komen.",
    riskRaisingHeader: "Factoren die het risico verhogen:",
    riskLoweringHeader: "Factoren die het risico verlagen:",
    rulefitWhen: (clauseText, direction) =>
      direction === "raise"
        ? `\u2022 Wanneer ${clauseText} \u2014 dit verhoogt de risicoscore.`
        : `\u2022 Wanneer ${clauseText} \u2014 dit verlaagt de risicoscore.`,
    rulefitOutcomeSuffix: (outcome) =>
      `Per saldo leiden deze patronen tot een voorspelling van "${outcome}".`,
  },

  condition: {
    isPresent: "is aanwezig",
    isAbsent: "is afwezig",
    applies: "van toepassing is",
    notRecorded: "(niet vastgelegd voor deze patiënt)",
    belowTypical: "is lager dan gebruikelijk voor deze groep",
    aboveTypical: "is hoger dan gebruikelijk voor deze groep",
    nearTypical: "ligt rond de gebruikelijke waarde",
    outcomeWarning: "uitkomstvariabele",
  },

  ui: {
    conditionsCount: (n) => `${n} voorwaarde${n !== 1 ? "n" : ""}`,
    firingRulesCount: (n) => `${n} actieve regel${n !== 1 ? "s" : ""}`,
    showTechnical: "Technische notatie tonen",
    showClinical: "Klinische samenvatting tonen",
    prediction: "Voorspelling",
    keyFactors: "Belangrijkste klinische factoren",
    contributingPatterns: "Bijdragende klinische patronen",
    showAll: (n) => `Alle ${n} patronen tonen \u25be`,
    showFewer: "Minder tonen \u25b4",
    rawRuleText: "Originele regeltekst \u25b8",
    conditionsHeader: "Voorwaarden (ALS \u2026 DAN)",
    thenLabel: "DAN",
    firingRulesHeader: "Actieve regels (gewogen)",
    rangeIndicator: "Bereikindicator",
    rangeIndicatorHint:
      "Blauwe vulling = bereik dat aan de voorwaarde voldoet. Lijn = drempelwaarde.",
    binaryFeatures: "Binaire kenmerken",
    conditionConfirmed: "Voorwaarde bevestigd",
    conditionAbsent: "Voorwaarde niet aanwezig",
    qualityMetrics: "Kwaliteitsmaten",
    parameters: "Parameters",
    noiseScale: "Ruisniveau",
    activeRules: "Actieve regels",
    legend: "Legenda",
    lowersRisk: "Verlaagt risico",
    raisesRisk: "Verhoogt risico",
    seenInPercent: (pct) => `Voorkomend bij ${pct.toFixed(0)}% van de patiënten`,
    supportLabel: (pct) => `dekking: ${pct.toFixed(0)}%`,

    fidelityDesc:
      "Hoe goed deze regel overeenkomt met wat het model daadwerkelijk doet. Hoger is beter.",
    fidelityLabel: "Fideliteit",

    localFidelityLabel: "Lokale fideliteit",
    localFidelityDesc:
      "Hoe goed deze regel het modelgedrag weerspiegelt bij patiënten die op deze lijken. Hoger is beter. In tegenstelling tot globale fideliteit wordt dit alleen gemeten op een lokale buurt.",

    precisionDesc:
      "Hoe vaak de voorspelling klopt wanneer aan deze voorwaarden is voldaan.",
    coverageDesc:
      "Welk deel van de patiënten onder deze regel valt. Lager betekent specifieker voor deze patiënt.",
    precisionLabel: "Precisie",
    coverageLabel: "Dekking",

    anchorsConfidenceHeader: "Vertrouwen in het anker",
    anchorsConfidenceStatement: (precision, coverage) => {
      const parts: string[] = [];
      if (precision != null && !Number.isNaN(precision)) {
        parts.push(
          `Wanneer aan deze voorwaarden is voldaan, blijft de voorspelling in ongeveer ${pctNl(precision)} van de gevallen hetzelfde.`,
        );
      }
      if (coverage != null && !Number.isNaN(coverage)) {
        parts.push(
          `Deze regel geldt voor ongeveer ${pctNl(coverage)} van de vergelijkbare patiënten uit het trainingscohort.`,
        );
      }
      return parts.join(" ");
    },

    decisionPathHeader: (depth) =>
      depth > 0
        ? `Beslispad \u2014 diepte ${depth}`
        : `Beslispad`,
    treePathDepth: (depth) => `diepte ${depth}`,
    treePathAria: (depth) =>
      `Beslispad door de boom met ${depth} splitsing${depth !== 1 ? "en" : ""}`,

    sumOfContributions: (sum, outcome) =>
      outcome
        ? `Deze patronen tellen op tot een netto bijdrage van ${signed(sum)}, wat leidt tot een voorspelling van "${outcome}".`
        : `Deze patronen tellen op tot een netto bijdrage van ${signed(sum)}.`,
    sumOfContributionsTechnical: (sum) =>
      `\u03A3 coef = ${signed(sum)}`,

    noData: "Geen regelgebaseerde gegevens",
    scaledValueCaveat:
      "Dit kenmerk wordt weergegeven ten opzichte van de gebruikelijke waarde, omdat het model een getransformeerde schaal gebruikt zonder directe klinische betekenis.",
  },

  methods: {
    lore: {
      title: "Beslisregel (LORE)",
      description:
        'Deze verklaring toont een set klinische voorwaarden die beschrijven waarom het model deze voorspelling deed. Denk aan: "patiënten met deze kenmerken krijgen meestal deze uitkomst."',
      howToRead:
        "Elke rij toont één klinische factor en de drempelwaarde die voor deze patiënt relevant was. De blauwe balk laat zien aan welke kant van de drempel de voorwaarde is voldaan. De lokale fideliteitsscore geeft aan hoe betrouwbaar deze regel het modelgedrag bij vergelijkbare patiënten weerspiegelt.",
      caveat:
        "Deze regel is opgebouwd uit een lokale surrogaatboom rond deze patiënt \u2014 hij vangt de belangrijkste patronen vlak bij dit geval maar geldt mogelijk niet voor zeer afwijkende patiënten.",
    },
    rulefit: {
      title: "Gecombineerde regels (RuleFit)",
      description:
        "Meerdere klinische patronen werken samen om tot de voorspelling te komen. Elk patroon beschrijft een combinatie van bevindingen, en de richting laat zien of het patroon richting lager of hoger risico duwt.",
      howToRead:
        "Groene (\u2193) patronen verlagen de risicoschatting; rode (\u2191) patronen verhogen deze. De balkbreedte geeft het relatieve gewicht van elk patroon weer. De som van alle gewichten bepaalt de voorspelling.",
      caveat:
        "Deze patronen benaderen het redeneren van het model. In werkelijkheid evalueert het model alle kenmerken tegelijk in plaats van regels één voor één toe te passen.",
    },
    anchors: {
      title: "Verankerende voorwaarden (Anchors)",
      description:
        'Dit zijn de kernvoorwaarden die deze voorspelling "verankeren" \u2014 zolang deze gelden, blijft de voorspelling hetzelfde, ongeacht andere kenmerken.',
      howToRead:
        "Precisie geeft aan hoe betrouwbaar het anker is: 95% betekent dat de voorspelling 95 van de 100 keer klopt wanneer aan deze voorwaarden is voldaan. Dekking geeft aan op hoeveel patiënten dit anker breed van toepassing is.",
      caveat:
        "Een zeer precies anker met lage dekking betekent dat de regel betrouwbaar maar vrij specifiek voor het profiel van deze patiënt is.",
    },
    surrogateTree: {
      title: "Beslispad (surrogaatboom)",
      description:
        "Deze verklaring volgt één pad van wortel naar blad door een vereenvoudigde beslisboom die het model benadert. De voorwaarden langs het pad beschrijven waarom deze patiënt in dit blad uitkomt.",
      howToRead:
        "Lees de voorwaarden in volgorde, van de wortel van de boom naar het blad. Elke splitsing versmalt de patiëntpopulatie verder totdat de voorspelde uitkomst wordt bereikt. De padlengte geeft aan hoeveel splitsingen nodig waren.",
      caveat:
        "De surrogaatboom is een globale benadering \u2014 hij vat het model samen in één boom, wat detail kan verliezen voor patiënten van wie de beslissing wordt gedreven door interacties die de boom niet kan weergeven.",
    },
    default: {
      title: "Beslisregels",
      description:
        "Deze verklaring presenteert de voorspelling van het model als een set leesbare klinische voorwaarden.",
      howToRead:
        "Elke voorwaarde beschrijft een drempel voor een kenmerk. Wanneer aan alle voorwaarden is voldaan, voorspelt het model de getoonde uitkomst.",
      caveat:
        "Regels zijn vereenvoudigde weergaven van een complex model en kunnen niet elke factor vangen.",
    },
  },
};

export const RULE_BASED_MESSAGES: Record<Locale, RuleBasedMessages> = {
  en,
  nl,
};

export function getMessages(locale: Locale): RuleBasedMessages {
  return RULE_BASED_MESSAGES[locale] ?? RULE_BASED_MESSAGES.en;
}