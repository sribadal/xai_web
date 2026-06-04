import { parseFeatureKey } from "@/lib/parse-feature-key"
import type { GlossaryEntry } from "@/app/admin/patients/actions"
import { decodeFeatureValue } from "@/lib/feature-value-encoder"

/** ConDOR uses human-readable feature names; map back to patient record keys. */
const FEATURE_ALIASES: Record<string, string> = {
  "time since surgery": "ts_surg",
  "time since systemic therapy": "ts_syst",
  "received surgery": "had_surg",
  "received systemic therapy": "had_syst",
  "ongoing surgery effect": "impulse_surg",
  "ongoing systemic therapy effect": "impulse_syst",
  "diagnosis season": "seizoen",
  "comorbidity score": "cci",
}

type Props = {
  rawKey: string
  glossary?: Record<string, GlossaryEntry>
  featureValues?: Record<string, number | string | null>
}

export function FeatureMetaFooter({ rawKey, glossary, featureValues }: Props) {
  const parsed = parseFeatureKey(rawKey)
  const entry = glossary?.[parsed.feature]
  const nkrKey = FEATURE_ALIASES[parsed.feature] ?? parsed.feature
  const patientValue =
    featureValues?.[parsed.feature] ??
    featureValues?.[FEATURE_ALIASES[parsed.feature] ?? ""]
  const displayValue = resolvePatientValue(patientValue, entry, nkrKey)
  const definition = entry?.definition

  if (displayValue === null && !definition) return null

  return (
    <>
      {displayValue !== null && (
        <p className="text-xs mt-1.5 pt-1.5 border-t border-border/40">
          Patient value: <span className="font-medium">{displayValue}</span>
        </p>
      )}
      {definition && (
        <p className="text-[11px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border/40 leading-relaxed">
          {definition}
        </p>
      )}
    </>
  )
}

function resolvePatientValue(
  value: number | string | null | undefined,
  entry: GlossaryEntry | undefined,
  featureKey: string,
): string | null {
  if (value === null || value === undefined) return null
  // Glossary value map takes priority (locale-specific labels)
  const label =
    entry?.valueMap?.[String(value)] ??
    entry?.value_labels?.[String(value)]
  if (label) return label
  // Fall back to the comprehensive decoder (sentinels, units, binary vars, TNM)
  return decodeFeatureValue(featureKey, value)
}