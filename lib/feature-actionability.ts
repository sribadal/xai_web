import { parseFeatureKey } from "@/lib/parse-feature-key"

export type Actionability =
  | "treatment"
  | "semi"
  | "demographics"
  | "comorbidity"
  | "lab"
  | "tumour"
  | "staging"
  | "metastasis"
  | "outcome"

const TREATMENT_FEATURES = new Set<string>([
  "tumgericht_ther", "geen_ther_type",
  "expl_chir", "chir", "chir_type", "chir_int", "chir_tech", "chir_rad",

  "syst_aanpassing", "syst_dosisreductie",

  "ts_surg", "had_surg", "impulse_surg",
  "ts_syst", "had_syst", "impulse_syst",

  "time since surgery", "time since systemic therapy",
  "received surgery", "received systemic therapy",
  "ongoing surgery effect", "ongoing systemic-therapy effect",
  "tumour-directed therapy",
  "surgery", "chemotherapy", "radiotherapy",
  "destructive therapy",
])

const SEMI_FEATURES = new Set<string>([
  "geen_ther_reden",
  "syst_compl",
  "respons_uitslag",
  "respons_int",
])

const DEMOGRAPHICS_FEATURES = new Set<string>([
  "key_nkr", "key_eid",
  "gesl",
  "leeft_cat",
  "incjr",
  "seizoen",
  "geboorteland",
  "lengte",
  "diag_gewicht",
  "gebr_gewicht",
  "rook_stat",
  "alcohol_stat",
])

const COMORBIDITY_FEATURES = new Set<string>([
  "cci",
  "cci_cat",
  "perf_stat",
  "asa",
])

const LAB_FEATURES = new Set<string>([
  "ca199",
  "bilirubine",
  "albumine",
  "kreatinine",
  "hb",
  "ldh",
  "crp",
  "cea",
  "neutrofielen",
  "trombocyten",
])

const TUMOUR_FEATURES = new Set<string>([
  "diag_basis",
  "topo_sublok",
  "morf",
  "morf_cat",
  "diffgrad",
  "klin_tum_afm",
  "pa_tum_afm",
  "veneus_vaatbetr",
  "arterieel_vaatbetr",
  "ond_lymf",
  "pos_lymf",
])

const STAGING_FEATURES = new Set<string>([
  "ct", "cn", "cm",
  "pt", "pn", "pm",
  "cstadium", "pstadium", "stadium",
  "yct", "ycn", "ycm",
])

const METASTASIS_FEATURES = new Set<string>([
  "meta_bijnier",
  "meta_bot",
  "meta_hersenen",
  "meta_lever",
  "meta_long",
  "meta_lymf",
  "meta_perit",
  "meta_overig",
  "meta_lok_aantal",
])

const OUTCOME_FEATURES = new Set<string>([
  "vit_stat", "vit_stat_int",
  "fup_diagnostiek_reden",
  "fup_event_type", "fup_event_int",
  "rfs_event", "rfs_int",
  "pfs_event", "pfs_int",
  "rfs_1jaar_afgerond", "rfs_3jaar_afgerond", "rfs_5jaar_afgerond",
  "pfs_1jaar_afgerond", "pfs_3jaar_afgerond", "pfs_5jaar_afgerond",
  "dead_with_6months",
])

export function getActionability(rawKey: string): Actionability {
  const { feature } = parseFeatureKey(rawKey)

  if (TREATMENT_FEATURES.has(feature)) return "treatment"
  if (SEMI_FEATURES.has(feature)) return "semi"
  if (DEMOGRAPHICS_FEATURES.has(feature)) return "demographics"
  if (COMORBIDITY_FEATURES.has(feature)) return "comorbidity"
  if (LAB_FEATURES.has(feature)) return "lab"
  if (TUMOUR_FEATURES.has(feature)) return "tumour"
  if (STAGING_FEATURES.has(feature)) return "staging"
  if (METASTASIS_FEATURES.has(feature)) return "metastasis"
  if (OUTCOME_FEATURES.has(feature)) return "outcome"

  return "outcome"
}

export const PRE_TREATMENT_CATEGORIES: Actionability[] = [
  "demographics", "comorbidity", "lab", "tumour", "staging", "metastasis",
]

export function isPreTreatment(rawKey: string): boolean {
  return PRE_TREATMENT_CATEGORIES.includes(getActionability(rawKey))
}

export function isTreatment(rawKey: string): boolean {
  const a = getActionability(rawKey)
  return a === "treatment" || a === "semi"
}

export function isOutcome(rawKey: string): boolean {
  return getActionability(rawKey) === "outcome"
}

export const ACTIONABILITY_META: Record<
  Actionability,
  { label: string; color: string; description: string; group: string }
> = {
  demographics: {
    label: "Demographics",
    color: "#64748b",   // slate
    description: "Age, sex, height, weight, lifestyle. Fixed or slow to change.",
    group: "Pre-treatment",
  },
  comorbidity: {
    label: "Comorbidity & fitness",
    color: "#8b5cf6",   // violet
    description: "Other health conditions and physical fitness before treatment.",
    group: "Pre-treatment",
  },
  lab: {
    label: "Lab values",
    color: "#0ea5e9",   // sky
    description: "Blood test results measured before treatment started.",
    group: "Pre-treatment",
  },
  tumour: {
    label: "Tumour characteristics",
    color: "#f97316",   // orange
    description: "Tumour type, size, and microscopic features.",
    group: "Pre-treatment",
  },
  staging: {
    label: "Staging",
    color: "#ef4444",   // red
    description: "How advanced the cancer is — size, lymph nodes, and spread.",
    group: "Pre-treatment",
  },
  metastasis: {
    label: "Metastatic sites",
    color: "#dc2626",   // red-600
    description: "Which organs the cancer has spread to at diagnosis.",
    group: "Pre-treatment",
  },
  treatment: {
    label: "Treatment",
    color: "#10b981",   // emerald
    description: "Surgery, chemotherapy, radiotherapy, and their timing.",
    group: "Treatment",
  },
  semi: {
    label: "Treatment observations",
    color: "#f59e0b",   // amber
    description: "Side effects, treatment response, and reasons for not treating. Recorded but not directly chosen.",
    group: "Treatment",
  },
  outcome: {
    label: "Outcome",
    color: "#94a3b8",   // slate
    description: "Survival, recurrence, and follow-up status.",
    group: "Outcome",
  },
}