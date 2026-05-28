import type { GlossaryEntry } from "@/app/admin/patients/actions"
import type { ModelType } from "../../shared/colors"

export type AttributionRow = {
  rawKey: string
  shortLabel: string
  fullLabel: string
  byHorizon: Record<string, number>
  byHorizonRaw: Record<string, number>
  value: number
  rawValue: number
}

export type AttributionBaseProps = {
  content: Record<string, number>
  glossary?: Record<string, GlossaryEntry>
  featureValues?: Record<string, number | string | null>
  modelType?: ModelType
  topN?: number
  showTopNSelector?: boolean
  topNOptions?: readonly number[]
}

export type ContributionViewProps = AttributionBaseProps & {
  prediction?: Record<string, unknown>
  timeHorizon?: string | null
  horizonContents?: Record<string, Record<string, number>>
  showHorizonChips?: boolean
}