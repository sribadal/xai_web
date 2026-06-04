export type Tone = "neutral" | "good" | "warn" | "bad" | "muted";

export type Decoded = {
  text: string;
  detail?: string;
  tone?: Tone;
};

const D = {
  en: {
    days: (n: number) => `${n} days`,
    months: (n: number) => `${n} months`,
    years: (n: string) => `${n} years`,
    alive: "Alive",
    died: "Died",
    at: (t: string) => `at ${t}`,
    lastSeenAt: (t: string) => `last seen at ${t}`,
    startedAt: (t: string) => `started at ${t}`,
    noRecurrence: "No recurrence",
    recurred: "Recurred",
    diedBeforeRecurrence: "Died before recurrence",
    followUp: (t: string) => `(${t} follow-up)`,
    stable: "Stable",
    progressed: "Progressed",
    diedBeforeProgression: "Died before progression",
    yes: "Yes",
    no: "No",
    diedWithin6m: "(died within 6 months)",
    received: "Received",
    noneGiven: "None given",
    none: "None",
    surgeryPerformed: "Surgery performed",
    surgeryType: (n: number) => `Surgery type ${n}`,
    radiotherapy: "Radiotherapy",
    preOp: "(pre-op)",
    postOp: "(post-op)",
    periOp: "(peri-op)",
    noSurgery: "(no surgery)",
    chemotherapy: "Chemotherapy",
    cycles: (n: number) => `${n} cycles`,
  },
  nl: {
    at: (t: string) => `na ${t}`,
    lastSeenAt: (t: string) => `laatst gezien na ${t}`,
    startedAt: (t: string) => `gestart na ${t}`,
    days: (n: number) => `${n} dagen`,
    months: (n: number) => `${n} maanden`,
    years: (n: string) => `${n} jaar`,
    alive: "In leven",
    died: "Overleden",
    noRecurrence: "Geen recidief",
    recurred: "Recidief",
    diedBeforeRecurrence: "Overleden vóór recidief",
    followUp: (t: string) => `(${t} follow-up)`,
    stable: "Stabiel",
    progressed: "Progressie",
    diedBeforeProgression: "Overleden vóór progressie",
    yes: "Ja",
    no: "Nee",
    diedWithin6m: "(overleden binnen 6 maanden)",
    received: "Ontvangen",
    noneGiven: "Niet gegeven",
    none: "Geen",
    surgeryPerformed: "Chirurgie uitgevoerd",
    surgeryType: (n: number) => `Chirurgietype ${n}`,
    radiotherapy: "Radiotherapie",
    preOp: "(pre-operatief)",
    postOp: "(postoperatief)",
    periOp: "(peri-operatief)",
    noSurgery: "(geen chirurgie)",
    chemotherapy: "Chemotherapie",
    cycles: (n: number) => `${n} cycli`,
  },
} as const;

type DT = (typeof D)[keyof typeof D];

function getT(locale?: string): DT {
  return D[locale as keyof typeof D] ?? D.en;
}

export function formatDays(days: unknown, locale?: string): string {
  const t = getT(locale);
  if (typeof days !== "number" || !Number.isFinite(days)) return "—";
  if (days < 30) return t.days(Math.round(days));
  if (days < 365) return t.months(Math.round(days / 30.44));
  return t.years((days / 365.25).toFixed(1));
}

const SURGERY_TYPE_LABELS: Record<number, Record<string, string>> = {
  21: { en: "Whipple procedure", nl: "Whipple-procedure" },
  22: { en: "Pylorus-preserving Whipple", nl: "Pylorussparende Whipple" },
  23: {
    en: "Other partial pancreatectomy",
    nl: "Andere partiële pancreatectomie",
  },
  25: { en: "Distal pancreatectomy", nl: "Distale pancreatectomie" },
  26: { en: "Total pancreatectomy", nl: "Totale pancreatectomie" },
};

const SURGERY_TECH_LABELS: Record<number, Record<string, string>> = {
  0: { en: "open", nl: "open" },
  1: { en: "keyhole", nl: "laparoscopisch" },
  3: { en: "robot-assisted", nl: "robotgeassisteerd" },
  9: { en: "unknown technique", nl: "onbekende techniek" },
};

const SURGERY_MARGIN_LABELS: Record<number, Record<string, string>> = {
  0: { en: "R0 margin", nl: "R0-marge" },
  1: { en: "R1 margin", nl: "R1-marge" },
  2: { en: "R2 margin", nl: "R2-marge" },
  9: { en: "unknown margin", nl: "onbekende marge" },
};

const RT_TYPE_LABELS: Record<number, Record<string, string>> = {
  1: { en: "Chemoradiation", nl: "Chemoradiatie" },
  3: { en: "SBRT", nl: "SBRT" },
  7: { en: "Other RT", nl: "Andere RT" },
};

const ATC_LABELS: Record<string, string> = {
  L01BC02: "5-FU (fluorouracil)",
  L01BC05: "Gemcitabine",
  L01BC06: "Capecitabine",
  L01CD01: "Paclitaxel",
  L01CD02: "Docetaxel",
  L01CD51: "Nab-paclitaxel",
  L01XA01: "Cisplatin",
  L01XA02: "Carboplatin",
  L01XA03: "Oxaliplatin",
  L01XX19: "Irinotecan",
  L01XX24: "Pemetrexed",
};

const THERAPY_REASON_LABELS: Record<number, Record<string, string>> = {
  11: { en: "patient too unwell", nl: "patiënt te ziek" },
  12: { en: "cancer too advanced", nl: "kanker te ver gevorderd" },
  13: { en: "patient declined", nl: "patiënt weigerde" },
  14: { en: "tumour burden too low", nl: "tumorlast te laag" },
  9: { en: "unknown reason", nl: "onbekende reden" },
};

function pickLabel(
  map: Record<number, Record<string, string>>,
  key: number,
  locale?: string,
): string | undefined {
  const entry = map[key];
  if (!entry) return undefined;
  const lang = locale === "nl" ? "nl" : "en";
  return entry[lang] ?? entry.en;
}

export function decodeSurvival(
  record: Record<string, unknown>,
  locale?: string,
): Decoded {
  const t = getT(locale);
  const status = record.vit_stat;
  const days = record.vit_stat_int;
  if (status == null) return { text: "—" };
  if (status === 0) {
    return {
      text: t.alive,
      detail:
        typeof days === "number"
          ? t.lastSeenAt(formatDays(days, locale))
          : undefined,
      tone: "good",
    };
  }
  if (status === 1) {
    const detail =
      typeof days === "number" ? t.at(formatDays(days, locale)) : undefined;
    let tone: Tone = "bad";
    if (typeof days === "number") {
      if (days >= 730) tone = "muted";
      else if (days >= 180) tone = "warn";
    }
    return { text: t.died, detail, tone };
  }
  return { text: String(status) };
}

export function decodeRecurrence(
  record: Record<string, unknown>,
  locale?: string,
): Decoded {
  const t = getT(locale);
  const event = record.rfs_event;
  const days = record.rfs_int;
  if (event == null) return { text: "—" };
  if (event === 0) {
    return {
      text: t.noRecurrence,
      detail:
        typeof days === "number"
          ? t.followUp(formatDays(days, locale))
          : undefined,
      tone: "good",
    };
  }
  if (event === 1) {
    return {
      text: t.recurred,
      detail:
        typeof days === "number" ? t.at(formatDays(days, locale)) : undefined,
      tone: "bad",
    };
  }
  if (event === 2) {
    return {
      text: t.diedBeforeRecurrence,
      detail:
        typeof days === "number" ? t.at(formatDays(days, locale)) : undefined,
      tone: "warn",
    };
  }
  return { text: String(event) };
}

export function decodeProgression(
  record: Record<string, unknown>,
  locale?: string,
): Decoded {
  const t = getT(locale);
  const event = record.pfs_event;
  const days = record.pfs_int;
  if (event == null) return { text: "—" };
  if (event === 0) {
    return {
      text: t.stable,
      detail:
        typeof days === "number"
          ? t.followUp(formatDays(days, locale))
          : undefined,
      tone: "good",
    };
  }
  if (event === 1) {
    return {
      text: t.progressed,
      detail:
        typeof days === "number" ? t.at(formatDays(days, locale)) : undefined,
      tone: "bad",
    };
  }
  if (event === 2) {
    return {
      text: t.diedBeforeProgression,
      detail:
        typeof days === "number" ? t.at(formatDays(days, locale)) : undefined,
      tone: "warn",
    };
  }
  return { text: String(event) };
}

export function decodeEarlyMortality(
  record: Record<string, unknown>,
  locale?: string,
): Decoded {
  const t = getT(locale);
  const v = record.dead_with_6months;
  if (v == null) return { text: "—" };
  if (v === 1) {
    return { text: t.yes, detail: t.diedWithin6m, tone: "bad" };
  }
  if (v === 0) {
    return { text: t.no, tone: "good" };
  }
  return { text: String(v) };
}

export function decodeTumorDirected(
  record: Record<string, unknown>,
  locale?: string,
): Decoded {
  const t = getT(locale);
  const v = record.tumgericht_ther;
  if (v == null) return { text: "—" };
  if (v === 1) return { text: t.received, tone: "neutral" };
  if (v === 0) {
    const reason = record.geen_ther_reden;
    if (typeof reason === "number") {
      const label = pickLabel(THERAPY_REASON_LABELS, reason, locale);
      if (label) {
        return { text: t.noneGiven, detail: `(${label})`, tone: "muted" };
      }
    }
    return { text: t.noneGiven, tone: "muted" };
  }
  return { text: String(v) };
}

export function decodeSurgery(
  record: Record<string, unknown>,
  locale?: string,
): Decoded {
  const t = getT(locale);
  const chir = record.chir;
  if (chir == null) return { text: "—" };
  if (chir === 0) return { text: t.none, tone: "muted" };
  if (chir === 1) {
    const type = record.chir_type1;
    const tech = record.chir_tech1;
    const margin = record.chir_rad1;
    const day = record.chir_int1;

    const typeLabel =
      typeof type === "number" && pickLabel(SURGERY_TYPE_LABELS, type, locale)
        ? pickLabel(SURGERY_TYPE_LABELS, type, locale)!
        : typeof type === "number"
          ? t.surgeryType(type)
          : t.surgeryPerformed;

    const techDetails: string[] = [];
    if (typeof tech === "number") {
      const tl = pickLabel(SURGERY_TECH_LABELS, tech, locale);
      if (tl) techDetails.push(tl);
    }
    if (typeof margin === "number") {
      const ml = pickLabel(SURGERY_MARGIN_LABELS, margin, locale);
      if (ml) techDetails.push(ml);
    }
    if (typeof day === "number") {
      techDetails.push(t.at(formatDays(day, locale)));
    }

    return {
      text: typeLabel,
      detail: techDetails.length > 0 ? techDetails.join(", ") : undefined,
      tone: "neutral",
    };
  }
  return { text: String(chir) };
}

export function decodeRadiotherapy(
  record: Record<string, unknown>,
  locale?: string,
): Decoded {
  const t = getT(locale);
  const rt = record.rt;
  if (rt == null) return { text: "—" };
  if (rt === 0) return { text: t.none, tone: "muted" };
  if (rt === 1 || rt === 2 || rt === 4) {
    const type = record.rt_type1;
    const day = record.rt_start_int1;
    const typeLabel =
      typeof type === "number" && pickLabel(RT_TYPE_LABELS, type, locale)
        ? pickLabel(RT_TYPE_LABELS, type, locale)!
        : t.radiotherapy;
    const tag =
      rt === 1 ? ` ${t.preOp}` : rt === 2 ? ` ${t.postOp}` : ` ${t.noSurgery}`;
    return {
      text: `${typeLabel}${tag}`,
      detail:
        typeof day === "number"
          ? t.startedAt(formatDays(day, locale))
          : undefined,
      tone: "neutral",
    };
  }
  return { text: String(rt) };
}

export function decodeSystemic(
  record: Record<string, unknown>,
  locale?: string,
): Decoded {
  const t = getT(locale);
  const chemo = record.chemo;
  if (chemo == null) return { text: "—" };
  if (chemo === 0) return { text: t.none, tone: "muted" };
  if (chemo === 1 || chemo === 2 || chemo === 3 || chemo === 4) {
    const drug = record.syst_code1;
    const cycles = record.syst_kuren1;
    const day = record.syst_start_int1;

    let drugLabel: string = t.chemotherapy;
    if (typeof drug === "string" && drug.length > 0) {
      drugLabel = ATC_LABELS[drug] || drug;
    }

    const tag =
      chemo === 1
        ? ` ${t.preOp}`
        : chemo === 2
          ? ` ${t.postOp}`
          : chemo === 3
            ? ` ${t.periOp}`
            : ` ${t.noSurgery}`;

    const detailParts: string[] = [];
    if (typeof cycles === "number") detailParts.push(t.cycles(cycles));
    if (typeof day === "number")
      detailParts.push(t.startedAt(formatDays(day, locale)));

    return {
      text: `${drugLabel}${tag}`,
      detail: detailParts.length > 0 ? detailParts.join(", ") : undefined,
      tone: "neutral",
    };
  }
  return { text: String(chemo) };
}

export function decodeTargeted(
  record: Record<string, unknown>,
  locale?: string,
): Decoded {
  const t = getT(locale);
  const tgt = record.target;
  if (tgt == null) return { text: "—" };
  if (tgt === 0) return { text: t.none, tone: "muted" };
  if (tgt === 1 || tgt === 2 || tgt === 4) {
    const tag = tgt === 1 ? t.preOp : tgt === 2 ? t.postOp : t.noSurgery;
    return { text: t.received, detail: `${tag}`, tone: "neutral" };
  }
  return { text: String(tgt) };
}
