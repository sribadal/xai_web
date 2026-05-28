import { parseFeatureKey } from "@/lib/parse-feature-key"

export const SECTION_ORDER = [
  "demographics",
  "comorbidity",
  "labs",
  "tumor",
  "metastases",
  "treatment",
  "outcome",
  "other",
] as const

export type SectionId = (typeof SECTION_ORDER)[number]

export const SECTION_LABELS: Record<SectionId, string> = {
  demographics: "Demographics & lifestyle",
  comorbidity: "Comorbidity & performance",
  labs: "Laboratory values",
  tumor: "Tumor characteristics",
  metastases: "Metastases",
  treatment: "Treatment",
  outcome: "Outcomes (observed)",
  other: "Other",
}

const FEATURE_TO_SECTION: Record<string, SectionId> = {
  gesl: "demographics",
  leeft_cat: "demographics",
  incjr: "demographics",
  seizoen: "demographics",
  geboorteland: "demographics",
  rook_stat: "demographics",
  alcohol_stat: "demographics",
  lengte: "demographics",
  diag_gewicht: "demographics",
  gebr_gewicht: "demographics",

  cci: "comorbidity",
  cci_cat: "comorbidity",
  perf_stat: "comorbidity",
  asa: "comorbidity",

  ca199: "labs",
  cea: "labs",
  bilirubine: "labs",
  albumine: "labs",
  kreatinine: "labs",
  hb: "labs",
  ldh: "labs",
  crp: "labs",
  neutrofielen: "labs",
  trombocyten: "labs",

  diag_basis: "tumor",
  morf: "tumor",
  morf_cat: "tumor",
  diffgrad: "tumor",
  klin_tum_afm: "tumor",
  pa_tum_afm: "tumor",
  veneus_vaatbetr: "tumor",
  arterieel_vaatbetr: "tumor",
  ond_lymf: "tumor",
  pos_lymf: "tumor",
  ct: "tumor",
  cm: "tumor",
  cstadium: "tumor",
  stadium: "tumor",
  ycm: "tumor",

  meta_bijnier: "metastases",
  meta_bot: "metastases",
  meta_hersenen: "metastases",
  meta_lever: "metastases",
  meta_long: "metastases",
  meta_lymf: "metastases",
  meta_perit: "metastases",
  meta_overig: "metastases",
  meta_lok_aantal: "metastases",

  tumgericht_ther: "treatment",
  geen_ther_reden: "treatment",
  geen_ther_type: "treatment",
  expl_chir: "treatment",
  chir: "treatment",
  chir_type: "treatment",
  chir_int: "treatment",
  chir_tech: "treatment",
  chir_rad: "treatment",
  destr: "treatment",
  destr_type: "treatment",
  destr_int: "treatment",
  rt: "treatment",
  rt_type: "treatment",
  rt_start_int: "treatment",
  meta_rt: "treatment",
  meta_chir: "treatment",
  lok_chemo_immuno: "treatment",
  meta_ther_int: "treatment",
  chemo: "treatment",
  target: "treatment",
  syst_code: "treatment",
  syst_schemanum: "treatment",
  syst_start_int: "treatment",
  syst_stop_int: "treatment",
  syst_kuren: "treatment",
  syst_chemort: "treatment",
  syst_prepost: "treatment",
  syst_aanpassing: "treatment",
  syst_dosisreductie: "treatment",
  syst_compl: "treatment",
  respons_int: "treatment",

  vit_stat: "outcome",
  vit_stat_int: "outcome",
  rfs_event: "outcome",
  rfs_int: "outcome",
  pfs_event: "outcome",
  pfs_int: "outcome",
  fup_event_type: "outcome",
  fup_event_int: "outcome",
  fup_diagnostiek_reden: "outcome",
  rfs_1jaar_afgerond: "outcome",
  rfs_3jaar_afgerond: "outcome",
  rfs_5jaar_afgerond: "outcome",
  pfs_1jaar_afgerond: "outcome",
  pfs_3jaar_afgerond: "outcome",
  pfs_5jaar_afgerond: "outcome",
  dead_with_6months: "outcome",
}

export function getSectionForFeature(rawKey: string): SectionId {
  const parsed = parseFeatureKey(rawKey)
  if (FEATURE_TO_SECTION[parsed.feature]) {
    return FEATURE_TO_SECTION[parsed.feature]
  }

  const stripped = parsed.feature.replace(/\d+$/, "")
  if (FEATURE_TO_SECTION[stripped]) return FEATURE_TO_SECTION[stripped]

  return "other"
}

export function groupBySection(
  rawKeys: string[],
): { section: SectionId; label: string; keys: string[] }[] {
  const buckets: Record<SectionId, string[]> = {
    demographics: [],
    comorbidity: [],
    labs: [],
    tumor: [],
    metastases: [],
    treatment: [],
    outcome: [],
    other: [],
  }

  for (const k of rawKeys) {
    buckets[getSectionForFeature(k)].push(k)
  }

  return SECTION_ORDER.filter((s) => buckets[s].length > 0).map((s) => ({
    section: s,
    label: SECTION_LABELS[s],
    keys: buckets[s].sort(),
  }))
}