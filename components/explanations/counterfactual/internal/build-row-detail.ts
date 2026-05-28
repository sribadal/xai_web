import { lookupPlausibleRange } from "./plausibility"
import type { ModelType } from "./types"

export function buildRowDetail({
  definition,
  feature,
  modelType,
  implausibleReason,
}: {
  definition?: string
  feature: string
  modelType: ModelType
  implausibleReason?: string
}): string | null {
  const parts: string[] = []

  if (definition) parts.push(definition)

  if (modelType === "rsf") {
    const range = lookupPlausibleRange(feature)
    if (range) parts.push(`Plausible range: ${range[0]}–${range[1]}`)
  }

  if (implausibleReason) parts.push(implausibleReason)

  if (parts.length === 0) return null
  return parts.join(" · ")
}