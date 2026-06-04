const SENTINEL_BY_VARIABLE: Record<string, number[]> = {
  lengte: [999],
  diag_gewicht: [999],
  gebr_gewicht: [999],
  klin_tum_afm: [999],
  pa_tum_afm: [999],
  ca199: [9999],
  bilirubine: [9999],
  kreatinine: [9999],
  ldh: [9999],
  trombocyten: [9999],
  hb: [99.9],
  albumine: [999.9],
  neutrofielen: [999.9],
  crp: [9999.9],
  cea: [9999.9],
};

const UNITS: Record<string, string> = {
  ca199: "U/mL",
  bilirubine: "µmol/L",
  albumine: "g/L",
  kreatinine: "µmol/L",
  hb: "mmol/L",
  ldh: "U/L",
  crp: "mg/L",
  cea: "µg/L",
  neutrofielen: "×10⁹/L",
  trombocyten: "×10⁹/L",
  lengte: "cm",
  diag_gewicht: "kg",
  gebr_gewicht: "kg",
  klin_tum_afm: "mm",
  pa_tum_afm: "mm",
  vit_stat_int: "days",
  rfs_int: "days",
  pfs_int: "days",
  chir_int: "days",
  destr_int: "days",
  rt_start_int: "days",
  syst_start_int: "days",
  syst_stop_int: "days",
  respons_int: "days",
  fup_event_int: "days",
  meta_ther_int: "days",
};

// ---------------------------------------------------------------------------
// Binary variables
// ---------------------------------------------------------------------------

const PRESENT_ABSENT_VARS = new Set([
  "meta_bijnier", "meta_bot", "meta_hersenen", "meta_lever",
  "meta_long", "meta_lymf", "meta_perit", "meta_overig",
]);

const YES_NO_VARS = new Set([
  "tumgericht_ther", "expl_chir", "chir", "destr",
  "meta_rt", "meta_chir", "lok_chemo_immuno",
  "rfs_1jaar_afgerond", "rfs_3jaar_afgerond", "rfs_5jaar_afgerond",
  "pfs_1jaar_afgerond", "pfs_3jaar_afgerond", "pfs_5jaar_afgerond",
  "dead_with_6months",
  "had_surg", "had_syst", "impulse_surg", "impulse_syst",
]);

// ---------------------------------------------------------------------------
// ConDOR normalized time features
// ---------------------------------------------------------------------------

const CONDOR_TIME_VARS = new Set(["ts_surg", "ts_syst"]);

// ---------------------------------------------------------------------------
// TNM prefix fallback
// ---------------------------------------------------------------------------

const TNM_PREFIXES: Record<string, string> = {
  ct: "cT", cn: "cN", cm: "cM",
  pt: "pT", pn: "pN", pm: "pM",
  yct: "ycT", ycn: "ycN", ycm: "ycM",
};

// ---------------------------------------------------------------------------
// Code-list value maps
// ---------------------------------------------------------------------------

const VALUE_MAPS: Record<string, Record<string, string>> = {
  gesl: { "1": "Male", "2": "Female" },
  leeft_cat: {
    "4": "15–19 y", "6": "25–29 y", "7": "30–34 y", "8": "35–39 y",
    "9": "40–44 y", "10": "45–49 y", "11": "50–54 y", "12": "55–59 y",
    "13": "60–64 y", "14": "65–69 y", "15": "70–74 y", "16": "75–79 y",
    "17": "80–84 y", "18": "85–89 y", "19": "90–94 y", "20": "95–99 y",
    "21": "100–104 y",
  },
  seizoen: {
    "1": "Winter (Dec–Feb)", "2": "Spring (Mar–May)",
    "3": "Summer (Jun–Aug)", "4": "Autumn (Sep–Nov)",
  },
  vit_stat: { "0": "Alive", "1": "Deceased" },
  cci_cat: { "0": "None", "1": "1 category", "2": "2 or more" },
  perf_stat: {
    "0": "WHO 0 (fully active)", "1": "WHO 1 (restricted)",
    "2": "WHO 2 (ambulatory, no work)", "3": "WHO 3 (limited self-care)",
    "4": "WHO 4 (bed-bound)", "9": "Unknown",
  },
  asa: {
    "1": "ASA I (healthy)", "2": "ASA II (mild systemic disease)",
    "3": "ASA III (severe systemic disease)", "4": "ASA IV (life-threatening)",
    "5": "ASA V (moribund)", "6": "ASA VI (brain-dead donor)", "9": "Unknown",
  },
  rook_stat: {
    "1": "Current smoker", "2": "Former smoker", "3": "Never smoked",
    "4": "Not currently", "7": "Not in records", "9": "Unknown",
  },
  alcohol_stat: {
    "11": "Social", "12": "Alcohol abuse", "22": "Former",
    "33": "Never", "44": "Not currently", "77": "Not in records", "99": "Unknown",
  },
  diag_basis: {
    "1": "Clinical", "2": "Clinical examination", "4": "Tumour markers",
    "5": "Cytology", "6": "Histology (metastasis)", "7": "Histology",
  },
  topo_sublok: {
    C250: "Pancreas head", C251: "Pancreas body", C252: "Pancreas tail",
    C253: "Pancreatic duct", C257: "Other specified", C258: "Overlapping",
    C259: "Pancreas NOS",
  },
  diffgrad: {
    "1": "Grade 1 (well differentiated)", "2": "Grade 2 (moderately diff.)",
    "3": "Grade 3 (poorly diff.)", "4": "Grade 4 (undifferentiated)", "9": "Unknown",
  },
  morf_cat: {
    "10": "Adenocarcinoma", "11": "Probable adenocarcinoma",
    "12": "Cholangiocarcinoma", "13": "Squamous cell carcinoma",
    "14": "Osteoclastic giant cell tumour",
  },
  morf: {
    "8000": "Neoplasm NOS", "8001": "Malignant tumour cells",
    "8003": "Malignant tumour, giant cell", "8010": "Carcinoma NOS",
    "8012": "Large cell carcinoma", "8020": "Undifferentiated carcinoma",
    "8021": "Anaplastic carcinoma", "8022": "Pleomorphic carcinoma",
    "8031": "Giant cell carcinoma",
    "8035": "Carcinoma with osteoclast-like giant cells",
    "8046": "Non-small cell carcinoma", "8070": "Squamous cell carcinoma",
    "8140": "Adenocarcinoma NOS", "8141": "Scirrhous adenocarcinoma",
    "8144": "Adenocarcinoma, intestinal type",
    "8163": "Pancreatobiliary carcinoma", "8211": "Tubular adenocarcinoma",
    "8310": "Clear cell adenocarcinoma", "8440": "Cystadenocarcinoma",
    "8480": "Mucinous adenocarcinoma", "8481": "Mucin-producing adenocarcinoma",
    "8490": "Signet ring cell carcinoma", "8500": "Ductal carcinoma NOS",
    "8510": "Medullary carcinoma", "8560": "Adenosquamous carcinoma",
    "8576": "Hepatoid adenocarcinoma",
  },
  ct: {
    "0": "cT0 (no primary tumour)", "1": "cT1 (≤ 2 cm, pancreas only)",
    "2": "cT2 (> 2 cm, pancreas only)", "3": "cT3 (beyond pancreas)",
    "4": "cT4 (involves celiac axis/SMA)", X: "cTX (unknown)", is: "cTis (in situ)",
  },
  cn: {
    "0": "cN0 (no nodal spread)", "1": "cN1 (1–3 positive nodes)",
    "2": "cN2 (≥ 4 positive nodes)", X: "cNX (unknown)",
  },
  cm: {
    "0": "cM0 (no distant spread)", "1": "cM1 (distant metastasis)", X: "cMX (unknown)",
  },
  pt: {
    "0": "pT0 (no primary tumour)", "1": "pT1 (≤ 2 cm, pancreas only)",
    "2": "pT2 (> 2 cm, pancreas only)", "3": "pT3 (beyond pancreas)",
    "4": "pT4 (involves celiac axis/SMA)", X: "pTX (unknown)", is: "pTis (in situ)",
  },
  pn: {
    "0": "pN0 (no nodal spread)", "1": "pN1 (1–3 positive nodes)",
    "2": "pN2 (≥ 4 positive nodes)", X: "pNX (unknown)",
  },
  pm: {
    "0": "pM0 (no distant spread)", "1": "pM1 (distant metastasis)", X: "pMX (unknown)",
  },
  cstadium: {
    "0": "Stage 0", "1": "Stage IA", "2": "Stage IB",
    "3": "Stage IIA", "4": "Stage IIB", "5": "Stage III", "6": "Stage IV",
    IA: "Stage IA", IB: "Stage IB", I: "Stage I",
    IIA: "Stage IIA", IIB: "Stage IIB", II: "Stage II",
    III: "Stage III", IV: "Stage IV",
    X: "Unknown", M: "Not staged", NVT: "N/A",
  },
  pstadium: {
    "0": "Stage 0", "1": "Stage IA", "2": "Stage IB",
    "3": "Stage IIA", "4": "Stage IIB", "5": "Stage III", "6": "Stage IV",
    IA: "Stage IA", IB: "Stage IB", I: "Stage I",
    IIA: "Stage IIA", IIB: "Stage IIB", II: "Stage II",
    III: "Stage III", IV: "Stage IV",
    X: "Unknown", M: "Not staged", NVT: "N/A",
  },
  stadium: {
    "0": "Stage 0", "1": "Stage IA", "2": "Stage IB",
    "3": "Stage IIA", "4": "Stage IIB", "5": "Stage III", "6": "Stage IV",
    IA: "Stage IA", IB: "Stage IB", I: "Stage I",
    IIA: "Stage IIA", IIB: "Stage IIB", II: "Stage II",
    III: "Stage III", IV: "Stage IV",
    X: "Unknown", M: "Not staged", NVT: "N/A",
  },
  yct: { "0": "ycT0", "1": "ycT1", "2": "ycT2", "3": "ycT3", "4": "ycT4", X: "ycTX" },
  ycn: { "0": "ycN0", "1": "ycN1", "2": "ycN2", X: "ycNX" },
  ycm: { "0": "ycM0", "1": "ycM1" },
  veneus_vaatbetr: {
    "0": "No involvement", "1": "1–90° contact", "2": "91–180° contact",
    "3": "181–270° contact", "4": "271–360° contact",
    "7": "Yes (unspecified)", "8": "N/A", "9": "Unknown",
  },
  arterieel_vaatbetr: {
    "0": "No involvement", "1": "1–90° contact", "2": "91–180° contact",
    "3": "181–270° contact", "4": "271–360° contact",
    "7": "Yes (unspecified)", "8": "N/A", "9": "Unknown",
  },
  ond_lymf: { "0": "None examined", "98": "Unknown count", "99": "Unknown if examined" },
  pos_lymf: { "0": "None positive", "98": "Unknown count", "99": "Unknown if positive" },
  meta_lok_aantal: {
    "1": "1 site", "2": "2 sites", "3": "3 sites", "4": "4 sites",
    "5": "5 sites", "6": "6 sites", "7": "7 sites", "77": "> 3 sites",
  },
  therprepost: {
    "0": "No", "1": "Pre-surgical only", "2": "Post-surgical only",
    "3": "Pre & post-surgical", "4": "Yes (no surgery)",
  },
  chir_type: {
    "21": "Whipple", "22": "PPPD", "23": "PRPD",
    "24": "Pancreatoduodenectomy NOS", "25": "Distal pancreatectomy",
    "26": "Total pancreatectomy", "27": "Central pancreatectomy",
    "29": "Pancreatectomy NOS", "98": "Abroad",
  },
  chir_tech: {
    "0": "Open", "1": "Laparoscopic", "2": "Laparoscopic → converted",
    "3": "Robot-assisted", "4": "Robot-assisted → converted", "9": "Unknown",
  },
  chir_rad: {
    "0": "R0 (radical)", "1": "R1 (micro irradical)",
    "2": "R2 (macro irradical)", "9": "Unknown",
  },
  destr_type: { "1": "RFA", "3": "IRE", "8": "Abroad" },
  rt_type: {
    "1": "Chemoradiation", "3": "SBRT", "7": "Other RT", "8": "Abroad", "9": "NOS",
  },
  geen_ther_reden: {
    "8": "Other", "9": "Unknown", "11": "Comorbidity / performance",
    "12": "Expected rapid progression", "13": "Patient / family preference",
    "14": "Low tumour burden",
  },
  geen_ther_type: {
    "1": "Surgery", "2": "Radiotherapy", "3": "Brachytherapy",
    "4": "Chemotherapy", "5": "Targeted therapy",
  },
  syst_code: {
    L01: "Systemic chemotherapy", L01BA04: "Pemetrexed", L01BC02: "5-FU",
    L01BC05: "Gemcitabine", L01BC06: "Capecitabine",
    L01BC53: "Tegafur/gimeracil/oteracil", L01CD01: "Paclitaxel",
    L01CD01_A: "Nab-paclitaxel", L01CD02: "Docetaxel", L01CE02: "Irinotecan",
    L01XA01: "Cisplatin", L01XA02: "Carboplatin", L01XA03: "Oxaliplatin",
    L01F: "Monoclonal antibody", L01FF01: "Nivolumab", L01FF03: "Durvalumab",
    L01FF05: "Atezolizumab", L01FG01: "Bevacizumab", L01XJ02: "Sonidegib",
    L01XK01: "Olaparib", L02: "Hormonal therapy", H01CB02: "Octreotide",
    "690420": "Chemotherapy abroad", "690430": "Targeted therapy abroad",
    "699004": "Study medication (chemo)", "699005": "Study medication (immuno)",
    "699013": "Study medication (targeted)",
  },
  syst_compl: {
    "1": "Stopped early (adverse effects)", "2": "Hospitalised (adverse effects)",
    "3": "Stopped early + hospitalised", "9": "Unknown",
  },
  syst_aanpassing: {
    "0": "No adjustment", "1": "Dose reduction",
    "2": "Fewer cycles / stopped early", "3": "Interrupted and resumed",
    "4": "One agent stopped", "5": "Dose reduction + interrupted",
    "6": "Dose reduction + agent stopped", "7": "Interrupted + agent stopped",
    "8": "Other", "9": "Unknown", "11": "Dose increase",
    "12": "Fewer cycles + dose reduction", "13": "Fewer cycles + interrupted",
    "14": "Fewer cycles + agent stopped",
  },
  syst_kuren: { "66": "Sensitizer", "77": "Maintenance", "98": "Ongoing", "99": "Unknown" },
  respons_uitslag: {
    "0": "Not determined", "99": "Unknown",
    CR: "Complete remission", MR: "Mixed response", PD: "Progressive disease",
    PR: "Partial remission", SD: "Stable disease",
  },
  rfs_event: { "0": "Censored", "1": "Recurrence", "2": "Death" },
  pfs_event: { "0": "Censored", "1": "Progression", "2": "Death" },
  fup_event_type: {
    "1": "Local only", "2": "Regional (± local)",
    "3": "Distant (± regional/local)", "9": "Unknown",
  },
  fup_diagnostiek_reden: {
    "1": "Symptoms", "2": "Screening", "3": "Surveillance",
    "4": "Incidental", "7": "Other", "9": "Unknown",
  },
};

const THERPREPOST_VARS = new Set([
  "rt", "chemo", "target", "syst_chemort", "syst_prepost",
]);

// ---------------------------------------------------------------------------
// Dutch overrides — applied as a post-processing layer.
// Medical terms (WHO, TNM, ASA, drug names, surgery types) are kept in
// English as they are international and used in Dutch clinical practice.
// ---------------------------------------------------------------------------

const NL_OVERRIDES: Record<string, string> = {
  // Binary
  "Yes": "Ja",
  "No": "Nee",
  "yes": "ja",
  "no": "nee",
  "Absent": "Afwezig",
  "Present": "Aanwezig",
  // Sentinels
  "Not recorded": "Niet geregistreerd",
  // Demographics
  "Male": "Man",
  "Female": "Vrouw",
  // Vital
  "Alive": "In leven",
  "Deceased": "Overleden",
  // Comorbidity
  "None": "Geen",
  "1 category": "1 categorie",
  "2 or more": "2 of meer",
  // Staging
  "Unknown": "Onbekend",
  "Not staged": "Niet gestadeerd",
  "N/A": "N.v.t.",
  // Vascular
  "No involvement": "Geen betrokkenheid",
  "Yes (unspecified)": "Ja (niet gespecificeerd)",
  // Lymph nodes
  "None examined": "Geen onderzocht",
  "None positive": "Geen positief",
  "Unknown count": "Onbekend aantal",
  "Unknown if examined": "Onbekend of onderzocht",
  "Unknown if positive": "Onbekend of positief",
  // Treatment therprepost
  "Pre-surgical only": "Alleen prechirurgisch",
  "Post-surgical only": "Alleen postchirurgisch",
  "Pre & post-surgical": "Pre- en postchirurgisch",
  "Yes (no surgery)": "Ja (geen chirurgie)",
  // Diagnosis
  "Clinical": "Klinisch",
  "Clinical examination": "Klinisch onderzoek",
  "Tumour markers": "Tumormarkers",
  "Cytology": "Cytologie",
  "Histology (metastasis)": "Histologie (metastase)",
  "Histology": "Histologie",
  // Seasons
  "Winter (Dec–Feb)": "Winter (dec–feb)",
  "Spring (Mar–May)": "Lente (mrt–mei)",
  "Summer (Jun–Aug)": "Zomer (jun–aug)",
  "Autumn (Sep–Nov)": "Herfst (sep–nov)",
  // Smoking
  "Current smoker": "Huidige roker",
  "Former smoker": "Voormalig roker",
  "Never smoked": "Nooit gerookt",
  "Not currently": "Momenteel niet",
  "Not in records": "Niet in dossier",
  // Alcohol
  "Social": "Sociaal",
  "Alcohol abuse": "Alcoholmisbruik",
  "Former": "Voormalig",
  "Never": "Nooit",
  // No-treatment reasons
  "Other": "Anders",
  "Comorbidity / performance": "Comorbiditeit / conditie",
  "Expected rapid progression": "Verwachte snelle progressie",
  "Patient / family preference": "Voorkeur patiënt / familie",
  "Low tumour burden": "Lage tumorlast",
  // geen_ther_type
  "Surgery": "Chirurgie",
  "Radiotherapy": "Radiotherapie",
  "Brachytherapy": "Brachytherapie",
  "Chemotherapy": "Chemotherapie",
  "Targeted therapy": "Doelgerichte therapie",
  // Cycles
  "1 cycle": "1 cyclus",
  "0 months": "0 maanden",
  // Systemic adjustments
  "No adjustment": "Geen aanpassing",
  "Dose reduction": "Dosisreductie",
  "Fewer cycles / stopped early": "Minder cycli / vroegtijdig gestopt",
  "Interrupted and resumed": "Onderbroken en hervat",
  "One agent stopped": "Eén middel gestopt",
  "Dose increase": "Dosisverhoging",
  // Systemic complications
  "Stopped early (adverse effects)": "Vroegtijdig gestopt (bijwerkingen)",
  "Hospitalised (adverse effects)": "Opgenomen (bijwerkingen)",
  "Stopped early + hospitalised": "Vroegtijdig gestopt + opgenomen",
  // Response
  "Not determined": "Niet bepaald",
  "Complete remission": "Complete remissie",
  "Mixed response": "Gemengde respons",
  "Progressive disease": "Progressieve ziekte",
  "Partial remission": "Partiële remissie",
  "Stable disease": "Stabiele ziekte",
  // Events
  "Censored": "Gecensureerd",
  "Recurrence": "Recidief",
  "Progression": "Progressie",
  "Death": "Overlijden",
  // Follow-up
  "Local only": "Alleen lokaal",
  "Regional (± local)": "Regionaal (± lokaal)",
  "Distant (± regional/local)": "Op afstand (± regionaal/lokaal)",
  "Symptoms": "Symptomen",
  "Screening": "Screening",
  "Surveillance": "Surveillance",
  "Incidental": "Incidenteel",
  // Metastasis count
  "1 site": "1 locatie",
  "2 sites": "2 locaties",
  "3 sites": "3 locaties",
  "4 sites": "4 locaties",
  "5 sites": "5 locaties",
  "6 sites": "6 locaties",
  "7 sites": "7 locaties",
  "> 3 sites": "> 3 locaties",
  // Systemic cycles special
  "Sensitizer": "Sensitizer",
  "Maintenance": "Onderhoud",
  "Ongoing": "Lopend",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripNumericSuffix(key: string): string {
  return key.replace(/\d+$/, "");
}

function isSentinel(key: string, value: number): boolean {
  const base = stripNumericSuffix(key);
  const sentinels = SENTINEL_BY_VARIABLE[key] ?? SENTINEL_BY_VARIABLE[base];
  return sentinels != null && sentinels.some((s) => Math.abs(s - value) < 0.01);
}

function getUnit(key: string): string | undefined {
  const base = stripNumericSuffix(key);
  return UNITS[key] ?? UNITS[base];
}

// ---------------------------------------------------------------------------
// Core decoder (English)
// ---------------------------------------------------------------------------

function decodeEN(key: string, value: unknown): string {
  if (value == null) return "—";

  const strVal = String(value).trim();
  const normalizedVal = strVal.replace(/\.0$/, "");
  const base = stripNumericSuffix(key);

  // 1. Sentinel missing values
  if (typeof value === "number" && isSentinel(key, value)) {
    return "Not recorded";
  }

  // 2. Metastasis variables
  if (PRESENT_ABSENT_VARS.has(key) || PRESENT_ABSENT_VARS.has(base)) {
    if (normalizedVal === "0") return "Absent";
    if (normalizedVal === "1") return "Present";
  }

  // 3. Yes/No variables
  if (YES_NO_VARS.has(key) || YES_NO_VARS.has(base)) {
    if (normalizedVal === "0") return "No";
    if (normalizedVal === "1") return "Yes";
  }

  // 4. Therprepost code list
  if (THERPREPOST_VARS.has(key) || THERPREPOST_VARS.has(base)) {
    const label = VALUE_MAPS.therprepost?.[normalizedVal] ?? VALUE_MAPS.therprepost?.[strVal];
    if (label) return label;
  }

  // 5. Direct value map lookup
  const directMap = VALUE_MAPS[key] ?? VALUE_MAPS[base];
  if (directMap) {
    const label = directMap[normalizedVal] ?? directMap[strVal];
    if (label) return label;
  }

  // 5b. TNM fallback
  const tnmPrefix = TNM_PREFIXES[key] ?? TNM_PREFIXES[base];
  if (tnmPrefix) {
    return `${tnmPrefix}${normalizedVal}`;
  }

  // 6. syst_kuren: normal integers
  if (base === "syst_kuren" && typeof value === "number" && value >= 1 && value <= 50) {
    return value === 1 ? "1 cycle" : `${value} cycles`;
  }

  // 7. ond_lymf / pos_lymf: actual counts
  if ((base === "ond_lymf" || base === "pos_lymf") && typeof value === "number" && value >= 1 && value <= 97) {
    return String(value);
  }

  // 7b. ConDOR normalized time features
  if ((CONDOR_TIME_VARS.has(key) || CONDOR_TIME_VARS.has(base)) && typeof value === "number") {
    const months = value * 60;
    if (months === 0) return "0 months";
    return `${months.toFixed(1)} months`;
  }

  // 8. Default
  const unit = getUnit(key);
  if (typeof value === "number") {
    const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2);
    return unit ? `${formatted} ${unit}` : formatted;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return strVal;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Decode a raw feature value into a human-readable label.
 * Defaults to English; pass locale="nl" for Dutch labels.
 */
export function decodeFeatureValue(
  key: string,
  value: unknown,
  locale: string = "en",
): string {
  const result = decodeEN(key, value);

  if (locale === "nl") {
    // Exact override match
    const override = NL_OVERRIDES[result];
    if (override) return override;

    // "N months" → "N maanden"
    const monthMatch = result.match(/^([\d.]+) months$/);
    if (monthMatch) return `${monthMatch[1]} maanden`;

    // "N cycles" → "N cycli"
    const cycleMatch = result.match(/^(\d+) cycles$/);
    if (cycleMatch) return `${cycleMatch[1]} cycli`;

    // "N days" → "N dagen"
    const dayMatch = result.match(/^([\d.]+) days$/);
    if (dayMatch) return `${dayMatch[1]} dagen`;
  }

  return result;
}

/**
 * Check whether a variable has a known code list.
 */
export function hasCodeList(key: string): boolean {
  const base = stripNumericSuffix(key);
  return (
    PRESENT_ABSENT_VARS.has(key) || PRESENT_ABSENT_VARS.has(base) ||
    YES_NO_VARS.has(key) || YES_NO_VARS.has(base) ||
    THERPREPOST_VARS.has(key) || THERPREPOST_VARS.has(base) ||
    CONDOR_TIME_VARS.has(key) || CONDOR_TIME_VARS.has(base) ||
    key in VALUE_MAPS || base in VALUE_MAPS ||
    key in TNM_PREFIXES || base in TNM_PREFIXES
  );
}