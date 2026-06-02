import type { GlossaryEntry } from "@/app/admin/patients/actions"
import { buildFeatureLabel, dedupeShortLabels } from "../shared/labels"
import type { AttributionRow } from "./internal/types"

type BuildRowsArgs = {
  content: Record<string, number>
  horizonContents?: Record<string, Record<string, number>>
  sortHorizon: string
  plottedHorizons: string[]
  topN: number
  /** Optional value transform (used for percent / scaled-hazard display). */
  transform?: (raw: number) => number
  glossary?: Record<string, GlossaryEntry>
}

export function buildAttributionRows({
  content,
  horizonContents,
  sortHorizon,
  plottedHorizons,
  topN,
  transform = (v) => v,
  glossary,
}: BuildRowsArgs): AttributionRow[] {
  const sortingContent =
    horizonContents?.[sortHorizon] ?? content
  const isOverlay = !!horizonContents && plottedHorizons.length > 1

  const sortedKeys = Object.entries(sortingContent)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
    .map(([k]) => k)
    .slice(0, topN)

  const rows: AttributionRow[] = sortedKeys.map((rawKey) => {
    const labels = buildFeatureLabel(rawKey, glossary)
    const byHorizonRaw: Record<string, number> = {}
    const byHorizon: Record<string, number> = {}

    if (isOverlay && horizonContents) {
      for (const h of plottedHorizons) {
        const raw = horizonContents[h]?.[rawKey] ?? 0
        byHorizonRaw[h] = raw
        byHorizon[h] = transform(raw)
      }
    } else {
      const raw = content[rawKey] ?? 0
      byHorizonRaw[sortHorizon] = raw
      byHorizon[sortHorizon] = transform(raw)
    }

    const rawValue = byHorizonRaw[sortHorizon] ?? 0

    return {
      rawKey,
      shortLabel: labels.short,
      fullLabel: labels.full,
      byHorizon,
      byHorizonRaw,
      value: transform(rawValue),
      rawValue,
    }
  })

  dedupeShortLabels(rows)
  return rows
}