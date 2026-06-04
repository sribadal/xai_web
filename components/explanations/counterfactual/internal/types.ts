import type { Actionability } from "@/lib/feature-actionability"
import type { GlossaryEntry } from "@/app/admin/patients/actions"

export type ModelType = "rsf" | "condor"
export type FilterMode = "treatment" | "clinical" | "all"

export type CounterfactualViewProps = {
  content: Record<string, number>
  metadata: Record<string, unknown>
  features: Record<string, unknown>
  featuresRaw?: Record<string, unknown>
  method: string
  modelType?: ModelType
  prediction?: Record<string, unknown>
  timeHorizon?: string | null
  glossary?: Record<string, GlossaryEntry>

  horizonContents?: Record<
    string,
    { content: Record<string, number>; metadata: Record<string, unknown> }
  >
  locale: string
}

export type CardEntry = {
  rawKey: string
  feature: string
  label: string
  definition?: string
  actionability: Actionability
  displayValue: string
  rawValue: number | string | null
}

export type ChangedFeature = {
  rawKey: string
  feature: string
  label: string
  definition?: string
  actionability: Actionability
  originalDisplay: string
  cfDisplay: string
  originalRaw: number | string | null
  cfRaw: number | string | null
  implausible: boolean
  implausibleReason?: string
}

export type EntryPair = {
  original: CardEntry
  counterfactual: CardEntry
}