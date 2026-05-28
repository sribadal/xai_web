type Features = Record<string, unknown>;

const SEX: Record<number, string> = { 1: "male", 2: "female" };

function ageBand(code: number | undefined): string | null {
  if (code == null) return null;
  const lower = (code - 4) * 5 + 15;
  if (lower < 15 || lower > 105) return null;
  return `${lower}–${lower + 4} years old`;
}

const MORPH_NOUN: Record<number, string> = {
  10: "adenocarcinoma",
  11: "probable adenocarcinoma",
  12: "cholangiocarcinoma",
  13: "squamous-cell carcinoma",
  14: "osteoclastic giant-cell tumour",
};

const DIFFGRAD: Record<number, string> = {
  1: "well differentiated",
  2: "moderately differentiated",
  3: "poorly differentiated",
  4: "undifferentiated",
};

const TOPO: Record<string, string> = {
  C250: "head of the pancreas",
  C251: "body of the pancreas",
  C252: "tail of the pancreas",
  C253: "pancreatic duct",
  C257: "other specified part of the pancreas",
  C258: "overlapping pancreatic regions",
  C259: "pancreas (not otherwise specified)",
};

const META_SITES: { key: string; label: string }[] = [
  { key: "meta_lever", label: "liver" },
  { key: "meta_long", label: "lungs" },
  { key: "meta_perit", label: "peritoneum" },
  { key: "meta_bot", label: "bone" },
  { key: "meta_lymf", label: "distant lymph nodes" },
  { key: "meta_hersenen", label: "brain" },
  { key: "meta_bijnier", label: "adrenal glands" },
  { key: "meta_overig", label: "other sites" },
];

const CCI: Record<number, string> = {
  0: "no recorded comorbidities",
  1: "one comorbidity category",
  2: "≥2 comorbidity categories",
};

const HORIZON_LABEL: Record<string, string> = {
  "3_months": "3 months",
  "6_months": "6 months",
  "12_months": "12 months",
};

const QOL_HORIZON_LABEL: Record<string, string> = {
  "1_month": "1 month",
  "3_months": "3 months",
  "6_months": "6 months",
  "9_months": "9 months",
  "12_months": "12 months",
};

function num(f: Features, key: string): number | undefined {
  const v = f[key];
  return typeof v === "number" ? v : undefined;
}

function str(f: Features, key: string): string | undefined {
  const v = f[key];
  return typeof v === "string" ? v : undefined;
}

function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function article(noun: string): string {
  return /^[aeiou]/i.test(noun) ? "an" : "a";
}

export function generatePatientNarrative(featuresRaw: unknown): string[] {
  if (!featuresRaw || typeof featuresRaw !== "object") {
    return ["No patient information is available for this case."];
  }
  const f = featuresRaw as Features;
  const paragraphs: string[] = [];

  const ageStr = ageBand(num(f, "leeft_cat"));
  const sexStr = SEX[num(f, "gesl") ?? -1];
  const cciStr = CCI[num(f, "cci_cat") ?? -1];

  const subject =
    ageStr && sexStr
      ? `a ${sexStr} aged ${ageStr}`
      : sexStr
        ? sexStr
        : ageStr
          ? `aged ${ageStr}`
          : null;

  if (subject) {
    const trail = cciStr ? ` with ${cciStr}` : "";
    paragraphs.push(`This patient is ${subject}${trail}.`);
  } else if (cciStr) {
    paragraphs.push(`This patient has ${cciStr}.`);
  }

  const morphNoun = MORPH_NOUN[num(f, "morf_cat") ?? -1];
  const diff = DIFFGRAD[num(f, "diffgrad") ?? -1];
  const topo = TOPO[str(f, "topo_sublok") ?? ""];
  const stage = str(f, "stadium");
  const sites = META_SITES.filter((s) => num(f, s.key) === 1).map(
    (s) => s.label,
  );

  let tumourClause: string;
  if (morphNoun && diff) {
    tumourClause = `The tumour is ${article(diff)} ${diff} ${morphNoun}`;
  } else if (morphNoun) {
    tumourClause = `The tumour is ${article(morphNoun)} ${morphNoun}`;
  } else if (diff) {
    tumourClause = `The tumour is ${article(diff)} ${diff} tumour`;
  } else {
    tumourClause = "The tumour";
  }

  const tumourTail: string[] = [];
  if (topo) tumourTail.push(`in the ${topo}`);
  if (stage && stage !== "X" && stage !== "M") {
    tumourTail.push(`(stage ${stage})`);
  }
  if (sites.length > 0) {
    tumourTail.push(`with ${joinList(sites)} metastases`);
  }

  if (tumourClause !== "The tumour" || tumourTail.length > 0) {
    const fullClause = [tumourClause, ...tumourTail]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    paragraphs.push(fullClause + ".");
  }

  if (paragraphs.length === 0) {
    paragraphs.push("Patient information is incomplete.");
  }

  return paragraphs;
}

export function generateModelOutputSummary(
  prediction: unknown,
  modelType: string,
  timeHorizon?: string,
): string {
  if (!prediction || typeof prediction !== "object") {
    return "The model has no prediction for this patient.";
  }
  const p = prediction as Record<string, unknown>;
  const risk = typeof p.risk_score === "number" ? p.risk_score : null;
  if (modelType === "condor") {
    if (timeHorizon && QOL_HORIZON_LABEL[timeHorizon]) {
      const label = QOL_HORIZON_LABEL[timeHorizon];
      const qol =
        typeof p[`qol_${timeHorizon}`] === "number"
          ? (p[`qol_${timeHorizon}`] as number)
          : null;
      if (qol != null) {
        return `The model predicts a quality-of-life score of ${qol.toFixed(1)} at ${label} (0–100, higher is better).`;
      }
    }
    const baseline =
      typeof p.qol_baseline === "number" ? (p.qol_baseline as number) : risk;
    if (baseline == null) return "The model produced no quality-of-life score.";
    return `The model predicts a baseline quality-of-life score of ${baseline.toFixed(1)} (0–100, higher is better).`;
  }
  
  if (timeHorizon && HORIZON_LABEL[timeHorizon]) {
    const label = HORIZON_LABEL[timeHorizon];
    const mortKey = `mortality_risk_${timeHorizon}`;
    const survKey = `survival_prob_${timeHorizon}`;
    const mort = typeof p[mortKey] === "number" ? (p[mortKey] as number) : null;
    const surv = typeof p[survKey] === "number" ? (p[survKey] as number) : null;
    if (mort != null && surv != null) {
      return `The model predicts a ${(mort * 100).toFixed(0)}% probability of death within ${label}, corresponding to ${(surv * 100).toFixed(0)}% survival.`;
    }
    if (mort != null) {
      return `The model predicts a ${(mort * 100).toFixed(0)}% probability of death within ${label}.`;
    }
    if (surv != null) {
      return `The model predicts a ${(surv * 100).toFixed(0)}% probability of survival at ${label}.`;
    }
  }
  if (risk == null) return "The model produced no risk score.";
  const surv3 =
    typeof p.survival_prob_3_months === "number"
      ? p.survival_prob_3_months
      : null;
  let s = `The model predicts a mortality risk score of ${risk.toFixed(2)}`;
  if (surv3 != null)
    s += `, with an estimated ${(surv3 * 100).toFixed(0)}% probability of survival at 3 months`;
  return s + ".";
}