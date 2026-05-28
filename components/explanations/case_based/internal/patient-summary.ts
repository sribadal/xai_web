import type { CaseRecord } from "./types"


export function buildPatientSummary(
  features: Record<string, unknown>,
  rawFeatures?: Record<string, unknown>,
): string {
  const get = (key: string): unknown => {
    if (rawFeatures && rawFeatures[key] !== undefined && rawFeatures[key] !== null) {
      return rawFeatures[key]
    }
    return features[key]
  }

  const parts: string[] = []

  const demographicsPart = describeDemographics(get)
  if (demographicsPart) parts.push(demographicsPart)

  const tumorPart = describeTumor(get)
  if (tumorPart) parts.push(tumorPart)

  const metaPart = describeMetastases(get)
  if (metaPart) parts.push(metaPart)

  const statusPart = describeStatus(get)
  if (statusPart) parts.push(statusPart)

  if (parts.length === 0) return ""
  return parts.join(". ") + "."
}

function describeDemographics(get: (k: string) => unknown): string {
  const sex = describeSex(get("gesl"))
  const age = describeAge(get("leeft_cat"))

  if (sex && age) return `${sex}, ${age}`
  if (sex) return sex
  if (age) return age
  return ""
}

function describeTumor(get: (k: string) => unknown): string {
  const stage = describeStage(get("stadium"))
  const morf = describeMorphology(get("morf"))
  const grade = describeGrade(get("diffgrad"))

  const stem = [stage, morf].filter(Boolean).join(" ")
  if (stem && grade) return `${stem}, ${grade}`
  if (stem) return stem
  if (grade) return grade
  return ""
}

function describeMetastases(get: (k: string) => unknown): string {
  const sites: string[] = []
  if (isPresent(get("meta_lever"))) sites.push("liver")
  if (isPresent(get("meta_long"))) sites.push("lung")
  if (isPresent(get("meta_perit"))) sites.push("peritoneal")
  if (isPresent(get("meta_lymf"))) sites.push("lymph node")
  if (isPresent(get("meta_bot"))) sites.push("bone")
  if (isPresent(get("meta_hersenen"))) sites.push("brain")
  if (isPresent(get("meta_bijnier"))) sites.push("adrenal")
  if (isPresent(get("meta_overig"))) sites.push("other")

  if (sites.length === 0) return ""
  if (sites.length === 1) return `${sites[0]} metastasis`
  const last = sites.pop()!
  return `${sites.join(", ")} and ${last} metastases`
}

function describeStatus(get: (k: string) => unknown): string {
  const bits: string[] = []

  const perfStat = toNumber(get("perf_stat"))
  if (perfStat !== null && perfStat >= 0 && perfStat <= 4) {
    bits.push(`WHO performance status ${perfStat}`)
  } else if (perfStat === 9) {
    bits.push("performance status unknown")
  }

  const cci = toNumber(get("cci"))
  if (cci !== null && cci >= 2) {
    bits.push(`Charlson index ${cci}`)
  }

  return bits.join(", ")
}

function describeSex(v: unknown): string {
  const n = toNumber(v)
  if (n === 1) return "Male"
  if (n === 2) return "Female"
  return ""
}

function describeAge(v: unknown): string {
  const n = toNumber(v)
  if (n === null || n < 0) return ""

  const cat = Math.round(n)
  if (cat >= 19) return "95+ years"
  if (cat < 0) return ""

  const start = cat * 5
  const end = start + 4
  return `${start}-${end} years`
}

function describeStage(v: unknown): string {
  if (v === null || v === undefined) return ""
  const s = String(v).trim()
  if (s === "" || s === "0" || s === "NVT" || s.toLowerCase() === "unknown") return ""

  const roman: Record<string, string> = {
    "1": "I",
    "2": "II",
    "3": "III",
    "4": "IV",
    "5": "IV",
  }
  const numeric = roman[s] ?? s
  return `stage ${numeric}`
}

function describeMorphology(v: unknown): string {
  const n = toNumber(v)
  if (n === null) return "PDAC"
  if (n === 8140) return "pancreatic adenocarcinoma"
  return "PDAC"
}

function describeGrade(v: unknown): string {
  const n = toNumber(v)
  if (n === null) return ""
  if (n === 1) return "well-differentiated"
  if (n === 2) return "moderately differentiated"
  if (n === 3) return "poorly differentiated"
  if (n === 4) return "undifferentiated"
  return ""
}
function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function isPresent(v: unknown): boolean {
  const n = toNumber(v)
  if (n === null) return false
  return n > 0
}

export type SurvivalHorizons = {
  three: number | null
  six: number | null
  twelve: number | null
}

export function extractSurvivalHorizons(
  source: Record<string, unknown> | undefined | null,
): SurvivalHorizons | null {
  if (!source) return null

  const three = pickHorizon(source, "3")
  const six = pickHorizon(source, "6")
  const twelve = pickHorizon(source, "12")

  if (three === null && six === null && twelve === null) return null
  return { three, six, twelve }
}

function pickHorizon(
  source: Record<string, unknown>,
  months: "3" | "6" | "12",
): number | null {
  const candidates = [
    `survival_prob_${months}_months`,
    `_survival_${months}m`,
    `_survival_prob_${months}m`,
  ]
  for (const key of candidates) {
    const v = source[key]
    if (typeof v === "number" && Number.isFinite(v)) {
      return v > 1.5 ? v / 100 : v
    }
  }
  return null
}

export function hasSurvivalHorizons(record: CaseRecord): boolean {
  return extractSurvivalHorizons(record) !== null
}