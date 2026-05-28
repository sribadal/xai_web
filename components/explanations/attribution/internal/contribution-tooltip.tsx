import type { GlossaryEntry } from "@/app/admin/patients/actions"
import { parseFeatureKey } from "@/lib/parse-feature-key"
import { FeatureMetaFooter } from "../../shared/feature-meta-footer"
import type { AttributionRow } from "./types"

type TooltipInputProps = {
  active?: boolean
  payload?: Array<{ payload: AttributionRow }>
}

type Props = TooltipInputProps & {
  glossary?: Record<string, GlossaryEntry>
  featureValues?: Record<string, number | string | null>
}

export function ContributionTooltip({
  active,
  payload,
  glossary,
  featureValues,
}: Props) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload

  const featureName = parseFeatureKey(row.rawKey).feature
  const friendlyLabel = glossary?.[featureName]?.label

  return (
    <div className="rounded-md border bg-popover px-3 py-2 shadow-md max-w-[300px]">
      {friendlyLabel ? (
        <>
          <p className="text-sm font-semibold">{friendlyLabel}</p>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
            {row.fullLabel}
          </p>
        </>
      ) : (
        <p className="text-xs font-medium">{row.fullLabel}</p>
      )}

      <FeatureMetaFooter
        rawKey={row.rawKey}
        glossary={glossary}
        featureValues={featureValues}
      />
    </div>
  )
}