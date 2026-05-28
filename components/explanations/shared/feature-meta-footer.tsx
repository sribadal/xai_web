import { parseFeatureKey } from "@/lib/parse-feature-key"
import type { GlossaryEntry } from "@/app/admin/patients/actions"

type Props = {
  rawKey: string
  glossary?: Record<string, GlossaryEntry>
  featureValues?: Record<string, number | string | null>
}

export function FeatureMetaFooter({ rawKey, glossary, featureValues }: Props) {
  const parsed = parseFeatureKey(rawKey)
  const entry = glossary?.[parsed.feature]
  const patientValue = featureValues?.[parsed.feature]

  const displayValue = resolvePatientValue(patientValue, entry)
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
): string | null {
  if (value === null || value === undefined) return null
  const label = entry?.value_labels?.[String(value)]
  return label ?? String(value)
}