type Features = Record<string, unknown>;

const SEX: Record<number, Record<string, string>> = {
  1: { en: "male", nl: "man" },
  2: { en: "female", nl: "vrouw" },
};

function ageBand(code: number | undefined, locale: string): string | null {
  if (code == null) return null;
  const lower = (code - 4) * 5 + 15;
  if (lower < 15 || lower > 105) return null;
  return locale === "nl"
    ? `${lower}–${lower + 4} jaar oud`
    : `${lower}–${lower + 4} years old`;
}

const MORPH_NOUN: Record<number, Record<string, string>> = {
  10: { en: "adenocarcinoma", nl: "adenocarcinoom" },
  11: { en: "probable adenocarcinoma", nl: "waarschijnlijk adenocarcinoom" },
  12: { en: "cholangiocarcinoma", nl: "cholangiocarcinoom" },
  13: { en: "squamous-cell carcinoma", nl: "plaveiselcelcarcinoom" },
  14: { en: "osteoclastic giant-cell tumour", nl: "osteoclastische reuzenceltumor" },
};

const DIFFGRAD: Record<number, Record<string, string>> = {
  1: { en: "well differentiated", nl: "goed gedifferentieerd" },
  2: { en: "moderately differentiated", nl: "matig gedifferentieerd" },
  3: { en: "poorly differentiated", nl: "slecht gedifferentieerd" },
  4: { en: "undifferentiated", nl: "ongedifferentieerd" },
};

const TOPO: Record<string, Record<string, string>> = {
  C250: { en: "head of the pancreas", nl: "kop van de alvleesklier" },
  C251: { en: "body of the pancreas", nl: "lichaam van de alvleesklier" },
  C252: { en: "tail of the pancreas", nl: "staart van de alvleesklier" },
  C253: { en: "pancreatic duct", nl: "ductus pancreaticus" },
  C257: { en: "other specified part of the pancreas", nl: "ander gespecificeerd deel van de alvleesklier" },
  C258: { en: "overlapping pancreatic regions", nl: "overlappende regio's van de alvleesklier" },
  C259: { en: "pancreas (not otherwise specified)", nl: "alvleesklier (niet nader gespecificeerd)" },
};

const META_SITES: { key: string; label: Record<string, string> }[] = [
  { key: "meta_lever", label: { en: "liver", nl: "lever" } },
  { key: "meta_long", label: { en: "lungs", nl: "longen" } },
  { key: "meta_perit", label: { en: "peritoneum", nl: "buikvlies" } },
  { key: "meta_bot", label: { en: "bone", nl: "bot" } },
  { key: "meta_lymf", label: { en: "distant lymph nodes", nl: "lymfeklieren op afstand" } },
  { key: "meta_hersenen", label: { en: "brain", nl: "hersenen" } },
  { key: "meta_bijnier", label: { en: "adrenal glands", nl: "bijnieren" } },
  { key: "meta_overig", label: { en: "other sites", nl: "overige locaties" } },
];

const CCI: Record<number, Record<string, string>> = {
  0: { en: "no recorded comorbidities", nl: "geen geregistreerde comorbiditeiten" },
  1: { en: "one comorbidity category", nl: "één comorbiditeit" },
  2: { en: "≥2 comorbidity categories", nl: "≥2 comorbiditeiten" },
};

const HORIZON_LABEL: Record<string, Record<string, string>> = {
  "3_months": { en: "3 months", nl: "3 maanden" },
  "6_months": { en: "6 months", nl: "6 maanden" },
  "12_months": { en: "12 months", nl: "12 maanden" },
};

const QOL_HORIZON_LABEL: Record<string, Record<string, string>> = {
  "1_month": { en: "1 month", nl: "1 maand" },
  "3_months": { en: "3 months", nl: "3 maanden" },
  "6_months": { en: "6 months", nl: "6 maanden" },
  "9_months": { en: "9 months", nl: "9 maanden" },
  "12_months": { en: "12 months", nl: "12 maanden" },
};

function num(f: Features, key: string): number | undefined {
  const v = f[key];
  return typeof v === "number" ? v : undefined;
}

function str(f: Features, key: string): string | undefined {
  const v = f[key];
  return typeof v === "string" ? v : undefined;
}

function joinList(items: string[], locale: string): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  const conj = locale === "nl" ? "en" : "and";
  if (items.length === 2) return `${items[0]} ${conj} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, ${conj} ${items[items.length - 1]}`;
}

function article(noun: string, locale: string): string {
  if (locale === "nl") return "een";
  return /^[aeiou]/i.test(noun) ? "an" : "a";
}

// ---------------------------------------------------------------------------
// Narrative templates per locale
// ---------------------------------------------------------------------------

const NARR = {
  en: {
    noInfo: "No patient information is available for this case.",
    incomplete: "Patient information is incomplete.",
    subjectWith: (subj: string, cci: string) => `This patient is ${subj} with ${cci}.`,
    subject: (subj: string) => `This patient is ${subj}.`,
    cciOnly: (cci: string) => `This patient has ${cci}.`,
    tumourBase: "The tumour",
    metastases: "metastases",
    stage: (s: string) => `(stage ${s})`,
    inThe: "in the",
    with: "with",
  },
  nl: {
    noInfo: "Er is geen patiëntinformatie beschikbaar voor deze casus.",
    incomplete: "Patiëntinformatie is onvolledig.",
    subjectWith: (subj: string, cci: string) => `Deze patiënt is ${subj} met ${cci}.`,
    subject: (subj: string) => `Deze patiënt is ${subj}.`,
    cciOnly: (cci: string) => `Deze patiënt heeft ${cci}.`,
    tumourBase: "De tumor",
    metastases: "metastasen",
    stage: (s: string) => `(stadium ${s})`,
    inThe: "in de",
    with: "met",
  },
} as const;

const MODEL_T = {
  en: {
    noPrediction: "The model has no prediction for this patient.",
    noQol: "The model produced no quality-of-life score.",
    noRisk: "The model produced no risk score.",
    qolAt: (score: string, label: string) =>
      `The model predicts a quality-of-life score of ${score} at ${label} (0–100, higher is better).`,
    qolBaseline: (score: string) =>
      `The model predicts a baseline quality-of-life score of ${score} (0–100, higher is better).`,
    mortAndSurv: (mort: string, label: string, surv: string) =>
      `The model predicts a ${mort}% probability of death within ${label}, corresponding to ${surv}% survival.`,
    mortOnly: (mort: string, label: string) =>
      `The model predicts a ${mort}% probability of death within ${label}.`,
    survOnly: (surv: string, label: string) =>
      `The model predicts a ${surv}% probability of survival at ${label}.`,
    riskScore: (score: string) =>
      `The model predicts a mortality risk score of ${score}`,
    riskWithSurv: (score: string, surv: string) =>
      `The model predicts a mortality risk score of ${score}, with an estimated ${surv}% probability of survival at 3 months.`,
  },
  nl: {
    noPrediction: "Het model heeft geen voorspelling voor deze patiënt.",
    noQol: "Het model heeft geen kwaliteit-van-levenscore geproduceerd.",
    noRisk: "Het model heeft geen risicoscore geproduceerd.",
    qolAt: (score: string, label: string) =>
      `Het model voorspelt een kwaliteit-van-levenscore van ${score} op ${label} (0–100, hoger is beter).`,
    qolBaseline: (score: string) =>
      `Het model voorspelt een baseline kwaliteit-van-levenscore van ${score} (0–100, hoger is beter).`,
    mortAndSurv: (mort: string, label: string, surv: string) =>
      `Het model voorspelt ${mort}% kans op overlijden binnen ${label}, overeenkomend met ${surv}% overleving.`,
    mortOnly: (mort: string, label: string) =>
      `Het model voorspelt ${mort}% kans op overlijden binnen ${label}.`,
    survOnly: (surv: string, label: string) =>
      `Het model voorspelt ${surv}% kans op overleving op ${label}.`,
    riskScore: (score: string) =>
      `Het model voorspelt een mortaliteitsrisicoscore van ${score}`,
    riskWithSurv: (score: string, surv: string) =>
      `Het model voorspelt een mortaliteitsrisicoscore van ${score}, met een geschatte ${surv}% kans op overleving na 3 maanden.`,
  },
} as const;

// ---------------------------------------------------------------------------
// Patient narrative
// ---------------------------------------------------------------------------

export function generatePatientNarrative(
  featuresRaw: unknown,
  locale: string = "en",
): string[] {
  const lang = locale === "nl" ? "nl" : "en";
  const n = NARR[lang];

  if (!featuresRaw || typeof featuresRaw !== "object") {
    return [n.noInfo];
  }
  const f = featuresRaw as Features;
  const paragraphs: string[] = [];

  const ageStr = ageBand(num(f, "leeft_cat"), lang);
  const sexStr = SEX[num(f, "gesl") ?? -1]?.[lang];
  const cciStr = CCI[num(f, "cci_cat") ?? -1]?.[lang];

  const subject =
    lang === "nl"
      ? ageStr && sexStr
        ? `een ${sexStr} van ${ageStr}`
        : sexStr
          ? `een ${sexStr}`
          : ageStr
            ? `${ageStr}`
            : null
      : ageStr && sexStr
        ? `a ${sexStr} aged ${ageStr}`
        : sexStr
          ? sexStr
          : ageStr
            ? `aged ${ageStr}`
            : null;

  if (subject) {
    paragraphs.push(cciStr ? n.subjectWith(subject, cciStr) : n.subject(subject));
  } else if (cciStr) {
    paragraphs.push(n.cciOnly(cciStr));
  }

  const morphNoun = MORPH_NOUN[num(f, "morf_cat") ?? -1]?.[lang];
  const diff = DIFFGRAD[num(f, "diffgrad") ?? -1]?.[lang];
  const topo = TOPO[str(f, "topo_sublok") ?? ""]?.[lang];
  const stage = str(f, "stadium");
  const sites = META_SITES.filter((s) => num(f, s.key) === 1).map(
    (s) => s.label[lang],
  );

  let tumourClause: string;
  if (morphNoun && diff) {
    tumourClause = `${n.tumourBase} is ${article(diff, lang)} ${diff} ${morphNoun}`;
  } else if (morphNoun) {
    tumourClause = `${n.tumourBase} is ${article(morphNoun, lang)} ${morphNoun}`;
  } else if (diff) {
    const noun = lang === "nl" ? "tumor" : "tumour";
    tumourClause = `${n.tumourBase} is ${article(diff, lang)} ${diff} ${noun}`;
  } else {
    tumourClause = n.tumourBase;
  }

  const tumourTail: string[] = [];
  if (topo) tumourTail.push(`${n.inThe} ${topo}`);
  if (stage && stage !== "X" && stage !== "M") {
    tumourTail.push(n.stage(stage));
  }
  if (sites.length > 0) {
    tumourTail.push(`${n.with} ${joinList(sites, lang)} ${n.metastases}`);
  }

  if (tumourClause !== n.tumourBase || tumourTail.length > 0) {
    const fullClause = [tumourClause, ...tumourTail]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    paragraphs.push(fullClause + ".");
  }

  if (paragraphs.length === 0) {
    paragraphs.push(n.incomplete);
  }

  return paragraphs;
}

// ---------------------------------------------------------------------------
// Model output summary
// ---------------------------------------------------------------------------

export function generateModelOutputSummary(
  prediction: unknown,
  modelType: string,
  timeHorizon?: string,
  locale: string = "en",
): string {
  const lang = locale === "nl" ? "nl" : "en";
  const t = MODEL_T[lang];

  if (!prediction || typeof prediction !== "object") {
    return t.noPrediction;
  }
  const p = prediction as Record<string, unknown>;
  const risk = typeof p.risk_score === "number" ? p.risk_score : null;

  if (modelType === "condor") {
    if (timeHorizon && QOL_HORIZON_LABEL[timeHorizon]) {
      const label = QOL_HORIZON_LABEL[timeHorizon][lang];
      const qol =
        typeof p[`qol_${timeHorizon}`] === "number"
          ? (p[`qol_${timeHorizon}`] as number)
          : null;
      if (qol != null) {
        return t.qolAt(qol.toFixed(1), label);
      }
    }
    const baseline =
      typeof p.qol_baseline === "number" ? (p.qol_baseline as number) : risk;
    if (baseline == null) return t.noQol;
    return t.qolBaseline(baseline.toFixed(1));
  }

  if (timeHorizon && HORIZON_LABEL[timeHorizon]) {
    const label = HORIZON_LABEL[timeHorizon][lang];
    const mortKey = `mortality_risk_${timeHorizon}`;
    const survKey = `survival_prob_${timeHorizon}`;
    const mort = typeof p[mortKey] === "number" ? (p[mortKey] as number) : null;
    const surv = typeof p[survKey] === "number" ? (p[survKey] as number) : null;
    if (mort != null && surv != null) {
      return t.mortAndSurv((mort * 100).toFixed(0), label, (surv * 100).toFixed(0));
    }
    if (mort != null) {
      return t.mortOnly((mort * 100).toFixed(0), label);
    }
    if (surv != null) {
      return t.survOnly((surv * 100).toFixed(0), label);
    }
  }

  if (risk == null) return t.noRisk;
  const surv3 =
    typeof p.survival_prob_3_months === "number"
      ? p.survival_prob_3_months
      : null;
  if (surv3 != null) {
    return t.riskWithSurv(risk.toFixed(2), (surv3 * 100).toFixed(0));
  }
  return t.riskScore(risk.toFixed(2)) + ".";
}