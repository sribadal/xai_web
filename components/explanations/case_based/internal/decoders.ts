export type Tone = "neutral" | "good" | "warn" | "bad" | "muted";

export type Decoded = {
  text: string;
  detail?: string;
  tone?: Tone;
};

export function formatDays(days: unknown): string {
  if (typeof days !== "number" || !Number.isFinite(days)) return "—";
  if (days < 30) return `${Math.round(days)} days`;
  if (days < 365) return `${Math.round(days / 30.44)} months`;
  return `${(days / 365.25).toFixed(1)} years`;
}

const SURGERY_TYPE_LABELS: Record<number, string> = {
  21: "Whipple procedure",
  22: "Pylorus-preserving Whipple",
  23: "Other partial pancreatectomy",
  25: "Distal pancreatectomy",
  26: "Total pancreatectomy",
};

const SURGERY_TECH_LABELS: Record<number, string> = {
  0: "open",
  1: "keyhole",
  3: "robot-assisted",
  9: "unknown technique",
};

const SURGERY_MARGIN_LABELS: Record<number, string> = {
  0: "R0 margin",
  1: "R1 margin",
  2: "R2 margin",
  9: "unknown margin",
};


const RT_TYPE_LABELS: Record<number, string> = {
  1: "Chemoradiation",
  3: "SBRT",
  7: "Other RT",
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

const THERAPY_REASON_LABELS: Record<number, string> = {
  11: "patient too unwell",
  12: "cancer too advanced",
  13: "patient declined",
  14: "tumour burden too low",
  9: "unknown reason",
};

export function decodeSurvival(record: Record<string, unknown>): Decoded {
  const status = record.vit_stat;
  const days = record.vit_stat_int;
  if (status == null) return { text: "—" };
  if (status === 0) {
    return {
      text: "Alive",
      detail:
        typeof days === "number"
          ? `last seen at ${formatDays(days)}`
          : undefined,
      tone: "good",
    };
  }
  if (status === 1) {
    const detail = typeof days === "number" ? `at ${formatDays(days)}` : undefined;
    let tone: Tone = "bad";
    if (typeof days === "number") {
      if (days >= 730) tone = "muted";
      else if (days >= 180) tone = "warn";
    }
    return { text: "Died", detail, tone };
  }
  return { text: String(status) };
}

export function decodeRecurrence(record: Record<string, unknown>): Decoded {
  const event = record.rfs_event;
  const days = record.rfs_int;
  if (event == null) return { text: "—" };
  if (event === 0) {
    return {
      text: "No recurrence",
      detail:
        typeof days === "number" ? `(${formatDays(days)} follow-up)` : undefined,
      tone: "good",
    };
  }
  if (event === 1) {
    return {
      text: "Recurred",
      detail: typeof days === "number" ? `at ${formatDays(days)}` : undefined,
      tone: "bad",
    };
  }
  if (event === 2) {
    return {
      text: "Died before recurrence",
      detail: typeof days === "number" ? `at ${formatDays(days)}` : undefined,
      tone: "warn",
    };
  }
  return { text: String(event) };
}

export function decodeProgression(record: Record<string, unknown>): Decoded {
  const event = record.pfs_event;
  const days = record.pfs_int;
  if (event == null) return { text: "—" };
  if (event === 0) {
    return {
      text: "Stable",
      detail:
        typeof days === "number" ? `(${formatDays(days)} follow-up)` : undefined,
      tone: "good",
    };
  }
  if (event === 1) {
    return {
      text: "Progressed",
      detail: typeof days === "number" ? `at ${formatDays(days)}` : undefined,
      tone: "bad",
    };
  }
  if (event === 2) {
    return {
      text: "Died before progression",
      detail: typeof days === "number" ? `at ${formatDays(days)}` : undefined,
      tone: "warn",
    };
  }
  return { text: String(event) };
}

export function decodeEarlyMortality(
  record: Record<string, unknown>,
): Decoded {
  const v = record.dead_with_6months;
  if (v == null) return { text: "—" };
  if (v === 1) {
    return { text: "Yes", detail: "(died within 6 months)", tone: "bad" };
  }
  if (v === 0) {
    return { text: "No", tone: "good" };
  }
  return { text: String(v) };
}

export function decodeTumorDirected(
  record: Record<string, unknown>,
): Decoded {
  const v = record.tumgericht_ther;
  if (v == null) return { text: "—" };
  if (v === 1) return { text: "Received", tone: "neutral" };
  if (v === 0) {
    const reason = record.geen_ther_reden;
    if (typeof reason === "number" && THERAPY_REASON_LABELS[reason]) {
      return {
        text: "None given",
        detail: `(${THERAPY_REASON_LABELS[reason]})`,
        tone: "muted",
      };
    }
    return { text: "None given", tone: "muted" };
  }
  return { text: String(v) };
}

export function decodeSurgery(record: Record<string, unknown>): Decoded {
  const chir = record.chir;
  if (chir == null) return { text: "—" };
  if (chir === 0) return { text: "None", tone: "muted" };
  if (chir === 1) {
    const type = record.chir_type1;
    const tech = record.chir_tech1;
    const margin = record.chir_rad1;
    const day = record.chir_int1;

    const typeLabel =
      typeof type === "number" && SURGERY_TYPE_LABELS[type]
        ? SURGERY_TYPE_LABELS[type]
        : typeof type === "number"
          ? `Surgery type ${type}`
          : "Surgery performed";

    const techDetails: string[] = [];
    if (typeof tech === "number" && SURGERY_TECH_LABELS[tech]) {
      techDetails.push(SURGERY_TECH_LABELS[tech]);
    }
    if (typeof margin === "number" && SURGERY_MARGIN_LABELS[margin]) {
      techDetails.push(SURGERY_MARGIN_LABELS[margin]);
    }
    if (typeof day === "number") {
      techDetails.push(`at ${formatDays(day)}`);
    }

    return {
      text: typeLabel,
      detail: techDetails.length > 0 ? techDetails.join(", ") : undefined,
      tone: "neutral",
    };
  }
  return { text: String(chir) };
}

/** Radiotherapy: type + timing flag + start day. */
export function decodeRadiotherapy(
  record: Record<string, unknown>,
): Decoded {
  const rt = record.rt;
  if (rt == null) return { text: "—" };
  if (rt === 0) return { text: "None", tone: "muted" };
  if (rt === 1 || rt === 2 || rt === 4) {
    const type = record.rt_type1;
    const day = record.rt_start_int1;
    const typeLabel =
      typeof type === "number" && RT_TYPE_LABELS[type]
        ? RT_TYPE_LABELS[type]
        : "Radiotherapy";
    const tag =
      rt === 1 ? " (pre-op)" : rt === 2 ? " (post-op)" : " (no surgery)";
    return {
      text: `${typeLabel}${tag}`,
      detail:
        typeof day === "number" ? `started at ${formatDays(day)}` : undefined,
      tone: "neutral",
    };
  }
  return { text: String(rt) };
}

export function decodeSystemic(record: Record<string, unknown>): Decoded {
  const chemo = record.chemo;
  if (chemo == null) return { text: "—" };
  if (chemo === 0) return { text: "None", tone: "muted" };
  if (chemo === 1 || chemo === 2 || chemo === 3 || chemo === 4) {
    const drug = record.syst_code1;
    const cycles = record.syst_kuren1;
    const day = record.syst_start_int1;

    let drugLabel = "Chemotherapy";
    if (typeof drug === "string" && drug.length > 0) {
      drugLabel = ATC_LABELS[drug] || drug;
    }

    const tag =
      chemo === 1
        ? " (pre-op)"
        : chemo === 2
          ? " (post-op)"
          : chemo === 3
            ? " (peri-op)"
            : " (no surgery)";

    const detailParts: string[] = [];
    if (typeof cycles === "number") detailParts.push(`${cycles} cycles`);
    if (typeof day === "number") detailParts.push(`started at ${formatDays(day)}`);

    return {
      text: `${drugLabel}${tag}`,
      detail: detailParts.length > 0 ? detailParts.join(", ") : undefined,
      tone: "neutral",
    };
  }
  return { text: String(chemo) };
}

export function decodeTargeted(record: Record<string, unknown>): Decoded {
  const t = record.target;
  if (t == null) return { text: "—" };
  if (t === 0) return { text: "None", tone: "muted" };
  if (t === 1 || t === 2 || t === 4) {
    const tag =
      t === 1 ? "pre-op" : t === 2 ? "post-op" : "no surgery";
    return { text: "Received", detail: `(${tag})`, tone: "neutral" };
  }
  return { text: String(t) };
}